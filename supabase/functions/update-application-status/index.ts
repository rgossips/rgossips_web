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
      });
    }

    const { error: updateErr } = await supabase
      .from("campaign_applications")
      .update(updates)
      .eq("id", applicationId);

    if (updateErr) return ok({ error: "Failed to update: " + updateErr.message });

    return ok({ success: true });
  } catch (err) {
    return ok({
      error: "Internal server error: " + ((err as any)?.message || String(err)),
    });
  }
});
