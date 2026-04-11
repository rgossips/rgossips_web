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
