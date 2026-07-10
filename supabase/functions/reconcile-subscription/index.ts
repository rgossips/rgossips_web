// Reconcile fallback for subscription state — CROSS-GATEWAY.
//
// The stripe-webhook / razorpay-webhook are the normal source of truth that
// flip subscription_plan after a successful charge. If a webhook is
// disabled/dropped/misconfigured, a user can pay and never get their plan —
// and prior subscriptions never get cancelled, so they end up multi-billed.
//
// This function is the safety net: it asks BOTH gateways what the user
// actually has (via subscription-history, which already normalises Stripe +
// Razorpay), keeps the single newest active+paid subscription, points the
// profile at it, and cancels every OTHER live subscription on either
// gateway. It must be cross-gateway: a user can switch Elite-on-Razorpay →
// Pro-on-Stripe, and a Razorpay-only reconcile would wrongly re-activate the
// stale Razorpay sub.
//
// Auth: the caller's own JWT — a user can only reconcile their own account.
// Idempotent: safe to call repeatedly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: jsonHeaders });

const LIVE_STATES = new Set(["active", "authenticated", "trialing"]);
const TEMPLATE_MIN_PLAN: Record<string, string> = {
  classic: "starter",
  glass_blue: "pro",
  editorial_noir: "pro",
  bento_sunset: "elite",
  neo_brutalist: "elite",
};
const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, elite: 3 };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Profile billing_cycle is "monthly" | "annual"; gateways report
// month/monthly/year/annual. Normalise.
function normCycle(c: string): string {
  const v = String(c || "").toLowerCase();
  return v.startsWith("year") || v === "annual" ? "annual" : "monthly";
}

