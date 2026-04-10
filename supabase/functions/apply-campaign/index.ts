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
    const { campaignId, influencerId, proposedRate } = await req.json();

    if (!campaignId || !influencerId) {
      return new Response(
        JSON.stringify({ error: "campaignId and influencerId are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already applied
    const { data: existing } = await supabaseAdmin
      .from("campaign_applications")
      .select("id, status")
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "already_applied", message: "You have already applied to this campaign", application: existing }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Insert application
    const { data: application, error: insertError } = await supabaseAdmin
      .from("campaign_applications")
      .insert({
        campaign_id: campaignId,
        influencer_id: influencerId,
        initiated_by: "influencer",
        status: "pending",
        proposed_rate: proposedRate || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit application: " + insertError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get campaign title for notification
    try {
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("title")
        .eq("campaign_id", campaignId)
        .single();

      await supabaseAdmin.from("notifications").insert({
        user_id: influencerId,
        type: "campaign_applied",
        title: "Application submitted",
        body: `Your application for "${campaign?.title || "a campaign"}" has been submitted. We'll notify you when the brand responds.`,
        is_read: false,
      });
    } catch {}

    return new Response(
      JSON.stringify({ success: true, application }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
