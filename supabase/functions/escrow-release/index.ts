// Brand-side payout release. Called when the brand clicks "Accept &
// Release Payment" on a live_submitted application. We don't fire the
// RazorpayX payout here — instead we *schedule* it based on the
// creator's plan tier:
//   Starter → +7 days
//   Pro     → +3 days
//   Elite   → now (next cron tick)
// payouts-cron picks up scheduled rows whose payout_release_at <= now()
// and actually fires the payout API call.
//
// If the creator has no verified payment method, we park the payout in
// 'pending_creator_info' instead — register-payout-method auto-resumes
// it when a verified method gets added.
//
// Body: { applicationId }

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

// Trial users inherit Pro per product spec (mirrors getEffectivePlan in
// src/lib/plans.js — trial = 30 days from created_at).
const TRIAL_DAYS = 30;
const PAYOUT_DELAY_DAYS: Record<string, number> = {
  starter: 7,
  pro: 3,
  elite: 0,
};

function resolveEffectivePlan(subscriptionPlan: string | null, createdAt: string | null): string {
  const explicit = (subscriptionPlan || "").toLowerCase();
  if (explicit === "starter" || explicit === "pro" || explicit === "elite") return explicit;
  if (createdAt) {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
    return days < TRIAL_DAYS ? "pro" : "starter";
  }
  return "starter";
}

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

    const { applicationId } = (await req.json().catch(() => ({}))) as { applicationId?: string };
    if (!applicationId) return json({ error: "applicationId required" }, 400);

    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select(
        "id, campaign_id, influencer_id, status, escrow_status, escrow_amount, payout_status, campaigns(brand_id, title)"
      )
      .eq("id", applicationId)
      .single();
    if (appErr || !app) return json({ error: "Application not found" }, 404);

    const brandOwner = (app as any).campaigns?.brand_id;
    if (brandOwner !== userRes.user.id) return json({ error: "forbidden" }, 403);

    if (app.escrow_status !== "held") {
      return json({ error: "Escrow is not held — cannot release" }, 409);
    }
    if (app.payout_status && app.payout_status !== "pending_creator_info") {
      return json({ error: `Payout already in state '${app.payout_status}'` }, 409);
    }

    // Resolve the creator's effective plan to pick the delay.
    const { data: profile } = await supabase
      .from("influencer_profiles")
      .select("subscription_plan, created_at")
      .eq("influencer_id", app.influencer_id)
      .maybeSingle();
    const plan = resolveEffectivePlan(profile?.subscription_plan, profile?.created_at);
    const delayDays = PAYOUT_DELAY_DAYS[plan] ?? 7;

    // Does the creator have a verified primary payment method? If not,
    // park the payout — register-payout-method auto-resumes when a
    // method gets added.
    const { data: methods } = await supabase
      .from("payment_methods")
      .select("id, validation_status, is_primary, razorpay_fund_account_id")
      .eq("user_id", app.influencer_id)
      .order("is_primary", { ascending: false });
    const verified = (methods || []).find(
      (m: any) => m.razorpay_fund_account_id && m.validation_status === "success"
    );
    const hasVerified = !!verified;

    const now = new Date();
    const releaseAt = new Date(now.getTime() + delayDays * 86_400_000).toISOString();
    const payoutStatus = hasVerified ? "scheduled" : "pending_creator_info";

    const updates: Record<string, unknown> = {
      status: "payment",
      escrow_status: "released_pending",
      payout_status: payoutStatus,
      payout_scheduled_at: now.toISOString(),
      payout_release_at: releaseAt,
      updated_at: now.toISOString(),
    };

    const { error: updErr } = await supabase
      .from("campaign_applications")
      .update(updates)
      .eq("id", applicationId);
    if (updErr) return json({ error: "Could not schedule payout: " + updErr.message }, 500);

    // Notify the creator. Two flavours: "your money is on the way" vs
    // "your money is waiting on payout info". Both are high-priority for
    // the influencer; we keep priority=normal because they get a banner +
    // email regardless.
    const campaignTitle = (app as any).campaigns?.title || "your campaign";
    const amountInr = Math.round((app.escrow_amount || 0) / 100);
    const niceDate = new Date(releaseAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await supabase.from("notifications").insert({
      user_id: app.influencer_id,
      type: hasVerified ? "payout_scheduled" : "payout_pending_info",
      title: hasVerified ? "Payment is on the way" : "Add payout details to receive your payment",
      body: JSON.stringify({
        text: hasVerified
          ? `₹${amountInr.toLocaleString("en-IN")} for "${campaignTitle}" will arrive by ${niceDate}.`
          : `₹${amountInr.toLocaleString("en-IN")} for "${campaignTitle}" is waiting — add a UPI or bank account to receive it.`,
        link: hasVerified ? `/influencer/profile/payments` : `/influencer/profile/payments?add=1`,
        applicationId,
        amount_paise: app.escrow_amount,
      }),
      is_read: false,
    });

    // Email (fire-and-forget). The send-account-event-email function we
    // already use for deletion/reactivation emails can't reuse here
    // because it derives the recipient from the JWT (which is the brand).
    // We need a fresh send-email call for the creator.
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const { data: creatorAuth } = await supabase.auth.admin.getUserById(app.influencer_id);
      const creatorEmail = creatorAuth?.user?.email;
      if (creatorEmail) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
          body: JSON.stringify({
            to: creatorEmail,
            subject: hasVerified
              ? `₹${amountInr.toLocaleString("en-IN")} on the way for "${campaignTitle}"`
              : `Add payout details to receive ₹${amountInr.toLocaleString("en-IN")}`,
            html: hasVerified
              ? `<p>Great news! A brand has released payment for your campaign "<strong>${campaignTitle}</strong>".</p>
                 <p><strong>Amount:</strong> ₹${amountInr.toLocaleString("en-IN")}<br/>
                    <strong>Expected by:</strong> ${niceDate}</p>
                 <p>Track the status in your <a href="https://rgossips.com/influencer/profile/payments">Payments</a> section.</p>`
              : `<p>A brand has released payment for your campaign "<strong>${campaignTitle}</strong>", but we don't have your payout details on file yet.</p>
                 <p><strong>Amount waiting:</strong> ₹${amountInr.toLocaleString("en-IN")}</p>
                 <p>Add a UPI ID or bank account in your <a href="https://rgossips.com/influencer/profile/payments?add=1">Payments</a> section to receive it.</p>`,
          }),
        });
      }
    } catch (e) {
      console.error("escrow-release: send-email failed:", e);
    }

    return json({
      ok: true,
      payout_status: payoutStatus,
      payout_release_at: releaseAt,
      plan,
      delay_days: delayDays,
    });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
