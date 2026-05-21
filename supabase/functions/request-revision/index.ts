// Influencer requests a revision on a delivered draft.
//
// Body: { userId, orderId, note }
//
// Rules:
//   • order must belong to the user
//   • status must be 'draft_ready'
//   • revisions_used < revisions_allowed (otherwise return out_of_revisions)
//
// On success:
//   • revisions_used += 1
//   • status = 'revision_requested'
//   • timeline event recorded
//   • chat message inserted as the user
//   • previous draft_url retained for reference; cleared draft_note since
//     the new revision is in flight

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { userId, orderId, note } = (await req.json()) || {};
    if (!userId || !orderId) {
      return new Response(JSON.stringify({ error: "userId, orderId required" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    const noteText = (note || "").toString().trim();
    if (noteText.length < 5) {
      return new Response(
        JSON.stringify({ error: "Tell our team what to change (at least a few words)" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: oErr } = await supabase
      .from("service_orders")
      .select("id, user_id, user_role, status, revisions_allowed, revisions_used, service_title")
      .eq("id", orderId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 200, headers: jsonHeaders });
    }
    if (order.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not your order" }), { status: 200, headers: jsonHeaders });
    }
    if (order.status !== "draft_ready") {
      return new Response(
        JSON.stringify({ error: `Can't request a revision in status "${order.status}"` }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if ((order.revisions_used || 0) >= (order.revisions_allowed || 0)) {
      return new Response(
        JSON.stringify({
          error: "out_of_revisions",
          message: `You've used all ${order.revisions_allowed} revision rounds. Reach out to support for additional changes.`,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const nextUsed = (order.revisions_used || 0) + 1;
    const { error: uErr } = await supabase
      .from("service_orders")
      .update({
        status: "revision_requested",
        revisions_used: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (uErr) throw new Error(uErr.message);

    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "revision_requested",
      label: `Revision requested (${nextUsed} / ${order.revisions_allowed})`,
      meta: { revisions_used: nextUsed, note: noteText.slice(0, 280) },
    });

    await supabase.from("service_order_messages").insert({
      order_id: orderId,
      sender_id: userId,
      sender_role: order.user_role || "user",
      body: `Revision requested: ${noteText}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        revisions_used: nextUsed,
        revisions_allowed: order.revisions_allowed,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("request-revision error:", err);
    return new Response(
      JSON.stringify({ error: (err as any)?.message || "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
