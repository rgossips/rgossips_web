// Register a UPI or bank-account payout method.
//
// As of the manual-payouts switch (Option 1, replacing RazorpayX), this
// function no longer talks to RazorpayX. It validates the payload, saves
// the method to `payment_methods`, and auto-resumes any waiting payouts
// from `pending_creator_info` to `scheduled` so the admin queue picks
// them up.
//
// The razorpay_contact_id / razorpay_fund_account_id columns stay on the
// row for backwards compat (left null on new inserts).
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

    // Server-side guard — same NPCI VPA shape the client checks.
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
    } else if (payload?.type === "bank") {
      // Light shape checks — IFSC is 11 chars, account number ≥ 9 digits.
      const ifsc = String((payload as BankBody).ifsc || "").trim().toUpperCase();
      const acct = String((payload as BankBody).account_number || "").trim();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return json({ error: "Invalid IFSC." }, 400);
      if (!/^[0-9]{9,18}$/.test(acct)) return json({ error: "Invalid account number." }, 400);
      if (!(payload as BankBody).account_holder_name?.trim()) {
        return json({ error: "Account holder name is required." }, 400);
      }
    } else {
      return json({ error: "Unsupported payment method type." }, 400);
    }

    // Profile lookup — keeps us behind a 404 if the user signed in but
    // never finished influencer profile creation.
    const { data: profile, error: profErr } = await supabase
      .from("influencer_profiles")
      .select("influencer_id, full_name")
      .eq("influencer_id", userId)
      .maybeSingle();
    if (profErr) return json({ error: "Profile lookup failed: " + profErr.message }, 500);
    if (!profile) return json({ error: "Influencer profile not found" }, 404);

    // Manual-payout validation policy:
    //   UPI  → trust the syntax check. Razorpay never offered a sync
    //          name-match anyway and the admin verifies at payout time.
    //   Bank → mark `manual` so the admin queue surfaces an "unverified"
    //          banner. They'll eyeball the IFSC/account before sending.
    const validationStatus: "success" | "manual" =
      payload.type === "upi" ? "success" : "manual";
    const validatedAt = payload.type === "upi" ? new Date().toISOString() : null;

    // First method auto-primary.
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
            razorpay_fund_account_id: null,
            validation_status: validationStatus,
            validation_failure_reason: null,
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
            razorpay_fund_account_id: null,
            validation_status: validationStatus,
            validation_failure_reason: null,
            validated_at: validatedAt,
            is_primary: isPrimary,
          };

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

    // Auto-resume any waiting payouts. UPI flips straight to `scheduled`
    // (admin queue). Bank stays pending_creator_info until admin marks
    // it verified — we don't auto-release funds to an unverified bank.
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
      validation_status: validationStatus,
      resumed_payouts: resumedCount,
    });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
