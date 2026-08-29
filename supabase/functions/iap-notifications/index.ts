// Store subscription lifecycle — Apple App Store Server Notifications V2 and
// Google Real-time Developer Notifications.
//
// Renewals, cancellations, refunds, billing failures and grace periods all
// happen outside the app, long after the purchase. Without this endpoint the
// database only ever sees the initial buy, so a user who cancels keeps their
// plan indefinitely and a refunded purchase is never revoked.
//
// One function handles both stores because the downstream work is identical.
//
// Deliberate design: the notification is treated as "something changed", NOT
// as the new state. Whatever arrives, we go back to the store and ask for the
// authoritative subscription, then write that. Two benefits:
//
//   1. Security. A forged notification cannot grant or revoke anything,
//      because the entitlement is decided by the store's own answer. That
//      matters here since neither store authenticates the POST in a way we
//      can rely on alone.
//   2. Correctness. There are ~13 Google notification types and ~15 Apple
//      ones, many with subtypes. Mapping each to a state transition is a
//      large surface to get subtly wrong; re-reading current state is not.
//
// Configure in:
//   App Store Connect → App Information → App Store Server Notifications (V2)
//   Play Console → Monetisation setup → Real-time developer notifications
//     (Pub/Sub topic with a push subscription pointed at this URL)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  verifyApple,
  verifyGoogle,
  PRODUCT_MAP,
  ENTITLING_STATUSES,
  type VerifiedSubscription,
} from "../_shared/iap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decodeJwsPayload<T>(jws: string): T {
  const part = jws.split(".")[1];
  const pad = part.length % 4 ? "=".repeat(4 - (part.length % 4)) : "";
  return JSON.parse(
    atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad),
  ) as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  // Both stores retry on any non-2xx. Past the parsing stage we answer 200
  // even on internal failure and log instead — an endless retry storm for a
  // bug we cannot fix by being retried is worse than a dropped event, and the
  // expiry sweep below catches anything genuinely missed.
  const ok = (body: Record<string, unknown> = { received: true }) =>
    new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();

    let platform: "ios" | "android";
    let storeId: string;
    let eventLabel = "";

    if (body?.signedPayload) {
      // ── Apple ──
      const payload = decodeJwsPayload<Record<string, any>>(body.signedPayload);
      eventLabel = `${payload.notificationType}${payload.subtype ? "/" + payload.subtype : ""}`;
      const signedTx = payload?.data?.signedTransactionInfo;
      if (!signedTx) {
        console.warn("apple notification without transaction info:", eventLabel);
        return ok();
      }
      const tx = decodeJwsPayload<Record<string, any>>(signedTx);
      platform = "ios";
      // Re-read by the ORIGINAL transaction id: it is the stable identity
      // across renewals, and it is what the subscriptions endpoint keys on.
      storeId = String(tx.originalTransactionId || tx.transactionId || "");
    } else if (body?.message?.data) {
      // ── Google (Pub/Sub push envelope) ──
      const decoded = JSON.parse(atob(body.message.data));
      const sub = decoded?.subscriptionNotification;
      if (!sub?.purchaseToken) {
        // Test publishes and voided-purchase notifications land here too.
        console.log("google notification without a subscription:", Object.keys(decoded || {}));
        return ok();
      }
      platform = "android";
      storeId = String(sub.purchaseToken);
      eventLabel = `google:${sub.notificationType}`;
    } else {
      console.warn("unrecognised notification shape");
      return ok();
    }

    if (!storeId) {
      console.warn("notification carried no store identity:", eventLabel);
      return ok();
    }

    // ── who owns this subscription ──
    // The store never tells us the user; our own ledger does. An unknown
    // identity means the purchase was never verified through
    // verify-iap-purchase — nothing to update.
    const { data: row } = await supabase
      .from("iap_subscriptions")
      .select("user_id, plan_id")
      .eq("platform", platform)
      .eq("store_subscription_id", storeId)
      .maybeSingle();

    if (!row?.user_id) {
      console.log("notification for unknown subscription", platform, storeId, eventLabel);
      return ok();
    }
    const userId = row.user_id as string;

    // ── ask the store for current truth ──
    let verified: VerifiedSubscription;
    try {
      verified =
        platform === "ios" ? await verifyApple(storeId) : await verifyGoogle(storeId);
    } catch (e) {
      console.error("re-verification failed for", platform, storeId, e);
      return ok();
    }

    const mapped = PRODUCT_MAP[verified.productId];

    const { error: upErr } = await supabase
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

    if (upErr) console.error("iap_subscriptions update failed:", upErr.message);

    // ── apply to the entitlement ──
    const gateway = platform === "ios" ? "apple_iap" : "google_play";
    const { data: profile } = await supabase
      .from("influencer_profiles")
      .select("payment_gateway, iap_subscription_id, subscription_plan")
      .eq("influencer_id", userId)
      .maybeSingle();

    // Same two skip conditions the Razorpay webhook uses, for the same
    // reason: a late event about a subscription the user has already moved on
    // from must not disturb the one they are actually paying for.
    //
    //   (a) they switched rails — this event is about a stale subscription
    //   (b) a different store subscription is the live one (upgrade chain,
    //       resubscribe, or the other platform)
    const staleGateway =
      profile?.payment_gateway && profile.payment_gateway !== gateway;
    const staleSubscription =
      profile?.iap_subscription_id && profile.iap_subscription_id !== storeId;

    if (ENTITLING_STATUSES.has(verified.status)) {
      if (!mapped) {
        console.error("entitling notification for unknown product:", verified.productId);
        return ok();
      }
      // A renewal or recovery re-asserts the plan. Safe even when another rail
      // was active: the user is demonstrably paying on this one right now.
      const { error } = await supabase
        .from("influencer_profiles")
        .update({
          subscription_plan: mapped.plan,
          billing_cycle: mapped.cycle,
          payment_gateway: gateway,
          iap_subscription_id: storeId,
          updated_at: new Date().toISOString(),
        })
        .eq("influencer_id", userId);
      if (error) console.error("plan re-grant failed:", error.message);
      return ok({ received: true, event: eventLabel, applied: "granted" });
    }

    // Not entitling — cancelled, expired, refunded, on hold.
    if (staleGateway || staleSubscription) {
      console.log(
        "ignoring lapse of a subscription that is not the live one",
        platform,
        storeId,
        eventLabel,
      );
      return ok({ received: true, event: eventLabel, applied: "skipped-stale" });
    }

    // 'starter' is the floor the Razorpay webhook drops to on cancellation;
    // matching it keeps one downgrade destination across every rail.
    const { error: downErr } = await supabase
      .from("influencer_profiles")
      .update({
        subscription_plan: "starter",
        iap_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("influencer_id", userId);
    if (downErr) console.error("downgrade failed:", downErr.message);

    return ok({ received: true, event: eventLabel, applied: "downgraded" });
  } catch (e) {
    console.error("iap-notifications failed:", e);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
