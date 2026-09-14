// Safety net for missed store notifications.
//
// iap-notifications answers 200 even when it cannot act, so a store never
// retries into a storm. That is the right trade only if something else
// eventually catches what was dropped — a Pub/Sub outage, a deploy window, a
// notification that never fired. This is that something.
//
// It finds subscriptions the ledger still believes are live but whose expiry
// has passed, re-verifies each against the store, and applies the answer. A
// subscriber whose renewal simply succeeded is corrected back to active; one
// who actually lapsed loses the plan.
//
// Run on a schedule (hourly is ample) via pg_cron — see migration 065.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import {
  verifyApple,
  verifyGoogle,
  PRODUCT_MAP,
  ENTITLING_STATUSES,
} from "../_shared/iap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stores can settle a renewal slightly after the stated expiry. Waiting a
// short while avoids yanking a plan from someone whose renewal is simply in
// flight, which would be far more damaging than a brief over-grant.
const GRACE_MINUTES = 60;

// Bounded so one run cannot exhaust the function timeout. Anything left over
// is picked up next run — expiries are spread across the day anyway.
const BATCH = 100;

serveWithLogging("iap-expiry-sweep", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Privileged: this mutates entitlements for arbitrary users, so it must
    // never be callable with an ordinary user's token.
    //
    // Two accepted callers:
    //   - pg_cron, via the x-cron-secret shared secret. Postgres cannot
    //     conveniently hold a service-role JWT, and inlining one in cron.job
    //     would put the platform's highest-privilege credential in a table.
    //   - a service-role JWT, for manual runs and debugging.
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

    if (!viaCron && !isServiceRole) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const cutoff = new Date(Date.now() - GRACE_MINUTES * 60 * 1000).toISOString();

    const { data: stale, error } = await supabase
      .from("iap_subscriptions")
      .select("platform, store_subscription_id, user_id")
      .in("status", ["active", "grace"])
      .not("expires_at", "is", null)
      .lt("expires_at", cutoff)
      .limit(BATCH);

    if (error) {
      console.error("sweep query failed:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    let renewed = 0;
    let lapsed = 0;
    let failed = 0;

    for (const row of stale || []) {
      const platform = row.platform as "ios" | "android";
      const storeId = row.store_subscription_id as string;
      const userId = row.user_id as string;

      try {
        const verified =
          platform === "ios" ? await verifyApple(storeId) : await verifyGoogle(storeId);
        const mapped = PRODUCT_MAP[verified.productId];

        await supabase
          .from("iap_subscriptions")
          .update({
            status: verified.status,
            expires_at: verified.expiresAt,
            auto_renewing: verified.autoRenewing,
            latest_transaction_id: verified.latestTransactionId,
            ...(mapped ? { plan_id: mapped.plan, billing_cycle: mapped.cycle } : {}),
            raw: verified.raw,
            updated_at: new Date().toISOString(),
          })
          .eq("platform", platform)
          .eq("store_subscription_id", storeId);

        if (ENTITLING_STATUSES.has(verified.status)) {
          // The renewal did go through; the notification just never arrived.
          renewed++;
          continue;
        }

        // Genuinely lapsed. Same staleness guard as the webhook: only
        // downgrade when this subscription is the one backing the profile.
        const { data: profile } = await supabase
          .from("influencer_profiles")
          .select("iap_subscription_id")
          .eq("influencer_id", userId)
          .maybeSingle();

        if (profile?.iap_subscription_id && profile.iap_subscription_id !== storeId) {
          continue;
        }

        await supabase
          .from("influencer_profiles")
          .update({
            subscription_plan: "free",
            iap_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("influencer_id", userId);
        lapsed++;
      } catch (e) {
        // One bad subscription must not stop the batch.
        failed++;
        console.error("sweep failed for", platform, storeId, e);
      }
    }

    console.log(`iap sweep: ${renewed} renewed, ${lapsed} lapsed, ${failed} failed`);

    // Retire lapsed Razorpay/Stripe subscriptions in the same pass.
    //
    // That rail needs the identical hourly job — a paid period ends, the row
    // has to stop claiming a tier the creator no longer has, churn has to be
    // recorded and the creator told once. Rather than add a second cron, it
    // rides this one: the schedule already exists, the two sweeps never touch
    // the same profile (this one owns store-billed rows, that one skips
    // them), and one schedule is one thing to reason about.
    //
    // Kept as its own function rather than inlined here because the name of
    // this one is about IAP, and because it stays independently runnable for
    // a manual catch-up. Chained AFTER the response payload is computed and
    // never allowed to fail this sweep — entitlement does not depend on
    // either of them (getEffectivePlan goes by plan_expires_at), so a failed
    // chain costs bookkeeping, not access.
    let gatewayLapse: unknown = null;
    try {
      const res = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/subscription-lapse-sweep`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          },
          body: "{}",
        },
      );
      gatewayLapse = await res.json().catch(() => ({ status: res.status }));
    } catch (e) {
      console.error("gateway lapse sweep failed:", e);
      gatewayLapse = { error: String((e as Error)?.message || e) };
    }

    return new Response(
      JSON.stringify({ checked: stale?.length || 0, renewed, lapsed, failed, gatewayLapse }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (e) {
    console.error("iap-expiry-sweep failed:", e);
    return new Response(JSON.stringify({ error: "sweep failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
