// Stripe webhook handler — updates `influencer_profiles.subscription_plan`
// based on subscription lifecycle events.
//
// Required env:
//   STRIPE_WEBHOOK_SECRET — whsec_... from Stripe dashboard webhook config
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Set this function URL in Stripe → Developers → Webhooks to receive:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
//
// IMPORTANT: deploy with `--no-verify-jwt` so Stripe (which has no JWT)
// can post here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function setUserPlan(userId: string, plan: string, extras: Record<string, unknown> = {}) {
  if (!userId) return;
  // Read the existing plan + current template so we can (a) fire a thank-you
  // notification only on an actual upgrade and (b) force the kit back to
  // Classic when the new plan can't legally use whatever template they
  // had picked under their trial / previous plan.
  const { data: prior } = await supabase
    .from("influencer_profiles")
    .select("subscription_plan, media_kit_template")
    .eq("influencer_id", userId)
    .maybeSingle();
  const previousPlan = prior?.subscription_plan || "";
  const previousTemplate = prior?.media_kit_template || "classic";

  // Template → minimum plan needed to *save* it (Starter only gets Classic;
  // everything else is Pro+). Trial users get Pro features, so when they
  // upgrade to a paid Starter plan their fancy template suddenly isn't
  // allowed any more — reset to Classic instead of leaving an orphaned
  // selection that the picker would silently reject on the next save.
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
      ...templateReset,
      ...extras,
      updated_at: new Date().toISOString(),
    })
    .eq("influencer_id", userId);
  if (error) {
    console.error("Failed to update plan:", error.message);
    return;
  }

  // Notify on upgrade (anything moving off trial/starter/free into a paid
  // tier, OR moving up between paid tiers). Skip when the plan didn't
  // actually change.
  const planRank: Record<string, number> = { free: 0, trial: 1, starter: 2, pro: 3, elite: 4 };
  const prevRank = planRank[previousPlan] ?? 0;
  const nextRank = planRank[plan] ?? 0;
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

// ── Service marketplace payment handlers ────────────────────────────────
//
// When a Stripe Checkout completes for a service order we flip the order's
// status, log an event, drop a chat message and notify the user. Idempotent:
// we re-check advance_paid / final_paid before mutating so a webhook retry
// can't double-progress an order.

async function handleServicePayment(session: Stripe.Checkout.Session) {
  const orderId = (session.metadata?.order_id as string) || "";
  const phase = (session.metadata?.phase as string) || "advance";
  if (!orderId) {
    console.error("service_payment webhook missing order_id");
    return;
  }

  const { data: order, error: oErr } = await supabase
    .from("service_orders")
    .select("id, user_id, status, service_title, advance_paid, final_paid")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr || !order) {
    console.error("service_payment webhook: order not found", orderId, oErr?.message);
    return;
  }

  const now = new Date().toISOString();
  const sessionId = session.id;
  const amountTotal = session.amount_total ?? 0; // in paise
  const amountRupees = Math.round(amountTotal / 100);

  if (phase === "advance") {
    if (order.advance_paid) return; // already processed
    const { error } = await supabase
      .from("service_orders")
      .update({
        advance_paid: true,
        advance_paid_at: now,
        advance_stripe_session_id: sessionId,
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", orderId);
    if (error) {
      console.error("Advance payment update failed:", error.message);
      return;
    }
    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "advance_paid",
      label: `Quote accepted & advance paid (₹${amountRupees.toLocaleString("en-IN")})`,
      meta: { amount: amountRupees, session_id: sessionId },
    });
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "service_advance_paid",
      title: "Advance received — work begins",
      body: JSON.stringify({
        text: `${order.service_title}: advance received, our team is on it.`,
        link: `/influencer/services/orders/${orderId}`,
        orderId,
      }),
      is_read: false,
    });
  } else if (phase === "final") {
    if (order.final_paid) return;
    const { error } = await supabase
      .from("service_orders")
      .update({
        final_paid: true,
        final_paid_at: now,
        final_stripe_session_id: sessionId,
        status: "paid_final",
        updated_at: now,
      })
      .eq("id", orderId);
    if (error) {
      console.error("Final payment update failed:", error.message);
      return;
    }
    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "final_paid",
      label: `Final payment received (₹${amountRupees.toLocaleString("en-IN")})`,
      meta: { amount: amountRupees, session_id: sessionId },
    });
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "service_final_paid",
      title: "Final payment received",
      body: JSON.stringify({
        text: `${order.service_title}: we'll deliver your final files shortly.`,
        link: `/influencer/services/orders/${orderId}`,
        orderId,
      }),
      is_read: false,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // Fallback for local testing without signature verification
      console.warn("Stripe webhook running without signature verification");
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const kind = (session.metadata?.kind as string) || "";

        // Service marketplace payment (one-time, mode: 'payment')
        if (kind === "service_payment") {
          await handleServicePayment(session);
          break;
        }

        // Otherwise it's a subscription checkout (default behaviour).
        const userId =
          (session.metadata?.user_id as string) || (session.client_reference_id as string) || "";
        const plan = (session.metadata?.plan as string) || "";
        const cycle = (session.metadata?.cycle as string) || "monthly";
        if (userId && plan) {
          await setUserPlan(userId, plan, {
            billing_cycle: cycle,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) || "";
        const plan = (sub.metadata?.plan as string) || "";
        // If the subscription was cancelled-at-period-end and is now ended,
        // drop the user back to starter.
        const status = sub.status;
        if (userId) {
          if (status === "active" || status === "trialing") {
            if (plan) await setUserPlan(userId, plan);
          } else if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
            await setUserPlan(userId, "starter");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) || "";
        if (userId) await setUserPlan(userId, "starter");
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
