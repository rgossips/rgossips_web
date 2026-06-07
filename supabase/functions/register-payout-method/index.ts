// Register a UPI or bank-account payout method on RazorpayX, then mirror
// it into payment_methods.
//
// Why this exists: the Add Payment Method modal used to do a direct
// supabase.from("payment_methods").insert(...). That stored the method
// for display only — RazorpayX had no idea about it, so a release would
// have nowhere to send funds. This function:
//   1. Creates a RazorpayX Contact for the user if one doesn't already
//      exist (cached on influencer_profiles.razorpay_contact_id).
//   2. Creates a RazorpayX Fund Account for the new method.
//   3. Fires a fund-account validation (₹1 name-match check) so we catch
//      typos / mismatched holder names at save time, not at payout time.
//   4. Inserts the payment_methods row with the RazorpayX IDs.
//   5. Auto-resumes any waiting payouts in pending_creator_info status.
//
// Body shape:
//   { type: "upi", upi_id, holder_name, label?, is_primary?: boolean }
//   { type: "bank", account_holder_name, account_number, ifsc,
//                   bank_name, label?, is_primary?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type UpiBody = {
  type: "upi";
  upi_id: string;
  holder_name?: string;
  label?: string;
  is_primary?: boolean;
};

type BankBody = {
  type: "bank";
  account_holder_name: string;
  account_number: string;
  ifsc: string;
  bank_name?: string;
  label?: string;
  is_primary?: boolean;
};

const rxBase = "https://api.razorpay.com/v1";

