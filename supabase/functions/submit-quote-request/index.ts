// Influencer-side quote submission. Validates the input, inserts a new
// service_orders row with status='pending_quote', appends a "submitted"
// event to service_order_events, and returns the freshly-minted
// order_number so the client can route to it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const URL_RE = /^https?:\/\/\S+\.\S+/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const {
      userId,
      userRole,
      serviceSlug,
      description,
      assetUrl,
      desiredDeliveryDate,
      scope,
      budgetRange,
      styleReferences,
      notes,
    } = body || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 200, headers: jsonHeaders });
    }
    if (!serviceSlug) {
      return new Response(JSON.stringify({ error: "serviceSlug is required" }), { status: 200, headers: jsonHeaders });
    }
    if (!description || description.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Please describe your project in at least 20 characters." }), { status: 200, headers: jsonHeaders });
    }
    if (!assetUrl || !URL_RE.test(String(assetUrl).trim())) {
      return new Response(JSON.stringify({ error: "Paste a valid Google Drive / WeTransfer / Dropbox link." }), { status: 200, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve the service so we can snapshot id + title onto the order.
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, slug, title, is_active")
      .eq("slug", serviceSlug)
      .maybeSingle();
    if (svcErr) throw new Error(svcErr.message);
    if (!service || !service.is_active) {
      return new Response(JSON.stringify({ error: "Service not found" }), { status: 200, headers: jsonHeaders });
    }

    const insertRow = {
      service_id: service.id,
      service_slug: service.slug,
      service_title: service.title,
      user_id: userId,
      user_role: userRole || "",
      status: "pending_quote",
      description: String(description).trim(),
      asset_url: String(assetUrl).trim(),
      scope: scope || null,
      desired_delivery_date: desiredDeliveryDate || null,
      budget_range: budgetRange || null,
      style_references: styleReferences ? String(styleReferences).trim() : null,
      notes: notes ? String(notes).trim() : null,
    };

    const { data: order, error: insertErr } = await supabase
      .from("service_orders")
      .insert(insertRow)
      .select("id, order_number, service_slug")
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // Timeline event for the user's order detail page.
    await supabase.from("service_order_events").insert({
      order_id: order.id,
      type: "submitted",
      label: "Quote request submitted",
      meta: { description_length: insertRow.description.length },
    });

    return new Response(JSON.stringify({
      success: true,
      order: { id: order.id, order_number: order.order_number, service_slug: order.service_slug },
    }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("submit-quote-request error:", err);
    return new Response(
      JSON.stringify({ error: (err as any)?.message || "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
