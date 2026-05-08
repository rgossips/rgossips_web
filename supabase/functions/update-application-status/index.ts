import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

const VALID_STATUSES = new Set([
  "pending",
  "approved",
  "submitted",
  "revision_needed",
  "accepted",
  "live_submitted",
  "payment",
  "completed",
  "rejected",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const {
      applicationId,
      brandId,
      status,
      agreedRate,
      rejectionReason,
      revisionNote,
      revisionLinks,
    } = await req.json();

    if (!applicationId || !brandId || !status) {
      return ok({ error: "applicationId, brandId and status are required" });
    }
    if (!VALID_STATUSES.has(status)) {
      return ok({ error: "Invalid status" });
    }

    // Load the application so we can verify ownership
    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, status")
      .eq("id", applicationId)
      .single();
    const previousStatus = app?.status;

    if (appErr || !app) return ok({ error: "Application not found" });

    // Verify the brand owns the campaign
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("brand_id")
      .eq("campaign_id", app.campaign_id)
      .single();

    if (campErr || !campaign) return ok({ error: "Campaign not found" });
    if (campaign.brand_id !== brandId) return ok({ error: "Not authorized" });

    // Build update payload
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved" && typeof agreedRate === "number" && agreedRate > 0) {
      updates.final_agreed_rate = agreedRate;
    }

    if (status === "rejected" && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    if (status === "revision_needed") {
      updates.rejection_reason = JSON.stringify({
        note: revisionNote || "",
        links: Array.isArray(revisionLinks) ? revisionLinks : [],
        // Track the stage we're returning from so the next submit can route
        // back to the same stage (live_submitted vs submitted) instead of
        // defaulting to "submitted".
        from: previousStatus || "",
      });
    }

    const { error: updateErr } = await supabase
      .from("campaign_applications")
      .update(updates)
      .eq("id", applicationId);

    if (updateErr) return ok({ error: "Failed to update: " + updateErr.message });

    // Refresh cached IG insights whenever the application enters a stage
    // where live links matter (payment, completed). Fire-and-forget — the
    // status change shouldn't fail if the refresh hits a token issue.
    if (status === "payment" || status === "completed" || status === "live_submitted") {
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

    // Notify the brand when the status change is NOT initiated by them.
    // (brandId is passed only from brand UI — admin won't pass it, so a
    // missing brandId means "external" change that the brand should know about.)
    // Also notify on `completed` so the brand always learns when deals wrap up.
    try {
      const { data: campApp } = await supabase
        .from("campaign_applications")
        .select("id, campaign_id, influencer_id, campaigns(brand_id, title)")
        .eq("id", applicationId)
        .single();

      const brandOwnerId = (campApp as any)?.campaigns?.brand_id;
      const campaignTitle = (campApp as any)?.campaigns?.title || "your campaign";
      const campaignId = (campApp as any)?.campaign_id;

      // Only notify when the status change originates outside the brand
      // (i.e. no brandId in payload, or brandId doesn't match) AND there's
      // a brand to notify.
      if (brandOwnerId && brandOwnerId !== brandId) {
        const { data: influencer } = await supabase
          .from("influencer_profiles")
          .select("full_name, username, instagram_handle")
          .eq("influencer_id", (campApp as any)?.influencer_id)
          .single();
        const displayName =
          influencer?.full_name ||
          influencer?.username ||
          (influencer?.instagram_handle ? `@${influencer.instagram_handle}` : "an influencer");
        const statusLabel =
          status === "completed" ? "marked completed" : `updated to ${status.replace("_", " ")}`;
        await supabase.from("notifications").insert({
          user_id: brandOwnerId,
          type: `app_${status}`,
          title: `Application ${statusLabel}`,
          body: JSON.stringify({
            text: `${displayName}'s application for "${campaignTitle}" was ${statusLabel}.`,
            link: `/brands/campaign/${campaignId}`,
            campaignId,
            applicationId,
          }),
          is_read: false,
        });
      }
    } catch (e) {
      console.error("Failed to create brand notification:", e);
    }

    return ok({ success: true });
  } catch (err) {
    return ok({
      error: "Internal server error: " + ((err as any)?.message || String(err)),
    });
  }
});
