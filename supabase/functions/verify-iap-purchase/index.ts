// Verify a store purchase and grant the plan.
//
// Called by the app immediately after a successful IAP / Play Billing
// purchase, and again on "Restore Purchases". The client's claim is never
// trusted: the store is asked directly, and only its answer grants anything.
//
// Idempotent by design. The same receipt can arrive many times — a retry, a
// restore, a reinstall — and must always converge on the same entitlement
// rather than stacking duplicates. The unique index on
// (platform, store_subscription_id) is what enforces that.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifyApple,
  verifyGoogle,
  PRODUCT_MAP,
  ENTITLING_STATUSES,
  type Platform,
} from "../_shared/iap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { platform, transactionId, purchaseToken } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identity from the JWT, never the body. A user id supplied by the client
    // would let anyone attach their own purchase to someone else's account —
    // or worse, attach a stranger's purchase to their own.
    const jwt = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabase.auth.getUser(jwt);
    const userId = userRes?.user?.id;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Not signed in." }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (platform !== "ios" && platform !== "android") {
      return new Response(
        JSON.stringify({ error: "platform must be 'ios' or 'android'" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── ask the store ──
    let verified;
    try {
      verified =
        platform === "ios"
          ? await verifyApple(String(transactionId || ""))
          : await verifyGoogle(String(purchaseToken || ""));
    } catch (e) {
      console.error("store verification failed:", e);
      return new Response(
        JSON.stringify({
          error: "We couldn't verify that purchase. If you were charged, contact support.",
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const mapped = PRODUCT_MAP[verified.productId];
    if (!mapped) {
      // An unrecognised SKU means the store product and this map disagree.
      // Refusing is the safe failure: granting a guessed tier is worse.
      console.error("unknown product id from store:", verified.productId);
      return new Response(
        JSON.stringify({ error: "Unrecognised product. Please contact support." }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // A sandbox purchase must not grant a real plan in production. Review runs
    // sandbox against the production binary, so this is allowed only when the
    // project is explicitly told to accept it.
    const allowSandbox = Deno.env.get("IAP_ALLOW_SANDBOX") === "true";
    if (verified.environment === "sandbox" && !allowSandbox) {
      return new Response(
        JSON.stringify({ error: "Sandbox purchases are not accepted here." }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── record the store-side subscription ──
    const { error: upsertErr } = await supabase
      .from("iap_subscriptions")
      .upsert(
        {
          user_id: userId,
          platform,
          product_id: verified.productId,
          plan_id: mapped.plan,
          billing_cycle: mapped.cycle,
          store_subscription_id: verified.storeSubscriptionId,
          latest_transaction_id: verified.latestTransactionId,
          status: verified.status,
          expires_at: verified.expiresAt,
          auto_renewing: verified.autoRenewing,
          environment: verified.environment,
          raw: verified.raw,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "platform,store_subscription_id" },
      );

    if (upsertErr) {
      console.error("iap_subscriptions upsert failed:", upsertErr.message);
      return new Response(
        JSON.stringify({ error: "Could not record the purchase. Please try again." }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const entitled = ENTITLING_STATUSES.has(verified.status);

    // ── grant (or withhold) the plan ──
    // Only ever write the profile when the store says the subscription is
    // live. A restore of a lapsed purchase records the row for support but
    // must not hand back the plan.
    if (entitled) {
      const { error: planErr } = await supabase
        .from("influencer_profiles")
        .update({
          subscription_plan: mapped.plan,
          billing_cycle: mapped.cycle,
          payment_gateway: platform === "ios" ? "apple_iap" : "google_play",
          iap_subscription_id: verified.storeSubscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("influencer_id", userId);

      // supabase-js resolves failed writes rather than throwing, so an
      // unchecked result here would report success on a user who got nothing.
      if (planErr) {
        console.error("plan grant failed:", planErr.message);
        return new Response(
          JSON.stringify({
            error: "Purchase verified but the plan didn't apply. Contact support.",
          }),
          { status: 200, headers: jsonHeaders },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        entitled,
        plan: entitled ? mapped.plan : null,
        billingCycle: mapped.cycle,
        status: verified.status,
        expiresAt: verified.expiresAt,
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (e) {
    console.error("verify-iap-purchase failed:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
