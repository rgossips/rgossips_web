import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";

// Deliberately loose: one @, something on each side, a dot in the domain.
const isValidEmail = (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
import { truncateText } from "../_shared/text.ts";
import {
  APPLICATION_LIMITS,
  FREE_BARTER_APPLICATIONS,
  effectivePlan,
  isBarterCampaign,
} from "../_shared/plan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serveWithLogging("apply-campaign", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { campaignId, influencerId, proposedRate, pitch } = await req.json();
    // Creator's "why choose you" note (draftable via the AI Pitch Assistant).
    const pitchClean = pitch ? truncateText(String(pitch).trim(), 800) : null;

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

    // Minimum profile before applying: a contact email and gender. Brands
    // filter and contact on both, and neither is collected at signup for
    // phone-OTP creators. The apply forms (web + mobile) collect them inline
    // and save via update-profile, so this refusal is the backstop.
    //
    // Unlike the entitlement gate below, this does NOT fall open on a read
    // failure: it is a data requirement, not a billing one, and a retry
    // costs the creator nothing.
    {
      const { data: basics, error: basicsErr } = await supabaseAdmin
        .from("influencer_profiles")
        .select("email, gender")
        .eq("influencer_id", influencerId)
        .maybeSingle();
      if (basicsErr) {
        return new Response(
          JSON.stringify({ error: "profile_check_failed", message: "Couldn't check your profile. Please try again." }),
          { status: 200, headers: jsonHeaders }
        );
      }
      const missing: string[] = [];
      if (!isValidEmail(basics?.email)) missing.push("email");
      if (!String(basics?.gender || "").trim()) missing.push("gender");
      if (missing.length) {
        return new Response(
          JSON.stringify({
            error: "profile_incomplete",
            missing,
            message: "Add your email and gender to your profile before applying to campaigns.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    // Entitlement gate. Two separate rules, because the free tier is not
    // just a smaller paid tier:
    //
    //   free  → barter campaigns only, FREE_BARTER_APPLICATIONS of them,
    //           counted for the lifetime of the account.
    //   paid  → any campaign type, capped per calendar month.
    //
    // Failure handling differs on purpose. If we cannot read the profile we
    // do not know which rules apply, so we let the apply through — refusing
    // a paying creator over a transient read is the worse outcome. But once
    // we KNOW the creator is on free, a failed count must refuse: falling
    // open there turns a 3-application allowance into an unlimited one.
    let planForLimit = "";
    try {
      const { data: profile } = await supabaseAdmin
        .from("influencer_profiles")
        .select("subscription_plan")
        .eq("influencer_id", influencerId)
        .maybeSingle();

      const plan = effectivePlan(profile);
      planForLimit = plan;

      if (plan === "free") {
        // Re-activating a withdrawn/rejected application does not consume a
        // fresh slot — the row is already counted below either way.
        const { data: campaignRow } = await supabaseAdmin
          .from("campaigns")
          .select("campaign_type")
          .eq("campaign_id", campaignId)
          .maybeSingle();

        if (!isBarterCampaign(campaignRow?.campaign_type)) {
          return new Response(
            JSON.stringify({
              error: "subscription_required",
              message:
                "Paid campaigns are for subscribers. Your free applications cover barter campaigns — subscribe to apply to this one.",
              plan,
              campaignType: campaignRow?.campaign_type || null,
            }),
            { status: 200, headers: jsonHeaders }
          );
        }

        const { count, error: countErr } = await supabaseAdmin
          .from("campaign_applications")
          .select("id", { count: "exact", head: true })
          .eq("influencer_id", influencerId);

        if (countErr) throw countErr; // fail closed — see the note above

        const used = count ?? 0;
        // `reapplying` reuses an existing row, so it is already inside `used`
        // and must not be blocked by its own presence.
        if (!reapplying && used >= FREE_BARTER_APPLICATIONS) {
          return new Response(
            JSON.stringify({
              error: "free_quota_exhausted",
              message: `You've used all ${FREE_BARTER_APPLICATIONS} of your free applications. Subscribe to keep applying.`,
              plan,
              limit: FREE_BARTER_APPLICATIONS,
              used,
            }),
            { status: 200, headers: jsonHeaders }
          );
        }
      } else {
        const cap = APPLICATION_LIMITS[plan] ?? 3;
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
      }
    } catch (e) {
      if (planForLimit === "free") {
        return new Response(
          JSON.stringify({
            error: "quota_check_failed",
            message: "We couldn't confirm your remaining free applications. Please try again in a moment.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      // Paid plan, or the plan was never resolved — let the apply through.
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

    // If this creator was invited to the campaign by the brand, flip that
    // invitation to 'responded' — applying is the positive response the brand
    // tracks. Idempotent + best-effort; never fail the apply on it.
    try {
      await supabaseAdmin
        .from("campaign_invitations")
        .update({ status: "responded", responded_at: new Date().toISOString() })
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId)
        .eq("status", "sent");
    } catch (e) {
      console.error("invite responded-flip failed:", e);
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