const rxFetch = async (path: string, init: RequestInit) => {
  const keyId = Deno.env.get("RAZORPAYX_KEY_ID")!;
  const secret = Deno.env.get("RAZORPAYX_KEY_SECRET")!;
  const res = await fetch(`${rxBase}${path}`, {
    ...init,
    headers: {
      Authorization: "Basic " + btoa(`${keyId}:${secret}`),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);
    const userId = userRes.user.id;

    const payload = (await req.json().catch(() => ({}))) as UpiBody | BankBody;

    // Server-side guard — same NPCI VPA shape the client checks. The
    // client form runs this too but a malformed VPA reaching here would
    // get rejected by Razorpay with a noisy "fund_account.vpa.address
    // is invalid" error; this is a friendlier 400.
    if (payload?.type === "upi") {
      const vpa = String((payload as UpiBody).upi_id || "").trim();
      const at = vpa.indexOf("@");
      const otherAt = vpa.indexOf("@", at + 1);
      const [user, handle] = vpa.split("@");
      const userOk = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,49}$/.test(user || "");
      const handleOk = /^[a-zA-Z][a-zA-Z0-9.]{1,29}$/.test(handle || "");
      if (!vpa || at < 0 || otherAt !== -1 || !userOk || !handleOk || vpa.length > 50) {
        return json({ error: "Invalid UPI ID format." }, 400);
      }
    }

    // ----------------------------------------------------------------
    // 1. Per-user RazorpayX Contact (cached on influencer_profiles).
    //    We use upsert semantics: if the profile already has one, reuse
    //    it. Otherwise create + cache.
    // ----------------------------------------------------------------
    const { data: profile, error: profErr } = await supabase
      .from("influencer_profiles")
      .select("influencer_id, razorpay_contact_id, full_name, username, email")
      .eq("influencer_id", userId)
      .maybeSingle();
    if (profErr) return json({ error: "Profile lookup failed: " + profErr.message }, 500);
    if (!profile) return json({ error: "Influencer profile not found" }, 404);

    let contactId = profile.razorpay_contact_id as string | null;
    if (!contactId) {
      // Phone + email live on auth.users (the Supabase auth standard);
      // influencer_profiles doesn't carry phone. Pull from there as a
      // last resort if profile.email is empty too.
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const authPhone = authUser?.user?.phone || "";
      const authEmail = authUser?.user?.email || "";

      // Razorpay Contact requires a name; bank/UPI account-holder name is
      // a better fallback than the profile.username (which may be an IG
      // handle that mismatches the bank name).
      const holderName =
        payload.type === "bank"
          ? payload.account_holder_name
          : (payload as UpiBody).holder_name || profile.full_name || profile.username || "Creator";

      const contactRes = await rxFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: holderName,
          email: profile.email || authEmail || undefined,
          contact: authPhone || undefined,
          type: "vendor",
          // Razorpay caps reference_id at 40 chars; a bare UUID is 36
          // and still unique enough to find the contact later.
          reference_id: userId,
        }),
      });
      if (!contactRes.ok) {
        return json(
          { error: "Could not create RazorpayX contact", razorpay: contactRes.body },
          502
        );
      }
      contactId = (contactRes.body as any).id;
      await supabase
        .from("influencer_profiles")
        .update({ razorpay_contact_id: contactId })
        .eq("influencer_id", userId);
    }

    // ----------------------------------------------------------------
    // 2. Create the Fund Account on RazorpayX.
    // ----------------------------------------------------------------
    const fundAccountBody =
      payload.type === "upi"
        ? {
            contact_id: contactId,
            account_type: "vpa",
            vpa: { address: payload.upi_id.trim() },
          }
        : {
            contact_id: contactId,
            account_type: "bank_account",
            bank_account: {
              name: payload.account_holder_name.trim(),
              ifsc: payload.ifsc.trim().toUpperCase(),
              account_number: payload.account_number.trim(),
            },
          };

    const fundRes = await rxFetch("/fund_accounts", {
      method: "POST",
      body: JSON.stringify(fundAccountBody),
    });
    if (!fundRes.ok) {
      return json(
        { error: "Could not register fund account on RazorpayX", razorpay: fundRes.body },
        502
      );
    }
    const fundAccountId = (fundRes.body as any).id as string;

    // ----------------------------------------------------------------
    // 3. Validation strategy diverges by method:
    //
    //   Bank → we fire the bank-account validation API (₹1.18 debit +
    //   IMPS name-match). Razorpay returns status='created' immediately
    //   and the result arrives async via
    //   fund_account.validation.completed webhook, which flips the row.
    //
    //   UPI  → Razorpay does NOT offer a synchronous name-match for
    //   VPAs, and the bank-account validation API rejects VPA fund
    //   accounts. The VPA was already syntax-checked above, so we trust
    //   the user-entered value. If the VPA turns out to be wrong, the
    //   payout itself fails loudly and the user can fix the method —
    //   no money is lost.
    // ----------------------------------------------------------------
    let validationStatus: "pending" | "success" | "failed" = "pending";
    let validationFailureReason: string | null = null;
    let validatedAt: string | null = null;

    if (payload.type === "upi") {
      // No upstream validation available — accept on syntax check.
      validationStatus = "success";
      validatedAt = new Date().toISOString();
    } else {
      const accountNumber = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER");
      if (!accountNumber) {
        console.warn("RAZORPAYX_ACCOUNT_NUMBER not set — skipping validation");
      } else {
        const valRes = await rxFetch("/fund_accounts/validations", {
          method: "POST",
          body: JSON.stringify({
            account_number: accountNumber,
            fund_account: { id: fundAccountId },
            amount: 100,         // paise — ₹1 test debit, reversed instantly
            currency: "INR",
            notes: { user_id: userId },
          }),
        });
        if (valRes.ok) {
          const status = (valRes.body as any).status;
          if (status === "completed" || status === "active") {
            validationStatus = "success";
            validatedAt = new Date().toISOString();
          } else if (status === "failed") {
            validationStatus = "failed";
            validationFailureReason =
              (valRes.body as any).results?.account_status ||
              (valRes.body as any).results?.registered_name ||
              "Validation failed";
          }
          // status === "created" → async; webhook will flip later.
        } else {
          // Validation API call itself failed — keep status pending and let
          // the webhook take over. Don't block the save.
          console.warn("Fund account validation call failed:", valRes.body);
        }
      }
    }

    // ----------------------------------------------------------------
    // 4. Insert into payment_methods. First method auto-primary.
    // ----------------------------------------------------------------
    const { count: existingCount } = await supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    const isPrimary = (existingCount ?? 0) === 0 || payload.is_primary === true;

    const insertRow =
      payload.type === "upi"
        ? {
            user_id: userId,
            type: "upi" as const,
            label: payload.label || "UPI",
            upi_id: payload.upi_id.trim(),
            account_holder_name:
              (payload as UpiBody).holder_name || profile.full_name || null,
            razorpay_fund_account_id: fundAccountId,
            validation_status: validationStatus,
            validation_failure_reason: validationFailureReason,
            validated_at: validatedAt,
            is_primary: isPrimary,
          }
        : {
            user_id: userId,
            type: "bank" as const,
            label: payload.label || "Bank Account",
            account_holder_name: payload.account_holder_name.trim(),
            bank_name: payload.bank_name?.trim() || null,
            account_number: payload.account_number.trim(),
            ifsc: payload.ifsc.trim().toUpperCase(),
            razorpay_fund_account_id: fundAccountId,
            validation_status: validationStatus,
            validation_failure_reason: validationFailureReason,
            validated_at: validatedAt,
            is_primary: isPrimary,
          };

    // If this row will be primary, clear any existing primaries first to
    // satisfy the partial unique index.
    if (isPrimary) {
      await supabase
        .from("payment_methods")
        .update({ is_primary: false })
        .eq("user_id", userId);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("payment_methods")
      .insert(insertRow)
      .select()
      .single();
    if (insertErr) {
      return json({ error: "Could not save payment method: " + insertErr.message }, 500);
    }

    // ----------------------------------------------------------------
    // 5. Auto-resume any waiting payouts. If validation succeeded AND
    //    this is now the primary method, flip pending_creator_info rows
    //    so the next cron tick picks them up.
    // ----------------------------------------------------------------
    let resumedCount = 0;
    if (validationStatus === "success" && isPrimary) {
      const { data: resumed, error: resumeErr } = await supabase
        .from("campaign_applications")
        .update({ payout_status: "scheduled" })
        .eq("influencer_id", userId)
        .eq("payout_status", "pending_creator_info")
        .select("id");
      if (!resumeErr) resumedCount = resumed?.length || 0;
    }

    return json({
      ok: true,
      payment_method: inserted,
      razorpay_fund_account_id: fundAccountId,
      validation_status: validationStatus,
      resumed_payouts: resumedCount,
    });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
