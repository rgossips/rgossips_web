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

    // Everything checks out — write the SIGNED_UP row (skip PENDING
    // since we already have the referee id at this point).
    const { data: inserted, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.influencer_id,
        referee_id: userId,
        referral_code: referralCode,
        status: "SIGNED_UP",
        signed_up_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      console.error("attribute-referral insert failed:", error.message);
      return new Response(JSON.stringify({ attributed: false, reason: "db_error" }), { status: 200, headers: jsonHeaders });
    }

    return new Response(
      JSON.stringify({ attributed: true, referralId: inserted.id }),
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
