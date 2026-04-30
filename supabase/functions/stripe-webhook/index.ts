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
  const { error } = await supabase
    .from("influencer_profiles")
    .update({
      subscription_plan: plan,
      ...extras,
      updated_at: new Date().toISOString(),
    })
    .eq("influencer_id", userId);
  if (error) console.error("Failed to update plan:", error.message);
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
        const userId = (session.metadata?.user_id as string) || (session.client_reference_id as string) || "";
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
