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
    const { campaignId, influencerId, proposedRate, pitch } = await req.json();
    // Creator's "why choose you" note (draftable via the AI Pitch Assistant).
    const pitchClean = pitch ? String(pitch).trim().slice(0, 800) : null;

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

    // Check if already applied. A withdrawn or rejected application sends
    // the campaign back to the influencer's Active tab (see list-campaigns),
    // so re-applying is allowed — but the row still exists and there's a
    // UNIQUE(campaign_id, influencer_id) index, so we must RE-ACTIVATE that
    // row rather than insert a new one. Any other (still-live) status really
    // is "already applied" and stays blocked.
    const REAPPLIABLE = new Set(["withdrawn", "rejected"]);
    const { data: existing } = await supabaseAdmin
      .from("campaign_applications")
      .select("id, status")
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .maybeSingle();

    if (existing && !REAPPLIABLE.has(existing.status)) {
      return new Response(
        JSON.stringify({ error: "already_applied", message: "You have already applied to this campaign", application: existing }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const reapplying = !!existing; // existing is withdrawn/rejected

    // Plan-based application limit (mirrors src/lib/plans.js values):
    //   starter → 3/month, pro/trial → 15/month, elite → unlimited
    try {
      const { data: profile } = await supabaseAdmin
        .from("influencer_profiles")
        .select("subscription_plan, created_at")
        .eq("influencer_id", influencerId)
        .maybeSingle();

      const TRIAL_DAYS = 30;
      const explicit = (profile?.subscription_plan || "").toLowerCase();
      let plan: string;
      if (explicit === "starter" || explicit === "pro" || explicit === "elite") {
        plan = explicit;
      } else if (profile?.created_at) {
        const days = (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
        plan = days < TRIAL_DAYS ? "pro" : "starter";
      } else {
        plan = "starter";
      }

      const limits: Record<string, number> = { starter: 3, pro: 15, elite: Infinity };
      const cap = limits[plan] ?? 3;

      if (cap !== Infinity) {
        // Count this calendar month's applications
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { count } = await supabaseAdmin
          .from("campaign_applications")
          .select("id", { count: "exact", head: true })
          .eq("influencer_id", influencerId)
          .gte("created_at", monthStart.toISOString());

        if ((count ?? 0) >= cap) {
          return new Response(
            JSON.stringify({
              error: "plan_limit_reached",
              message: `You've reached your ${plan} plan limit of ${cap} applications this month. Upgrade to apply to more campaigns.`,
              plan,
              limit: cap,
              used: count ?? 0,
            }),
            { status: 200, headers: jsonHeaders }
          );
        }
      }
    } catch (e) {
      // Non-blocking — we'd rather let an apply through than block on a count failure.
      console.error("Plan-limit check failed:", e);
    }

    // Create OR re-activate the application. Re-applying updates the existing
    // withdrawn/rejected row back to pending (the unique index forbids a
    // second row), clearing any stale negotiation state from the prior round.
    let application, insertError;
    if (reapplying) {
      const res = await supabaseAdmin
        .from("campaign_applications")
        .update({
          status: "pending",
          initiated_by: "influencer",
          proposed_rate: proposedRate || null,
          pitch: pitchClean,
          brand_offered_rate: null,
          final_agreed_rate: null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      application = res.data;
      insertError = res.error;
    } else {
      const res = await supabaseAdmin
        .from("campaign_applications")
        .insert({
          campaign_id: campaignId,
          influencer_id: influencerId,
          initiated_by: "influencer",
          status: "pending",
          proposed_rate: proposedRate || null,
          pitch: pitchClean,
        })
        .select()
        .single();
      application = res.data;
      insertError = res.error;
    }

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit application: " + insertError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Status-history seed row — every later transition derives its SLA
    // latency from the timestamp difference against the previous row.
    try {
      await supabaseAdmin.from("application_status_history").insert({
        application_id: application.id,
        from_status: reapplying ? existing.status : null,
        to_status: "pending",
        changed_by: influencerId,
        changed_by_role: "influencer",
      });
    } catch (e) {
      console.error("status-history seed insert failed:", e);
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
