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

// ── Shared email helpers ───────────────────────────────────────────────
// Mirrored from create-profile / razorpay-webhook / send-account-event-email.
// If you tweak any of these, keep the others in sync.

async function invokeSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  if (!opts.to) return;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("send-email skipped: missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return;
    }
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    if (data?.error) console.error("send-email returned:", data.error);
  } catch (e) {
    console.error("send-email invocation failed:", (e as any)?.message);
  }
}

function renderEmailHtml(o: {
  preheader?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const cta =
    o.ctaUrl && o.ctaLabel
      ? `<div style="margin:28px 0 8px;">
           <a href="${o.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#9810FA,#E60076);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:14px;">${o.ctaLabel}</a>
         </div>`
      : "";
  const footer =
    o.footerNote ||
    "You're receiving this because you have an RGossips account. Questions? Just reply to this email.";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;">${o.preheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F7FB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #f1f5f9;border-radius:20px;padding:32px;">
        <tr><td>
          <div style="font-weight:900;font-size:18px;letter-spacing:-0.3px;color:#9810FA;margin-bottom:18px;">RGossips</div>
          <h1 style="font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;color:#0f172a;">${o.title}</h1>
          <div style="font-size:14px;line-height:1.65;color:#475569;">${o.body}</div>
          ${cta}
          <div style="font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:18px;margin-top:28px;line-height:1.6;">${footer}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Cancel any "other" active subscriptions on the user's profile so we
// never end up double-billing across gateways or across upgrade chains.
// The newly-paid subscription id is passed so we never cancel ourselves.
async function cancelPriorSubscriptions(opts: {
  userId: string;
  skipStripeSubId?: string | null;
  priorStripe: string | null;
  priorRazorpay: string | null;
}) {
  const { skipStripeSubId, priorStripe, priorRazorpay } = opts;

  // Stripe: ignore if the prior sub IS the one we just activated (Stripe
  // re-issues the same id on a checkout for the same customer; we don't
  // want to cancel something we're trying to keep).
  if (priorStripe && priorStripe !== skipStripeSubId) {
    try {
      await stripe.subscriptions.cancel(priorStripe, { invoice_now: false, prorate: false });
      console.log("Cancelled prior Stripe subscription", priorStripe);
    } catch (e: any) {
      // 404 / "No such subscription" / "already canceled" → the prior
      // one is already inactive on Stripe's side, so we don't care.
      const msg = e?.message || String(e);
      if (!/No such subscription|already canceled|resource_missing/i.test(msg)) {
        console.error("Failed to cancel prior Stripe subscription", priorStripe, msg);
      }
    }
  }

  if (priorRazorpay) {
    try {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID");
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
      if (keyId && keySecret) {
        const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
        const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(priorRazorpay)}/cancel`, {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          // cancel_at_cycle_end: 0 → immediate cancellation so the next
          // billing date doesn't fire a charge for an obsolete plan.
          body: JSON.stringify({ cancel_at_cycle_end: 0 }),
        });
        const out = await res.json();
        if (out?.error) {
          // Already cancelled / completed is fine.
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
}

// True when `subId` is the user's currently-billing Stripe sub.
// Ignores cancellation events when:
//   - the user has since switched to a different gateway (e.g. paid via
//     Razorpay after this Stripe sub) — payment_gateway tells us that
//   - the sub id on the row doesn't match (typically a prior Stripe sub
//     we cancelled as part of an upgrade chain)
async function isCurrentStripeSub(userId: string, subId: string): Promise<boolean> {
  const { data } = await supabase
    .from("influencer_profiles")
    .select("stripe_subscription_id, payment_gateway")
    .eq("influencer_id", userId)
    .maybeSingle();
  // Cross-gateway switch: the user is now on a different gateway, so
  // this Stripe cancellation event is for a stale sub from before they
  // moved. Don't downgrade them.
  if (data?.payment_gateway && data.payment_gateway !== "stripe") return false;
  if (data?.stripe_subscription_id) return data.stripe_subscription_id === subId;
  // No sub on file and gateway is empty/stripe — be permissive; the
  // cancellation should still flow through.
  return true;
}

async function setUserPlan(userId: string, plan: string, extras: Record<string, unknown> = {}) {
  if (!userId) return;
  // Read the existing plan + current template so we can (a) fire a thank-you
  // notification only on an actual upgrade, (b) force the kit back to
  // Classic when the new plan can't legally use whatever template they
  // had picked, and (c) cancel any prior subscription so a user can never
  // be billed by two gateways simultaneously.
  const { data: prior } = await supabase
    .from("influencer_profiles")
    .select("subscription_plan, media_kit_template, stripe_subscription_id, razorpay_subscription_id")
    .eq("influencer_id", userId)
    .maybeSingle();
  const previousPlan = prior?.subscription_plan || "";
  const previousTemplate = prior?.media_kit_template || "classic";

  // Single-active-subscription rule. The user just paid through Stripe;
  // cancel anything that was previously active either on Stripe (a
  // different sub id — happens on tier change) or on Razorpay (gateway
  // switch). Non-fatal on failure: we still proceed with activating the
  // newly-paid sub so the customer gets what they bought; orphaned subs
  // can be cleaned up manually if cancellation ever fails.
  const newStripeSubId = (extras as any).stripe_subscription_id as string | undefined;
  await cancelPriorSubscriptions({
    userId,
    skipStripeSubId: newStripeSubId,
    priorStripe: prior?.stripe_subscription_id || null,
    priorRazorpay: prior?.razorpay_subscription_id || null,
  });

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
    // Idempotency guard. Stripe fires checkout.session.completed AND
    // customer.subscription.updated back-to-back on an upgrade, and they
    // can both read `previousPlan` before either has written the new
    // plan — so both pass the rank check and both insert the welcome
    // notification. Dedupe by checking for a fresh notification of the
    // same plan in the last 10 minutes.
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("notifications")
      .select("id, body")
      .eq("user_id", userId)
      .eq("type", "plan_upgraded")
      .gte("created_at", tenMinAgo)
      .limit(5);
    const alreadyNotified = (recent || []).some((n: any) => {
      try {
        const parsed = typeof n.body === "string" ? JSON.parse(n.body) : n.body;
        return (parsed?.text || "").includes(planLabel);
      } catch {
        return false;
      }
    });
    if (!alreadyNotified) try {
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

    // Email receipt — also gated by the same dedupe so the user
    // doesn't get two "your Pro subscription is active" emails when
    // both Stripe events fire setUserPlan in quick succession.
    if (!alreadyNotified) try {
      const cycle = (extras as any).billing_cycle as string | undefined;
      const cycleLabel = cycle === "annual" ? "Annual" : "Monthly";
      const { data: row } = await supabase
        .from("influencer_profiles")
        .select("email, full_name")
        .eq("influencer_id", userId)
        .maybeSingle();
      let to = row?.email || "";

      // Phone-OTP signups land here with email = null. Fall back to the
      // email Stripe collected during Checkout (always present — Stripe
      // requires it) and persist it on the row so future receipts,
      // welcome emails and account-event emails Just Work.
      const customerId = (extras as any).stripe_customer_id as string | undefined;
      if (!to && customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !("deleted" in customer && customer.deleted)) {
            const gatewayEmail = (customer as Stripe.Customer).email || "";
            if (gatewayEmail) {
              to = gatewayEmail;
              await supabase
                .from("influencer_profiles")
                .update({ email: gatewayEmail })
                .eq("influencer_id", userId);
            }
          }
        } catch (e) {
          console.error("Stripe customer lookup for email failed:", (e as any)?.message);
        }
      }

      if (to) {
        const firstName = (row?.full_name || "").split(" ")[0] || "there";
        await invokeSendEmail({
          to,
          subject: `Your RGossips ${planLabel} subscription is active`,
          html: renderEmailHtml({
            preheader: `Your ${planLabel} plan is live — billed ${cycleLabel.toLowerCase()} via Stripe.`,
            title: `You're on ${planLabel}, ${firstName} 🎉`,
            body: `<p>Thanks for upgrading. Your <strong>${planLabel} · ${cycleLabel}</strong> subscription is now active and billed through Stripe.</p>
                   <p>All your ${planLabel} features are unlocked right now — head to the dashboard to start using them.</p>
                   <p style="font-size:12px;color:#94a3b8;margin-top:18px;">A separate invoice will land from Stripe with the tax breakdown. You can also pull every past invoice from <strong>Profile → Payments → Subscription History</strong>.</p>`,
            ctaLabel: "Open dashboard",
            ctaUrl: "https://rgossips.com/influencer",
          }),
        });
      }
    } catch (e) {
      console.error("Subscription receipt email failed (non-fatal):", (e as any)?.message);
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
    // Admin fan-out — so ops knows to start work and upload the draft URL.
    try {
      const { data: admins } = await supabase.from("admin_profiles").select("id");
      if (Array.isArray(admins) && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: "service_advance_paid_admin",
            priority: "high",
            title: "Advance paid — upload the draft",
            body: JSON.stringify({
              text: `${order.service_title}: advance of ₹${amountRupees.toLocaleString("en-IN")} received. Start work and deliver the draft URL.`,
              link: `/dashboard/quote-requests/${orderId}`,
              orderId,
            }),
            is_read: false,
          }))
        );
      }
    } catch (e) {
      console.error("admin advance-paid fan-out failed:", e);
    }
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
    // Admin fan-out — final payment cleared, ops needs to upload the
    // final deliverable files via DeliverFinalForm.
    try {
      const { data: admins } = await supabase.from("admin_profiles").select("id");
      if (Array.isArray(admins) && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: "service_final_paid_admin",
            priority: "high",
            title: "Final paid — deliver the files",
            body: JSON.stringify({
              text: `${order.service_title}: final ₹${amountRupees.toLocaleString("en-IN")} received. Upload the deliverable files to complete the order.`,
              link: `/dashboard/quote-requests/${orderId}`,
              orderId,
            }),
            is_read: false,
          }))
        );
      }
    } catch (e) {
      console.error("admin final-paid fan-out failed:", e);
    }
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
            // Mark this gateway as the user's current billing gateway and
            // null out the other gateway's ids so a stray webhook from
            // there (legitimately cancelling the prior sub) doesn't get
            // counted as the user's current state.
            payment_gateway: "stripe",
            razorpay_subscription_id: null,
            razorpay_customer_id: null,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) || "";
        const plan = (sub.metadata?.plan as string) || "";
        const cycle = (sub.metadata?.cycle as string) || "";
        const status = sub.status;
        if (userId) {
          if (status === "active" || status === "trialing") {
            // CRITICAL: pass the sub id + customer id in extras. setUserPlan
            // uses stripe_subscription_id from extras as skipStripeSubId on
            // cancelPriorSubscriptions; without it, this handler would
            // happily cancel the very subscription whose activation we're
            // processing. (Happened on Pro → Elite upgrades where this
            // event fires alongside checkout.session.completed.)
            if (plan) {
              await setUserPlan(userId, plan, {
                stripe_subscription_id: sub.id,
                stripe_customer_id: sub.customer as string,
                payment_gateway: "stripe",
                razorpay_subscription_id: null,
                razorpay_customer_id: null,
                ...(cycle ? { billing_cycle: cycle } : {}),
              });
            }
          } else if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
            // Only downgrade if this sub IS the user's current one. If
            // it's a stale id (typically because we just cancelled the
            // prior sub during an upgrade), ignore — the new active sub
            // on the profile should stand.
            if (await isCurrentStripeSub(userId, sub.id)) {
              await setUserPlan(userId, "starter");
            } else {
              console.log("Ignoring updated/canceled for stale Stripe sub", sub.id);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.user_id as string) || "";
        if (userId) {
          if (await isCurrentStripeSub(userId, sub.id)) {
            await setUserPlan(userId, "starter");
          } else {
            console.log("Ignoring deletion of stale Stripe sub", sub.id);
          }
        }
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
