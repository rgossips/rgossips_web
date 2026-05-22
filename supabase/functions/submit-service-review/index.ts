// Influencer leaves a review after a service order completes.
//
// Body:
//   { userId, orderId, overall, quality, communication, on_time_delivery,
//     value_for_money, text }
//
// Rules:
//   • order belongs to user
//   • status === 'completed'
//   • no existing review on this order (unique constraint enforces this too)
//
// On success, recomputes services.rating_avg + reviews_count for the
// parent service so the catalogue + detail pages stay accurate without
// triggers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const clampStar = (n: any): number | null => {
  const x = Math.round(Number(n));
  return Number.isFinite(x) && x >= 1 && x <= 5 ? x : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = (await req.json()) || {};
    const { userId, orderId, text } = body;
    const overall = clampStar(body.overall);
    const quality = clampStar(body.quality);
    const communication = clampStar(body.communication);
    const onTime = clampStar(body.on_time_delivery);
    const value = clampStar(body.value_for_money);

    if (!userId || !orderId) {
      return new Response(JSON.stringify({ error: "userId, orderId required" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    if (overall == null) {
      return new Response(JSON.stringify({ error: "Overall rating required (1-5)" }), {
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
      .select("id, user_id, status, service_id, service_title")
      .eq("id", orderId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 200, headers: jsonHeaders });
    }
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your order" }), { status: 200, headers: jsonHeaders });
    }
    if (order.status !== "completed") {
      return new Response(
        JSON.stringify({ error: `Reviews can only be left after a service is completed (current: ${order.status})` }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const { error: insErr } = await supabase.from("service_reviews").insert({
      order_id: orderId,
      user_id: userId,
      service_id: order.service_id,
      overall,
      quality,
      communication,
      on_time_delivery: onTime,
      value_for_money: value,
      text: (text || "").toString().trim() || null,
    });
    if (insErr) {
      // Unique violation → already reviewed
      if ((insErr as any).code === "23505" || /duplicate/i.test(insErr.message || "")) {
        return new Response(JSON.stringify({ error: "You've already reviewed this order" }), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      throw new Error(insErr.message);
    }

    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "review_submitted",
      label: `Review submitted — ${overall}★`,
      meta: { overall, quality, communication, on_time_delivery: onTime, value_for_money: value },
    });

    // Refresh the parent service's aggregate fields. Read all reviews for
    // this service and rewrite the row.
    if (order.service_id) {
      const { data: rows } = await supabase
        .from("service_reviews")
        .select("overall")
        .eq("service_id", order.service_id);
      const ratings = (rows || []).map((r: any) => Number(r.overall)).filter((n) => Number.isFinite(n));
      const count = ratings.length;
      const avg = count > 0 ? ratings.reduce((s, n) => s + n, 0) / count : 0;
      await supabase
        .from("services")
        .update({
          rating_avg: Math.round(avg * 10) / 10,
          reviews_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.service_id);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("submit-service-review error:", err);
    return new Response(
      JSON.stringify({ error: (err as any)?.message || "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
