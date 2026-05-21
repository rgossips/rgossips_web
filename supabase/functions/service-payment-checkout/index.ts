// Creates a Stripe Checkout Session for a service order's advance (50%) or
// final (50%) payment.
//
// Body:
//   { userId, orderId, phase: "advance" | "final" }
//
// Returns:
//   { url, sessionId }                           ← Stripe checkout URL
//   { error }                                    ← on failure
//
// Required Supabase secrets:
//   STRIPE_SECRET_KEY  (already configured for subscriptions)
//   APP_URL            (e.g. https://rgossips.com)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for DB lookup
//
// Phase rules:
//   "advance" — allowed when status='accepted'. Amount = total × advance_pct%.
//   "final"   — allowed when status='draft_ready'. Amount = remaining 100-advance%.
// Both reject expired quotes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, orderId, phase } = (await req.json()) || {};

    if (!userId || !orderId || !["advance", "final"].includes(phase)) {
      return new Response(
        JSON.stringify({ error: "userId, orderId, phase (advance|final) required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is not configured" }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const appUrl = Deno.env.get("APP_URL") || "https://rgossips.com";

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
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 200, headers: jsonHeaders });
    }
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your order" }), { status: 200, headers: jsonHeaders });
    }

    // Phase-specific gate + amount calculation
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
      // phase === "final"
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

    // Stripe expects the smallest currency unit. INR = paise (×100).
    const amountPaise = amountRupees * 100;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[]", "card");
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "inr");
    params.append("line_items[0][price_data][unit_amount]", String(amountPaise));
    params.append("line_items[0][price_data][product_data][name]", lineLabel.slice(0, 120));
    params.append("line_items[0][price_data][product_data][metadata][order_number]", order.order_number);
    params.append("client_reference_id", orderId);
    // The webhook uses these to find the order + know which phase fired.
    params.append("metadata[kind]", "service_payment");
    params.append("metadata[phase]", phase);
    params.append("metadata[order_id]", orderId);
    params.append("metadata[order_number]", order.order_number);
    params.append("metadata[user_id]", userId);
    params.append(
      "success_url",
      `${appUrl}/influencer/services/orders/${orderId}?paid=${phase}&session_id={CHECKOUT_SESSION_ID}`
    );
    params.append(
      "cancel_url",
      `${appUrl}/influencer/services/orders/${orderId}?canceled=${phase}`
    );

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (session?.error) {
      return new Response(
        JSON.stringify({ error: session.error.message || "Stripe error" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("service-payment-checkout error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + ((err as any)?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
