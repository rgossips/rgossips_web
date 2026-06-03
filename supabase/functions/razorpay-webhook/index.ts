// Razorpay webhook handler — mirrors stripe-webhook's contract, so the
// shared setUserPlan flow (template-reset on downgrade + plan_upgraded
// notification on upgrade) lights up exactly the same way regardless of
// which gateway the user paid through.
//
// Required env:
//   RAZORPAY_WEBHOOK_SECRET — paste this from Razorpay → Settings → Webhooks
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Subscribe in the Razorpay dashboard to these events:
//   subscription.activated
//   subscription.charged
//   subscription.cancelled
//   subscription.completed
//   subscription.halted
//
// IMPORTANT: deploy with --no-verify-jwt so Razorpay (which has no JWT)
// can post here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// HMAC-SHA256 signature check — Razorpay's standard webhook verification.
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

// Shared "what plan should a user be on now" logic. Identical shape to
// stripe-webhook's setUserPlan so the side effects (template reset,
// plan_upgraded notification) behave the same regardless of gateway.
async function setUserPlan(userId: string, plan: string, extras: Record<string, unknown> = {}) {
  if (!userId) return;

  const { data: prior } = await supabase
    .from("influencer_profiles")
    .select("subscription_plan, media_kit_template")
    .eq("influencer_id", userId)
    .maybeSingle();
  const previousPlan = prior?.subscription_plan || "";
  const previousTemplate = prior?.media_kit_template || "classic";

  const TEMPLATE_MIN_PLAN: Record<string, string> = {
    classic: "starter",
    glass_blue: "pro",
    editorial_noir: "pro",
    bento_sunset: "pro",
    neo_brutalist: "pro",
  };
  const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, elite: 3 };
  const requiredRank = PLAN_RANK[TEMPLATE_MIN_PLAN[previousTemplate] || "starter"] || 0;
  const nextPlanRank = PLAN_RANK[plan] || 0;
  const templateNoLongerAllowed = requiredRank > nextPlanRank;

  const templateReset: Record<string, unknown> = templateNoLongerAllowed
    ? { media_kit_template: "classic" }
    : {};

  const { error } = await supabase
    .from("influencer_profiles")
    .update({
      subscription_plan: plan,
      payment_gateway: "razorpay",
      ...templateReset,
      ...extras,
      updated_at: new Date().toISOString(),
    })
    .eq("influencer_id", userId);
  if (error) {
    console.error("Failed to update plan:", error.message);
    return;
  }

  if (templateNoLongerAllowed) {
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "media_kit_template_reset",
        title: "Media kit reset to Classic",
        body: JSON.stringify({
          text: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan only includes the Classic media-kit template, so your kit was switched back. Pick another any time from /influencer/media-kit.`,
          link: "/influencer/media-kit",
        }),
        is_read: false,
      });
    } catch (e) {
      console.error("media_kit_template_reset notification insert failed:", (e as any)?.message);
    }
  }

  const planRank: Record<string, number> = { free: 0, trial: 1, starter: 2, pro: 3, elite: 4 };
  const prevRank = planRank[previousPlan] ?? 0;
  const nextRank = planRank[plan] ?? 0;
  if (nextRank > prevRank && nextRank >= planRank.pro) {
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "plan_upgraded",
        title: `Welcome to ${planLabel} 🎉`,
        body: JSON.stringify({
          text: `Thanks for upgrading! Your ${planLabel} features are unlocked — head to your dashboard to explore what's new.`,
          link: "/influencer",
        }),
        is_read: false,
      });
    } catch (e) {
      console.error("plan_upgraded notification insert failed:", (e as any)?.message);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const body = await req.text();

  if (webhookSecret) {
    const ok = await verifySignature(body, signature, webhookSecret);
    if (!ok) {
      console.error("Razorpay signature verification failed");
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }
  } else {
    console.warn("RAZORPAY_WEBHOOK_SECRET not set — running unverified");
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  try {
    const type = String(event?.event || "");
    const sub = event?.payload?.subscription?.entity;
    if (!sub) {
      return new Response(JSON.stringify({ received: true, skipped: "no subscription payload" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // notes are echoed back exactly as we sent them on subscription create.
    // user_id is our primary join key.
    const notes = sub.notes || {};
    const userId = String(notes.user_id || "");
    const plan = String(notes.plan || "").toLowerCase();
    const cycle = String(notes.cycle || "monthly").toLowerCase();
    const subscriptionId = String(sub.id || "");
    const customerId = String(sub.customer_id || "");

    if (!userId) {
      console.error("razorpay webhook missing user_id on subscription notes");
      return new Response(JSON.stringify({ received: true, skipped: "no user_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (type) {
      case "subscription.activated":
      case "subscription.charged": {
        // First charge OR a successful renewal. Either way the user is on
        // the paid plan right now.
        if (plan) {
          await setUserPlan(userId, plan, {
            billing_cycle: cycle,
            razorpay_customer_id: customerId,
            razorpay_subscription_id: subscriptionId,
          });
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.halted": {
        // Cancelled = user cancelled. completed = total_count reached.
        // halted = payment failure exhausted retries. All three mean the
        // user is no longer paying, so we drop them back to starter — same
        // behaviour as the Stripe cancel-at-period-end flow.
        await setUserPlan(userId, "starter");
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
