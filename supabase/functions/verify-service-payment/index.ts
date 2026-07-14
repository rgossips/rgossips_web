// Client-triggered verification fallback for Razorpay service-order payments.
//
// The razorpay-webhook (payment.captured) is the normal source of truth that
// flips a service order to in_progress / paid_final. When that webhook is
// disabled/dropped, the order would sit unchanged after the user pays — so
// the client calls this right after a successful Razorpay checkout, exactly
// like reconcile-subscription does for subscriptions.
//
// Security: we don't trust the client's "I paid" claim. We fetch the Razorpay
// ORDER server-side (service role + Razorpay secret) and only progress the
// order when Razorpay itself reports status="paid" AND the order's notes match
// this service order + phase AND the caller owns the service order. Idempotent
// via the shared helper (re-checks advance_paid/final_paid).
//
// Body: { userId, orderId, phase: "advance"|"final", razorpayOrderId }
//
// Deploy WITHOUT --no-verify-jwt is fine (called with the publishable key like
// the checkout functions); the real gate is the Razorpay paid-status check.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyServicePaymentCaptured } from "../_shared/service-payment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: jsonHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, orderId, phase, razorpayOrderId } = (await req.json()) || {};
    if (!userId || !orderId || !["advance", "final"].includes(phase) || !razorpayOrderId) {
      return json({ error: "userId, orderId, phase (advance|final), razorpayOrderId required" });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return json({ error: "Razorpay keys not configured" });
    const auth = "Basic " + btoa(`${keyId}:${keySecret}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ownership check — a user can only settle their own order.
    const { data: order } = await supabase
      .from("service_orders")
      .select("id, user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return json({ error: "Order not found" });
    if (order.user_id !== userId) return json({ error: "Not your order" });

    // Authoritative check against Razorpay — is this order actually paid, and
    // does it belong to this service order + phase?
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) },
    );
    const rzpOrder = await rzpRes.json().catch(() => ({}));
    if (!rzpRes.ok || !rzpOrder?.id) {
      return json({ verified: false, error: "Could not verify payment with Razorpay" });
    }
    const notesOrderId = String(rzpOrder?.notes?.order_id || "");
    const notesPhase = String(rzpOrder?.notes?.phase || "");
    if (notesOrderId !== orderId || (notesPhase && notesPhase !== phase)) {
      return json({ verified: false, error: "Payment does not match this order" });
    }
    if (String(rzpOrder.status) !== "paid") {
      // Not settled yet — the client keeps polling; a later call (or the
      // webhook, if enabled) will finish it.
      return json({ verified: false, status: rzpOrder.status });
    }

    // Grab the captured payment id for stamping (best-effort — the status flip
    // doesn't depend on it).
    let paymentId = "";
    try {
      const pRes = await fetch(
        `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}/payments`,
        { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) },
      );
      const pBody = await pRes.json().catch(() => ({}));
      const items: any[] = Array.isArray(pBody?.items) ? pBody.items : [];
      const captured = items.find((p) => p.status === "captured") || items[0];
      paymentId = String(captured?.id || "");
    } catch {
      /* non-fatal */
    }

    const result = await applyServicePaymentCaptured(supabase, {
      orderId,
      phase: notesPhase || phase,
      paymentId,
      amountPaise: Number(rzpOrder.amount_paid || rzpOrder.amount || 0),
    });

    return json({ verified: true, ...result });
  } catch (err: any) {
    console.error("verify-service-payment error:", err?.message || err);
    return json({ error: "Internal server error: " + (err?.message || String(err)) });
  }
});
