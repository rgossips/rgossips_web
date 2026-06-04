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

// Cancel any "other" active subscriptions on the user's profile so a user
// can never be billed by two gateways simultaneously. The newly-paid
// subscription id is passed so we never cancel ourselves.
async function cancelPriorSubscriptions(opts: {
  userId: string;
  skipRazorpaySubId?: string | null;
  priorStripe: string | null;
  priorRazorpay: string | null;
}) {
  const { skipRazorpaySubId, priorStripe, priorRazorpay } = opts;

  // Razorpay: ignore if the prior sub IS the one we just activated.
  if (priorRazorpay && priorRazorpay !== skipRazorpaySubId) {
    try {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (keyId && keySecret) {
        const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
        const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(priorRazorpay)}/cancel`, {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({ cancel_at_cycle_end: 0 }),
        });
        const out = await res.json();
        if (out?.error) {
          const desc = out?.error?.description || "";
          if (!/already|status/i.test(desc)) {
            console.error("Razorpay cancel returned error:", JSON.stringify(out));
          }
        } else {
          console.log("Cancelled prior Razorpay subscription", priorRazorpay);
        }
      }
    } catch (e: any) {
      console.error("Failed to cancel prior Razorpay subscription", priorRazorpay, e?.message || String(e));
    }
  }

  if (priorStripe) {
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(priorStripe)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        if (!res.ok) {
          const body = await res.text();
          // 404 / already canceled is fine.
          if (!/No such subscription|resource_missing|already canceled/i.test(body)) {
            console.error("Failed to cancel prior Stripe subscription", priorStripe, body);
          }
        } else {
          console.log("Cancelled prior Stripe subscription", priorStripe);
        }
      }
    } catch (e: any) {
      console.error("Failed to cancel prior Stripe subscription", priorStripe, e?.message || String(e));
    }
  }
}

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
    .select("subscription_plan, media_kit_template, stripe_subscription_id, razorpay_subscription_id")
    .eq("influencer_id", userId)
    .maybeSingle();
  const previousPlan = prior?.subscription_plan || "";
  const previousTemplate = prior?.media_kit_template || "classic";

  // Single-active-subscription rule. The user just paid through Razorpay;
  // cancel anything that was previously active either on Razorpay (a
  // different sub id — happens on plan change) or on Stripe (gateway
  // switch). Non-fatal on failure: we still activate the newly-paid sub
  // so the customer gets what they bought.
  const newRazorpaySubId = (extras as any).razorpay_subscription_id as string | undefined;
  await cancelPriorSubscriptions({
    userId,
    skipRazorpaySubId: newRazorpaySubId,
    priorStripe: prior?.stripe_subscription_id || null,
    priorRazorpay: prior?.razorpay_subscription_id || null,
  });

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
        // the paid plan right now. Also null out the Stripe ids — if the
        // user just switched to Razorpay from Stripe, the Stripe sub was
        // cancelled in cancelPriorSubscriptions but its id was still on
        // the row; without clearing it a subsequent Stripe cancellation
        // webhook would (mis)recognise the row as "currently on Stripe"
        // and downgrade the user.
        if (plan) {
          await setUserPlan(userId, plan, {
            billing_cycle: cycle,
            razorpay_customer_id: customerId,
            razorpay_subscription_id: subscriptionId,
            stripe_subscription_id: null,
            stripe_customer_id: null,
          });
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.halted": {
        // Cancelled = user cancelled. completed = total_count reached.
        // halted = payment failure exhausted retries.
        //
        // Two skip conditions:
        //   (a) The user has since switched gateways (payment_gateway
        //       is no longer "razorpay") — this event is for a stale
        //       sub from before the switch. Don't downgrade.
        //   (b) The sub id on the row doesn't match — typically a
        //       prior Razorpay sub we cancelled during an upgrade chain.
        const { data: current } = await supabase
          .from("influencer_profiles")
          .select("razorpay_subscription_id, payment_gateway")
          .eq("influencer_id", userId)
          .maybeSingle();
        if (current?.payment_gateway && current.payment_gateway !== "razorpay") {
          console.log(
            "Ignoring Razorpay cancellation — user switched gateways",
            subscriptionId
          );
          break;
        }
        if (current?.razorpay_subscription_id && current.razorpay_subscription_id !== subscriptionId) {
          console.log(
            "Ignoring cancellation of stale Razorpay sub",
            subscriptionId,
            "— current is",
            current.razorpay_subscription_id
          );
          break;
        }
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
