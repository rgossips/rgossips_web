// Attribute-referral — called by create-profile after a new influencer
// finishes signup. Writes a PENDING row on public.referrals so the
// subscription webhook can later flip it to QUALIFIED and grant RC.
//
// Called with { userId, referralCode }.
//
// Guards enforced here (server-side, never trust the client):
//   1. Referral code must exist on some influencer's profile.
//   2. Referrer must have an ACTIVE subscription right now (Phase-0
//      decision #6 — strict).
//   3. Self-referral rejected (referrer_id != referee_id).
//   4. Referee must not already be attributed to another referral row.
//
// On any guard failure we return { attributed: false, reason: '…' }
// and DO NOT throw — signup should never fail because of a bad ref
// code.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const userId = (body?.userId || "").toString().trim();
    const rawCode = (body?.referralCode || body?.ref || "").toString().trim();
    // Fraud-attribution — device fingerprint is a client-supplied hash
    // (canvas + UA + timezone), IP falls back to what the caller sent or
    // whatever the edge proxy stamped on x-forwarded-for.
    const deviceFingerprint = (body?.deviceFingerprint || "").toString().trim().slice(0, 128) || null;
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const signupIp =
      (body?.signupIp || forwardedFor.split(",")[0] || "").toString().trim() || null;

    if (!userId) {
      return new Response(JSON.stringify({ attributed: false, reason: "missing_user" }), { status: 200, headers: jsonHeaders });
    }
    if (!rawCode) {
      return new Response(JSON.stringify({ attributed: false, reason: "no_code" }), { status: 200, headers: jsonHeaders });
    }

    // Normalise. Slugs are case-sensitive on the profile row so we store
    // exactly what the referrer received. Callers occasionally paste
    // with whitespace or trailing punctuation from copy/paste — trim
    // outer whitespace only; slug chars are a-zA-Z0-9 by generator.
    const referralCode = rawCode.replace(/[^A-Za-z0-9_-]/g, "");
    if (referralCode.length < 4 || referralCode.length > 32) {
      return new Response(JSON.stringify({ attributed: false, reason: "bad_code" }), { status: 200, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Resolve referrer.
    const { data: referrer } = await supabase
      .from("influencer_profiles")
      .select("influencer_id, subscription_plan, stripe_subscription_id, razorpay_subscription_id")
      .eq("referral_code", referralCode)
      .maybeSingle();
    if (!referrer) {
      return new Response(JSON.stringify({ attributed: false, reason: "code_not_found" }), { status: 200, headers: jsonHeaders });
    }

    // 3. Self-referral rejected.
    if (referrer.influencer_id === userId) {
      return new Response(JSON.stringify({ attributed: false, reason: "self_referral" }), { status: 200, headers: jsonHeaders });
    }

    // 2. Referrer must be actively subscribed. Cheapest check: their
    // subscription_plan on the profile row is not 'trial' AND they
    // have some active subscription id set by the last webhook. This
    // matches how PricingCTA and ProStatusCard read subscription state.
    const hasActiveSub =
      referrer.subscription_plan &&
      referrer.subscription_plan !== "trial" &&
      (!!referrer.stripe_subscription_id || !!referrer.razorpay_subscription_id);
    if (!hasActiveSub) {
      return new Response(
        JSON.stringify({ attributed: false, reason: "referrer_not_subscribed" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 4. Referee already attributed?
    const { data: existing } = await supabase
      .from("referrals")
      .select("id, status")
      .eq("referee_id", userId)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ attributed: false, reason: "already_attributed", existingStatus: existing.status }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 5. Fraud pre-check — same device / same IP already used by another
    // referee under this referrer? That's a strong duplicate-account
    // signal. We don't reject outright (VPNs + shared devices happen),
    // we route to MANUAL_REVIEW so an admin can approve on inspection.
    let initialStatus: "SIGNED_UP" | "MANUAL_REVIEW" = "SIGNED_UP";
    let reviewReason: string | null = null;
    if (deviceFingerprint) {
      const { count: dupDevice } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", referrer.influencer_id)
        .eq("device_fingerprint", deviceFingerprint);
      if ((dupDevice ?? 0) >= 1) {
        initialStatus = "MANUAL_REVIEW";
        reviewReason = "duplicate_device_fp";
      }
    }
    if (initialStatus !== "MANUAL_REVIEW" && signupIp) {
      // Same-IP-within-referrer at N ≥ 3 flags for review. Small values
      // of N would false-positive on shared home/office IPs; we lean
      // permissive here because MANUAL_REVIEW blocks reward but keeps
      // the row for later approval.
      const { count: dupIp } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", referrer.influencer_id)
        .eq("signup_ip", signupIp);
      if ((dupIp ?? 0) >= 3) {
        initialStatus = "MANUAL_REVIEW";
        reviewReason = "duplicate_signup_ip";
      }
    }

    // Everything checks out — write the SIGNED_UP (or MANUAL_REVIEW) row
    // (skip PENDING since we already have the referee id at this point).
    const { data: inserted, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.influencer_id,
        referee_id: userId,
        referral_code: referralCode,
        status: initialStatus,
        signed_up_at: new Date().toISOString(),
        signup_ip: signupIp,
        device_fingerprint: deviceFingerprint,
        review_reason: reviewReason,
      })
      .select("id")
      .single();
    if (error) {
      console.error("attribute-referral insert failed:", error.message);
      return new Response(JSON.stringify({ attributed: false, reason: "db_error" }), { status: 200, headers: jsonHeaders });
    }

    // Referrer-side notification (Phase 2). Non-blocking — signup should
    // never fail because we couldn't queue a notification row. On a
    // MANUAL_REVIEW row we skip this: the referrer shouldn't be told
    // "someone joined" until an admin has cleared the review.
    if (initialStatus === "SIGNED_UP") {
      try {
        await supabase.from("notifications").insert({
          user_id: referrer.influencer_id,
          type: "referral_signup",
          title: "A friend just signed up",
          body: JSON.stringify({
            text: "Someone joined RGossips with your referral link. You'll earn RC as soon as they subscribe.",
            link: "/influencer/refer",
          }),
          is_read: false,
        });
      } catch (_) { /* non-fatal */ }
    }

    return new Response(
      JSON.stringify({ attributed: true, referralId: inserted.id, status: initialStatus }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("attribute-referral error:", (err as any)?.message || err);
    return new Response(
      JSON.stringify({ attributed: false, reason: "internal" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
