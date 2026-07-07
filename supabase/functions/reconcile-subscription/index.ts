// Reconcile fallback for subscription state.
//
// The razorpay-webhook is the normal source of truth that flips
// subscription_plan on the profile after a successful charge. If that
// webhook is disabled/dropped/misconfigured, a user can pay and never get
// their plan — and prior subscriptions never get cancelled, so they end up
// multi-billed. This function is the safety net: it asks Razorpay directly
// what the user actually has, sets the profile to match, and cancels every
// OTHER active subscription so only the newest one survives.
//
// Auth: the caller's own JWT — a user can only reconcile their own account.
// Idempotent: safe to call repeatedly (the pricing page calls it after the
// post-payment poll if the plan still hasn't updated).

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

// Non-terminal states that count as "the user has this subscription".
const LIVE_STATES = new Set(["active", "authenticated"]);

const TEMPLATE_MIN_PLAN: Record<string, string> = {
  classic: "starter",
  glass_blue: "pro",
  editorial_noir: "pro",
  bento_sunset: "elite",
  neo_brutalist: "elite",
};
const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, elite: 3 };

// Walk the user's Razorpay subscriptions (filtered by notes.user_id).
async function razorpaySubsForUser(auth: string, userId: string) {
  const matched: any[] = [];
  for (let skip = 0; skip < 500; skip += 100) {
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions?count=100&skip=${skip}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) break;
    const body = await res.json().catch(() => ({}));
    const items: any[] = Array.isArray(body?.items) ? body.items : [];
    for (const s of items) {
      if (String(s?.notes?.user_id || "") === userId) matched.push(s);
    }
    if (items.length < 100) break;
  }
  return matched;
}

async function cancelRazorpaySub(auth: string, subId: string) {
  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subId)}/cancel`,
      {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      },
    );
    const out = await res.json().catch(() => ({}));
    if (out?.error && !/already|status/i.test(out?.error?.description || "")) {
      log.warn("reconcile.cancel_error", { subId, desc: out?.error?.description });
      return false;
    }
    return true;
  } catch (e) {
    log.error("reconcile.cancel_threw", { subId }, e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rid = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: userRes, error: userErr } = await admin.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, ""),
    );
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);
    const userId = userRes.user.id;

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return json({ error: "razorpay_not_configured" }, 200);
    const rzpAuth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;

    const subs = await razorpaySubsForUser(rzpAuth, userId);
    const live = subs
      .filter((s) => LIVE_STATES.has(String(s.status)))
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));

    if (live.length === 0) {
      log.info("reconcile.no_live_sub", { rid, userId });
      return json({ reconciled: false, reason: "no_active_subscription" });
    }

    // Keeper = newest live subscription. Everything else gets cancelled.
    const keeper = live[0];
    const keeperPlan = String(keeper?.notes?.plan || "").toLowerCase();
    const keeperCycle = String(keeper?.notes?.cycle || "monthly").toLowerCase();
    if (!["starter", "pro", "elite"].includes(keeperPlan)) {
      // Can't trust the plan without the note — bail rather than guess.
      log.warn("reconcile.unknown_plan_on_keeper", { rid, userId, subId: keeper?.id });
      return json({ reconciled: false, reason: "unknown_plan" });
    }

    // Read current profile to decide template reset + know prior ids.
    const { data: prof } = await admin
      .from("influencer_profiles")
      .select("subscription_plan, media_kit_template, stripe_subscription_id, razorpay_subscription_id")
      .eq("influencer_id", userId)
      .maybeSingle();

    const prevTemplate = prof?.media_kit_template || "classic";
    const requiredRank = PLAN_RANK[TEMPLATE_MIN_PLAN[prevTemplate] || "starter"] || 0;
    const nextRank = PLAN_RANK[keeperPlan] || 0;
    const templateReset = requiredRank > nextRank ? { media_kit_template: "classic" } : {};

    const alreadyCorrect =
      prof?.subscription_plan === keeperPlan &&
      prof?.razorpay_subscription_id === keeper.id;

    // Point the profile at the keeper. Clear Stripe ids — if the user is on
    // Razorpay now, a later stray Stripe cancellation must not "downgrade"
    // them (mirrors the webhook's setUserPlan).
    const { error: upErr } = await admin
      .from("influencer_profiles")
      .update({
        subscription_plan: keeperPlan,
        billing_cycle: keeperCycle,
        payment_gateway: "razorpay",
        razorpay_subscription_id: keeper.id,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        ...templateReset,
        updated_at: new Date().toISOString(),
      })
      .eq("influencer_id", userId);
    if (upErr) {
      log.error("reconcile.profile_update_failed", { rid, userId }, upErr);
      return json({ error: "profile_update_failed" }, 200);
    }

    // Single-active-subscription: cancel every OTHER live Razorpay sub, and
    // the prior Stripe sub if any. This is what the webhook would have done.
    const toCancel = live.slice(1).map((s) => s.id);
    const cancelled: string[] = [];
    for (const sid of toCancel) {
      if (await cancelRazorpaySub(rzpAuth, sid)) cancelled.push(sid);
    }
    if (prof?.stripe_subscription_id) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          await fetch(
            `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(prof.stripe_subscription_id)}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${stripeKey}` } },
          );
        }
      } catch (e) {
        log.warn("reconcile.stripe_cancel_failed", { rid, userId }, );
      }
    }

    // Welcome/upgrade notification — only when the plan actually changed, and
    // deduped so repeated reconcile calls don't spam.
    if (!alreadyCorrect && prof?.subscription_plan !== keeperPlan) {
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
          const label = keeperPlan.charAt(0).toUpperCase() + keeperPlan.slice(1);
          await admin.from("notifications").insert({
            user_id: userId,
            type: "plan_upgraded",
            title: `You're on ${label} 🎉`,
            body: JSON.stringify({
              text: `Your ${label} plan is now active.`,
              link: "/influencer/pricing",
            }),
            is_read: false,
          });
        }
      } catch (e) {
        log.warn("reconcile.notif_failed", { rid, userId });
      }
    }

    log.info("reconcile.done", { rid, userId, plan: keeperPlan, kept: keeper.id, cancelled: cancelled.length });
    return json({
      reconciled: true,
      plan: keeperPlan,
      cycle: keeperCycle,
      subscription_id: keeper.id,
      cancelled,
    });
  } catch (err) {
    log.error("reconcile.exception", { rid }, err);
    return json({ error: "internal" }, 500);
  }
});
