// Influencer-side responses to an admin's quote:
//   action="accept"   — flip status to 'accepted' (Stripe payment is Phase 3)
//   action="counter"  — record counter_amount + counter_message, status='counter_offered'
//   action="decline"  — status='declined'
//
// Each branch writes a timeline event and a brand/influencer notification.
// Ownership is enforced: the order must belong to the calling user.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_ACTIONS = new Set(["accept", "counter", "decline"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { userId, orderId, action, counterAmount, counterMessage, declineReason } =
      (await req.json()) || {};

    if (!userId || !orderId || !VALID_ACTIONS.has(action)) {
      return new Response(JSON.stringify({ error: "userId, orderId, action required" }), {
        status: 200,
        headers: jsonHeaders,
      });
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
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 200, headers: jsonHeaders });
    }
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your order" }), { status: 200, headers: jsonHeaders });
    }
    if (order.status !== "quoted") {
      return new Response(JSON.stringify({
        error: `Quote can't be responded to in status "${order.status}"`,
      }), { status: 200, headers: jsonHeaders });
    }

    // Quote validity check
    if (order.quote_valid_until && new Date(order.quote_valid_until).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Quote has expired. Please request a fresh quote." }), { status: 200, headers: jsonHeaders });
    }

    let updates: Record<string, unknown> = {};
    let eventType = "";
    let eventLabel = "";

    if (action === "accept") {
      updates = { status: "accepted", updated_at: new Date().toISOString() };
      eventType = "quote_accepted";
      eventLabel = "Quote accepted — awaiting advance payment";
    } else if (action === "counter") {
      const amt = parseInt(String(counterAmount || "0"), 10);
      if (!Number.isFinite(amt) || amt <= 0) {
        return new Response(JSON.stringify({ error: "Enter a valid counter price" }), { status: 200, headers: jsonHeaders });
      }
      updates = {
        status: "counter_offered",
        counter_amount: amt,
        counter_message: counterMessage ? String(counterMessage).trim() : null,
        updated_at: new Date().toISOString(),
      };
      eventType = "counter_offered";
      eventLabel = `Counter offer sent — ₹${amt.toLocaleString("en-IN")}`;
    } else if (action === "decline") {
      updates = {
        status: "declined",
        counter_message: declineReason ? String(declineReason).trim() : null,
        updated_at: new Date().toISOString(),
      };
      eventType = "quote_declined";
      eventLabel = "Quote declined";
    }

    const { error: uErr } = await supabase.from("service_orders").update(updates).eq("id", orderId);
    if (uErr) throw new Error(uErr.message);

    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: eventType,
      label: eventLabel,
      meta: action === "counter" ? { counter_amount: updates.counter_amount } : null,
    });

    // Append a chat message so the thread reflects the action.
    if (action === "counter" && counterMessage) {
      await supabase.from("service_order_messages").insert({
        order_id: orderId,
        sender_id: userId,
        sender_role: order.user_role || "user",
        body: `Counter offer ₹${(updates.counter_amount as number).toLocaleString("en-IN")} — ${counterMessage}`,
      });
    } else if (action === "decline" && declineReason) {
      await supabase.from("service_order_messages").insert({
        order_id: orderId,
        sender_id: userId,
        sender_role: order.user_role || "user",
        body: `Declined: ${declineReason}`,
      });
    }

    return new Response(JSON.stringify({ success: true, status: updates.status }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("respond-to-quote error:", err);
    return new Response(JSON.stringify({ error: (err as any)?.message || "Internal server error" }), { status: 200, headers: jsonHeaders });
  }
});
