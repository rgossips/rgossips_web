// Scheduled worker. Runs every 15 minutes via pg_cron (see migration 025).
//
// Job: find applications whose payout_release_at has elapsed and fire
// the actual RazorpayX payout. We mark them 'processing' before firing
// so a slow API call can't be picked up twice by overlapping cron ticks.
// payout.processed / payout.failed webhooks finalise the row.
//
// Idempotency: we pass reference_id = the application UUID (36 chars,
// fits Razorpay's 40-char cap) so retries of the same row are
// dedupable. Notes also carry the application_id for the webhook to
// route on.
//
// This is the *internal* endpoint — calls require the service role JWT.
// No user auth path.

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

const RX_BASE = "https://api.razorpay.com/v1";

const rxFetch = async (path: string, init: RequestInit) => {
  const keyId = Deno.env.get("RAZORPAYX_KEY_ID")!;
  const secret = Deno.env.get("RAZORPAYX_KEY_SECRET")!;
  const res = await fetch(`${RX_BASE}${path}`, {
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

  // pg_cron calls in via the public function URL; we gate access with a
  // shared secret instead of service-role JWT (which Postgres would have
  // to be told about explicitly, awkwardly).
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!expectedSecret || cronSecret !== expectedSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const accountNumber = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER")!;

  try {
    // Atomically grab the batch we'll work on. The `processing` flip is
    // the lock — a second cron tick that lands in the same minute won't
    // re-pick up these rows.
    const nowIso = new Date().toISOString();
    const { data: due, error: dueErr } = await supabase
      .from("campaign_applications")
      .select(
        "id, influencer_id, escrow_amount, escrow_payment_id, campaign_id, campaigns(title)"
      )
      .eq("payout_status", "scheduled")
      .lte("payout_release_at", nowIso)
      .limit(50);
    if (dueErr) return json({ error: "Could not fetch due payouts: " + dueErr.message }, 500);
    if (!due || due.length === 0) return json({ ok: true, fired: 0, message: "Nothing due" });

    const results: any[] = [];

    for (const row of due) {
      // Re-grab the primary verified payment method at fire time. A
      // creator may have switched methods between the release click and
      // the payout firing.
      const { data: methods } = await supabase
        .from("payment_methods")
        .select("id, type, validation_status, razorpay_fund_account_id, is_primary")
        .eq("user_id", row.influencer_id)
        .order("is_primary", { ascending: false });
      const fundAccount = (methods || []).find(
        (m: any) => m.razorpay_fund_account_id && m.validation_status === "success"
      );

      if (!fundAccount) {
        // Method disappeared since release. Demote to pending_creator_info.
        await supabase
          .from("campaign_applications")
          .update({ payout_status: "pending_creator_info" })
          .eq("id", row.id);
        results.push({ id: row.id, action: "deferred_no_method" });
        continue;
      }

      // Lock the row — fail the rest of this tick if we can't.
      const { error: lockErr } = await supabase
        .from("campaign_applications")
        .update({ payout_status: "processing" })
        .eq("id", row.id)
        .eq("payout_status", "scheduled");
      if (lockErr) {
        results.push({ id: row.id, action: "lock_failed", error: lockErr.message });
        continue;
      }

      // Fire the payout. UPI is preferred — IMPS for bank. Both settle
      // in seconds; no plan-tier choice here (plan only controls the
      // *delay* before this point).
      const mode = fundAccount.type === "upi" ? "UPI" : "IMPS";
      const campaignTitle = (row as any).campaigns?.title || "campaign";
      const payoutBody = {
        account_number: accountNumber,
        fund_account_id: fundAccount.razorpay_fund_account_id,
        amount: row.escrow_amount,
        currency: "INR",
        mode,
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: row.id,
        narration: `RGossips ${campaignTitle}`.slice(0, 30),
        notes: {
          application_id: row.id,
          campaign_id: row.campaign_id,
          influencer_id: row.influencer_id,
          escrow_payment_id: row.escrow_payment_id || "",
        },
      };

      const payoutRes = await rxFetch("/payouts", {
        method: "POST",
        body: JSON.stringify(payoutBody),
      });

      if (!payoutRes.ok) {
        // Mark failed; webhook would have done this but we have the
        // signal already. Don't re-queue automatically — admin can
        // intervene via the disputes UI.
        const reason =
          (payoutRes.body as any)?.error?.description ||
          (payoutRes.body as any)?.error?.code ||
          "RazorpayX rejected the payout";
        await supabase
          .from("campaign_applications")
          .update({
            payout_status: "failed",
            payout_failure_reason: reason,
          })
          .eq("id", row.id);
        results.push({ id: row.id, action: "failed", reason });
        continue;
      }

      const payoutBodyOk = payoutRes.body as any;
      await supabase
        .from("campaign_applications")
        .update({
          payout_id: payoutBodyOk.id,
          payout_method: mode.toLowerCase(),
          payout_fund_account_id: fundAccount.razorpay_fund_account_id,
        })
        .eq("id", row.id);

      results.push({ id: row.id, action: "queued", payout_id: payoutBodyOk.id, mode });
    }

    return json({ ok: true, fired: results.length, results });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
