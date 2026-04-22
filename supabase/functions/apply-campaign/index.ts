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

    // Notify the brand owning this campaign (best-effort — never fail the apply)
    try {
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("brand_id, title")
        .eq("campaign_id", campaignId)
        .single();

      if (campaign?.brand_id) {
        const { data: influencer } = await supabaseAdmin
          .from("influencer_profiles")
          .select("full_name, username, instagram_handle")
          .eq("influencer_id", influencerId)
          .single();
        const displayName =
          influencer?.full_name ||
          influencer?.username ||
          (influencer?.instagram_handle ? `@${influencer.instagram_handle}` : "An influencer");
        await supabaseAdmin.from("notifications").insert({
          user_id: campaign.brand_id,
          type: "new_application",
          title: "New campaign application",
          body: JSON.stringify({
            text: `${displayName} applied to "${campaign.title || "your campaign"}"`,
            link: `/brands/campaign/${campaignId}`,
            campaignId,
            applicationId: application.id,
          }),
          is_read: false,
        });
      }
    } catch (e) {
      console.error("Failed to create brand notification:", e);
    }

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
