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
    const { applicationId, submissionLinks } = await req.json();

    if (!applicationId || !submissionLinks) {
      return new Response(
        JSON.stringify({ error: "applicationId and submissionLinks are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the application exists and is in an allowed status
    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("campaign_applications")
      .select("id, status, campaign_id, influencer_id, rejection_reason")
      .eq("id", applicationId)
      .single();

    if (fetchErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const allowedStatuses = ["approved", "revision_needed", "accepted"];
    if (!allowedStatuses.includes(app.status)) {
      return new Response(
        JSON.stringify({ error: "Cannot submit deliverables in current status" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Determine next status:
    //  - accepted → live_submitted (initial live links submission)
    //  - approved → submitted (initial deliverables submission)
    //  - revision_needed → submitted OR live_submitted, depending on which
    //    stage we were in before. The `from` field is set by
    //    update-application-status when the brand requests a revision.
    let nextStatus: "submitted" | "live_submitted" = "submitted";
    if (app.status === "accepted") {
      nextStatus = "live_submitted";
    } else if (app.status === "revision_needed") {
      try {
        const reason = typeof app.rejection_reason === "string"
          ? JSON.parse(app.rejection_reason)
          : app.rejection_reason;
        if (reason?.from === "live_submitted") {
          nextStatus = "live_submitted";
        }
      } catch {
        // Legacy reason without `from` — default to "submitted"
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("campaign_applications")
      .update({
        submission_links: submissionLinks,
        status: nextStatus,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to submit: " + updateErr.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // If the influencer just posted live links, kick off a metrics refresh in
    // the background so the analytics surface has real numbers without waiting
    // for the brand to act. Best-effort — never block the submit on it.
    if (nextStatus === "live_submitted") {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/refresh-application-metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
          body: JSON.stringify({ applicationId }),
        });
      } catch (e) {
        console.error("Metrics refresh kick-off failed:", e);
      }
    }

    // Best-effort notification to the brand
    try {
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("brand_id, title")
        .eq("campaign_id", app.campaign_id)
        .single();

      if (campaign?.brand_id) {
        const { data: influencer } = await supabaseAdmin
          .from("influencer_profiles")
          .select("full_name, username, instagram_handle")
          .eq("influencer_id", app.influencer_id)
          .single();
        const displayName =
          influencer?.full_name ||
          influencer?.username ||
          (influencer?.instagram_handle ? `@${influencer.instagram_handle}` : "An influencer");
        const text =
          nextStatus === "live_submitted"
            ? `${displayName} posted live links for "${campaign.title || "your campaign"}"`
            : `${displayName} submitted deliverables for "${campaign.title || "your campaign"}"`;
        await supabaseAdmin.from("notifications").insert({
          user_id: campaign.brand_id,
          type: nextStatus === "live_submitted" ? "live_submitted" : "deliverables_submitted",
          title: nextStatus === "live_submitted" ? "Live links submitted" : "Deliverables submitted",
          body: JSON.stringify({
            text,
            link: `/brands/campaign/${app.campaign_id}`,
            campaignId: app.campaign_id,
            applicationId: app.id,
          }),
          is_read: false,
        });
      }
    } catch (e) {
      console.error("Failed to create brand notification:", e);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
