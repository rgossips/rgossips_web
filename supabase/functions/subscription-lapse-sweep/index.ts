// Nightly: retire gateway subscriptions whose paid period has ended.
//
// Entitlement does NOT depend on this running. getEffectivePlan() returns
// `free` as soon as plan_expires_at is in the past, on every surface, so a
// creator whose plan lapsed is correctly de-privileged the moment it happens
// even if this sweep is late or never runs. That is deliberate: a cron is a
// bad place to put a security boundary.
//
// What the sweep is for is everything that reading cannot do:
//
//   * normalising the row, so `subscription_plan` stops claiming a paid tier
//     the creator no longer has — admin lists, exports and any query that
//     reads the column directly were otherwise wrong;
//   * emitting a `subscription_events` row (via the migration-067 trigger) so
//     churn is measurable;
//   * telling the creator, once, that their plan has ended.
//
// The IAP rail already has its own sweep (`iap-expiry-sweep`) reading
// iap_subscriptions.expires_at. This is the Razorpay/Stripe equivalent and
// deliberately skips store-billed rows so the two never fight over the same
// profile.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import { log } from "../_shared/log.ts";

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

const PAID = new Set(["starter", "pro", "elite"]);
// Store billing has its own sweep and its own source of truth.
const STORE_GATEWAYS = new Set(["apple_iap", "google_play"]);

serveWithLogging("subscription-lapse-sweep", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Same two callers as payouts-cron and iap-expiry-sweep:
  //   - pg_cron, via the x-cron-secret shared secret. Postgres cannot
  //     conveniently hold a service-role JWT, and inlining one in cron.job
  //     would put the platform's highest-privilege credential in a table.
  //   - a service-role JWT, for manual runs and debugging.
  //
  // This endpoint mass-downgrades accounts, so it is never open.
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  const viaCron = !!expectedSecret && cronSecret === expectedSecret;

  let isServiceRole = false;
  if (!viaCron) {
    const auth = (req.headers.get("authorization") || "").replace("Bearer ", "");
    try {
      const claims = JSON.parse(
        atob(auth.split(".")[1].replace(/-/g, "+").replace(/_/g, "/") + "=="),
      );
      isServiceRole = claims?.role === "service_role";
    } catch {
      isServiceRole = false;
    }
  }

  if (!viaCron && !isServiceRole) return json({ error: "unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Only rows with a KNOWN, past end date. A null plan_expires_at means we
  // never learned the period end — most of the table — and must never lapse.
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("influencer_profiles")
    .select("influencer_id, subscription_plan, payment_gateway, plan_expires_at, auto_renew")
    .lt("plan_expires_at", nowIso)
    .not("plan_expires_at", "is", null)
    .limit(500);

  if (error) {
    log.error("lapse_sweep.query_failed", {}, error);
    return json({ error: error.message }, 500);
  }

  let lapsed = 0;
  let skipped = 0;

  for (const row of due || []) {
    const plan = String(row.subscription_plan || "").toLowerCase();
    const gateway = String(row.payment_gateway || "").toLowerCase();

    // Already on free, or store-billed (iap-expiry-sweep owns those).
    if (!PAID.has(plan) || STORE_GATEWAYS.has(gateway)) {
      skipped++;
      continue;
    }

    const { error: upErr } = await admin
      .from("influencer_profiles")
      .update({
        // `free`, never `starter` — starter is a paid tier.
        subscription_plan: "free",
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq("influencer_id", row.influencer_id)
      // Re-check the date in the WHERE clause: a renewal could have landed
      // between the read above and this write, and clobbering it would strip
      // a plan the creator just paid for.
      .lt("plan_expires_at", nowIso);

    if (upErr) {
      log.error("lapse_sweep.update_failed", { userId: row.influencer_id }, upErr);
      continue;
    }
    lapsed++;

    // Best-effort. A missed notification is not worth failing the sweep for.
    try {
      await admin.from("notifications").insert({
        user_id: row.influencer_id,
        type: "subscription_expired",
        title: "Your plan has ended",
        body: JSON.stringify({
          text: "Your subscription has ended and your account is back on the free plan. Resubscribe any time to restore paid campaigns, your media kit and analytics.",
          link: "/influencer/pricing",
        }),
        is_read: false,
      });
    } catch (e) {
      log.warn("lapse_sweep.notify_failed", { userId: row.influencer_id }, e);
    }
  }

  log.info("lapse_sweep.done", { considered: (due || []).length, lapsed, skipped });
  return json({ ok: true, considered: (due || []).length, lapsed, skipped });
});