async function cancelRazorpaySub(subId: string): Promise<boolean> {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) return false;
  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subId)}/cancel`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      },
    );
    const out = await res.json().catch(() => ({}));
    if (out?.error && !/already|status/i.test(out?.error?.description || "")) {
      log.warn("reconcile.rzp_cancel_error", { subId, desc: out?.error?.description });
      return false;
    }
    return true;
  } catch (e) {
    log.error("reconcile.rzp_cancel_threw", { subId }, e);
    return false;
  }
}

// Fetch a single subscription straight from the gateway (authoritative,
// no invoice-listing lag). Returns a normalised sub object owned by userId,
// or null. Used to honour the client's "I just paid for THIS sub" hint even
// before it shows up as active+paid in subscription-history.
async function fetchSubDirect(
  gateway: string,
  subId: string,
  userId: string,
  fallbackPlan: string,
): Promise<any | null> {
  const DEAD = new Set(["cancelled", "canceled", "completed", "expired"]);
  try {
    if (gateway === "stripe") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) return null;
      const res = await fetch(
        `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subId)}`,
        { headers: { Authorization: `Bearer ${stripeKey}` } },
      );
      if (!res.ok) return null;
      const s = await res.json().catch(() => ({}));
      if (String(s?.metadata?.user_id || "") !== userId) return null;
      if (DEAD.has(String(s?.status))) return null;
      return {
        id: s.id,
        plan: String(s?.metadata?.plan || fallbackPlan || "").toLowerCase(),
        cycle: String(s?.metadata?.cycle || "monthly"),
        gateway: "stripe",
        status: String(s?.status || "active"),
      };
    }
    // Default: Razorpay.
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return null;
    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subId)}`,
      { headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` } },
    );
    if (!res.ok) return null;
    const s = await res.json().catch(() => ({}));
    if (String(s?.notes?.user_id || "") !== userId) return null;
    if (DEAD.has(String(s?.status))) return null;
    return {
      id: s.id,
      plan: String(s?.notes?.plan || fallbackPlan || "").toLowerCase(),
      cycle: String(s?.notes?.cycle || "monthly"),
      gateway: "razorpay",
      status: String(s?.status || "active"),
    };
  } catch (e) {
    log.warn("reconcile.direct_fetch_failed", { subId, gateway });
    return null;
  }
}

async function cancelStripeSub(subId: string): Promise<boolean> {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return false;
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    if (!res.ok) {
      const body = await res.text();
      if (!/No such subscription|resource_missing|already canceled/i.test(body)) {
        log.warn("reconcile.stripe_cancel_error", { subId });
        return false;
      }
    }
    return true;
  } catch (e) {
    log.error("reconcile.stripe_cancel_threw", { subId }, e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rid = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data: userRes, error: userErr } = await admin.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);
    const userId = userRes.user.id;

    // Optional hint: the subscription the client just paid for. Preferring it
    // avoids a race — Razorpay activates/charges a new sub asynchronously, so
    // right after checkout it may not be visible as active+paid in the
    // invoice-based view yet, and "newest active+paid" would wrongly keep the
    // OLD sub. We verify the preferred sub directly against the gateway.
    const body = await req.json().catch(() => ({}));
    const preferSubscriptionId = String(body?.preferSubscriptionId || "").trim();
    const preferGateway = String(body?.preferGateway || "").toLowerCase();
    const preferPlan = String(body?.preferPlan || "").toLowerCase();

    // Unified view of the user's subscriptions across both gateways.
    // subscription-history is invoice-based; group by subscription_id.
    const histRes = await fetch(`${SUPABASE_URL}/functions/v1/subscription-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ userId }),
    });
    const histBody = await histRes.json().catch(() => ({}));
    const invoices: any[] = Array.isArray(histBody?.invoices) ? histBody.invoices : [];

    const subs: Record<string, any> = {};
    for (const inv of invoices) {
      const sid = String(inv.subscription_id || "");
      if (!sid) continue;
      if (!subs[sid]) {
        subs[sid] = {
          id: sid,
          plan: String(inv.plan || "").toLowerCase(),
          cycle: inv.cycle,
          gateway: inv.gateway,
          status: String(inv.subscription_status || "").toLowerCase(),
          created: Number(inv.created_at || 0),
          hasPaid: false,
        };
      }
      if (inv.status === "paid") subs[sid].hasPaid = true;
      // Earliest invoice ≈ subscription creation, used for ordering.
      const c = Number(inv.created_at || 0);
      if (c && (!subs[sid].created || c < subs[sid].created)) subs[sid].created = c;
    }

    // Live + actually paid, newest first.
    const live = Object.values(subs)
      .filter((s: any) => LIVE_STATES.has(s.status) && s.hasPaid)
      .sort((a: any, b: any) => (b.created || 0) - (a.created || 0));

    // Resolve the keeper. Honour the client's just-paid hint first (verified
    // directly against the gateway so the async-activation lag can't make us
    // keep the old sub); fall back to newest active+paid.
    let keeper: any = null;
    if (preferSubscriptionId) {
      keeper =
        live.find((s: any) => s.id === preferSubscriptionId) ||
        (await fetchSubDirect(preferGateway, preferSubscriptionId, userId, preferPlan));
    }
    if (!keeper) keeper = live[0] || null;

    if (!keeper) {
      log.info("reconcile.no_live_sub", { rid, userId });
      return json({ reconciled: false, reason: "no_active_subscription" });
    }
    if (!["starter", "pro", "elite"].includes(keeper.plan)) {
      log.warn("reconcile.unknown_plan", { rid, userId, subId: keeper.id, plan: keeper.plan });
      return json({ reconciled: false, reason: "unknown_plan" });
    }
    const isStripe = keeper.gateway === "stripe";

    // Current profile — for template reset + prior-state awareness.
    const { data: prof } = await admin
      .from("influencer_profiles")
      .select("subscription_plan, media_kit_template")
      .eq("influencer_id", userId)
      .maybeSingle();
    const prevTemplate = prof?.media_kit_template || "classic";
    const requiredRank = PLAN_RANK[TEMPLATE_MIN_PLAN[prevTemplate] || "starter"] || 0;
    const templateReset =
      requiredRank > (PLAN_RANK[keeper.plan] || 0) ? { media_kit_template: "classic" } : {};

    // Point the profile at the keeper, and clear the OTHER gateway's ids so a
    // later stray cancellation webhook from the losing gateway can't
    // "downgrade" the user (mirrors the webhooks' setUserPlan).
    const gatewayFields = isStripe
      ? { stripe_subscription_id: keeper.id, razorpay_subscription_id: null, razorpay_customer_id: null }
      : { razorpay_subscription_id: keeper.id, stripe_subscription_id: null, stripe_customer_id: null };

    const { error: upErr } = await admin
      .from("influencer_profiles")
      .update({
        subscription_plan: keeper.plan,
        billing_cycle: normCycle(keeper.cycle),
        payment_gateway: keeper.gateway,
        ...gatewayFields,
        ...templateReset,
        updated_at: new Date().toISOString(),
      })
      .eq("influencer_id", userId);
    if (upErr) {
      log.error("reconcile.profile_update_failed", { rid, userId }, upErr);
      return json({ error: "profile_update_failed" }, 200);
    }

    // Single-active-subscription: cancel every OTHER live sub on either
    // gateway. This is what the webhook's cancelPriorSubscriptions does.
    const cancelled: string[] = [];
    for (const s of live) {
      if (s.id === keeper.id) continue;
      const ok = s.gateway === "stripe" ? await cancelStripeSub(s.id) : await cancelRazorpaySub(s.id);
      if (ok) cancelled.push(s.id);
    }

    // Upgrade notification when the plan actually changed, deduped.
    if (prof?.subscription_plan !== keeper.plan) {
      try {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: recent } = await admin
          .from("notifications")
          .select("id")
          .eq("user_id", userId)
          .eq("type", "plan_upgraded")
          .gte("created_at", tenMinAgo)
          .limit(1)
          .maybeSingle();
        if (!recent) {
          const label = keeper.plan.charAt(0).toUpperCase() + keeper.plan.slice(1);
          await admin.from("notifications").insert({
            user_id: userId,
            type: "plan_upgraded",
            title: `You're on ${label} 🎉`,
            body: JSON.stringify({ text: `Your ${label} plan is now active.`, link: "/influencer/pricing" }),
            is_read: false,
          });
        }
      } catch {
        /* non-fatal */
      }
    }

    log.info("reconcile.done", {
      rid, userId, plan: keeper.plan, gateway: keeper.gateway, kept: keeper.id, cancelled: cancelled.length,
    });
    return json({
      reconciled: true,
      plan: keeper.plan,
      cycle: normCycle(keeper.cycle),
      gateway: keeper.gateway,
      subscription_id: keeper.id,
      cancelled,
    });
  } catch (err) {
    log.error("reconcile.exception", { rid }, err);
    return json({ error: "internal" }, 500);
  }
});
