// Creates a Razorpay Order for a service order's advance (50%) or
// final (50%) payment. Mirrors the contract of service-payment-checkout
// (Stripe) so the client can offer either gateway behind the same
// picker.
//
// Body:
//   { userId, orderId, phase: "advance" | "final" }
//
// Returns:
//   { order_id, key_id, amount_paise, currency }   ← feed straight into
//                                                    embedded Razorpay
//                                                    Checkout on the client
//   { error }                                       ← on failure
//
// Required Supabase secrets:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (same keys used for escrow funding)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for DB lookup
//
// Phase rules mirror the Stripe function:
//   "advance" — allowed when status='accepted' or 'quoted'. Amount =
//               total × advance_pct%.
//   "final"   — allowed when status='draft_ready'. Amount = remaining.
// Both reject expired quotes and double-charges.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, orderId, phase } = (await req.json()) || {};
    if (!userId || !orderId || !["advance", "final"].includes(phase)) {
      return new Response(
        JSON.stringify({ error: "userId, orderId, phase (advance|final) required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Razorpay keys not configured" }), { status: 200, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: oErr } = await supabase
      .from("service_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 200, headers: jsonHeaders });
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your order" }), { status: 200, headers: jsonHeaders });
    }

    let amountRupees = 0;
    let lineLabel = "";
    if (phase === "advance") {
      if (!["accepted", "quoted"].includes(order.status)) {
        return new Response(
          JSON.stringify({ error: `Advance payment isn't available in status "${order.status}"` }),
          { status: 200, headers: jsonHeaders }
        );
      }
      if (order.quote_valid_until && new Date(order.quote_valid_until).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: "Quote has expired" }), { status: 200, headers: jsonHeaders });
      }
      if (order.advance_paid) {
        return new Response(JSON.stringify({ error: "Advance has already been paid" }), { status: 200, headers: jsonHeaders });
      }
      amountRupees = Math.round((order.total_amount || 0) * (order.advance_pct || 50) / 100);
      lineLabel = `${order.service_title} — ${order.advance_pct}% advance`;
    } else {
      if (order.status !== "draft_ready") {
        return new Response(
          JSON.stringify({ error: `Final payment isn't available in status "${order.status}"` }),
          { status: 200, headers: jsonHeaders }
        );
      }
      if (order.final_paid) {
        return new Response(JSON.stringify({ error: "Final payment has already been made" }), { status: 200, headers: jsonHeaders });
      }
      const advance = Math.round((order.total_amount || 0) * (order.advance_pct || 50) / 100);
      amountRupees = (order.total_amount || 0) - advance;
      lineLabel = `${order.service_title} — final ${100 - (order.advance_pct || 50)}%`;
    }
    if (amountRupees <= 0) {
      return new Response(JSON.stringify({ error: "Amount must be positive" }), { status: 200, headers: jsonHeaders });
    }

    const amountPaise = amountRupees * 100;

    // Razorpay caps `receipt` at 40 chars; the order UUID alone is 36.
    // Notes carry the kind/phase discriminator so the webhook can route.
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: orderId,
        notes: {
          kind: "service_payment",
          phase,
          order_id: orderId,
          order_number: order.order_number || "",
          user_id: userId,
          service_title: lineLabel.slice(0, 200),
        },
      }),
    });
    const orderBody = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) {
      return new Response(
        JSON.stringify({ error: "Could not create Razorpay order", razorpay: orderBody }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: (orderBody as any).id,
        key_id: keyId,
        amount_paise: amountPaise,
        currency: "INR",
        line_label: lineLabel,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err: any) {
    console.error("razorpay-service-checkout error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
