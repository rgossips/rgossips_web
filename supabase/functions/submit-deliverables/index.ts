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

    // Normalise URLs the same way the client does so /reel/X/ and /reel/X
    // and protocol differences don't slip through the dup check.
    const normalise = (raw: string): string => {
      if (!raw) return "";
      try {
        const u = new URL(String(raw).trim());
        const host = u.hostname.toLowerCase().replace(/^www\./, "");
        const path = u.pathname.replace(/\/+$/, "").toLowerCase();
        return `${host}${path}`;
      } catch {
        return String(raw).trim().toLowerCase();
      }
    };

    // Figure out the flow up front so the duplicate rules can branch:
    //  - submitted: initial drafts — any media URL is fine, only dup check.
    //  - live_submitted: published Instagram posts — also enforces a
    //    cross-application dup check (a reel can't power two campaigns).
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
      } catch {}
    }
    const isLiveFlow = nextStatus === "live_submitted";

    // Within-submission duplicates — client should already block these but
    // re-check server-side in case the request was crafted manually. Always
    // enforced regardless of flow.
    const incoming = (Array.isArray(submissionLinks) ? submissionLinks : [])
      .map((s: any) => ({ ...s, _norm: normalise(s?.url) }))
      .filter((s: any) => s._norm);

    const seen = new Set<string>();
    for (const item of incoming) {
      if (seen.has(item._norm)) {
        return new Response(
          JSON.stringify({ error: "Each deliverable needs a unique URL — you submitted the same link twice." }),
          { status: 200, headers: jsonHeaders }
        );
      }
      seen.add(item._norm);
    }

    // Cross-application dup check — only relevant on the live-links stage.
    // A creator can't reuse the same published reel for two campaigns. We
    // skip this on initial drafts because a Drive folder etc. might
    // legitimately be reused while shaping the work.
    if (isLiveFlow && incoming.length > 0) {
      const { data: priorApps } = await supabaseAdmin
        .from("campaign_applications")
        .select("id, submission_links, campaign_id")
        .eq("influencer_id", app.influencer_id)
        .neq("id", applicationId);

      const reused: { url: string; campaignId: string }[] = [];
      for (const row of priorApps || []) {
        const links = Array.isArray(row.submission_links) ? row.submission_links : [];
        for (const l of links) {
          const norm = normalise(l?.url);
          if (!norm) continue;
          if (seen.has(norm)) {
            reused.push({ url: l.url, campaignId: row.campaign_id });
          }
        }
      }

      if (reused.length > 0) {
        const sample = reused[0];
        return new Response(
          JSON.stringify({
            error: `This live post has already been submitted on another campaign (${sample.url}). Please post fresh content for this campaign.`,
          }),
          { status: 200, headers: jsonHeaders }
        );
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
