import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Extract metadata stored after the `---` separator in description field.
function unpackDescription(raw: string | null) {
  if (!raw) return { body: "", meta: {} as Record<string, unknown> };
  const idx = raw.indexOf("\n\n---\n");
  if (idx < 0) return { body: raw, meta: {} };
  const body = raw.slice(0, idx);
  const metaRaw = raw.slice(idx + 6);
  try {
    return { body, meta: JSON.parse(metaRaw) };
  } catch {
    return { body: raw, meta: {} };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { influencerId } = await req.json().catch(() => ({}));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all campaigns
    const { data: campaigns, error: campError } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch applications for this influencer (if provided)
    let applicationMap: Record<string, any> = {};
    if (influencerId) {
      // Try with submission_links first, fall back without it
      let applications: any[] = [];
      const { data: appsData, error: appErr } = await supabaseAdmin
        .from("campaign_applications")
        .select("campaign_id, status, id, submission_links, rejection_reason, metrics, metrics_refreshed_at, brand_offered_rate, proposed_rate")
        .eq("influencer_id", influencerId);

      if (appErr) {
        console.error("Applications query error:", appErr.message);
        const { data: appsBasic } = await supabaseAdmin
          .from("campaign_applications")
          .select("campaign_id, status, id")
          .eq("influencer_id", influencerId);
        applications = appsBasic || [];
      } else {
        applications = appsData || [];
      }

      for (const app of applications) {
        applicationMap[app.campaign_id] = {
          status: app.status,
          applicationId: app.id,
          submissionLinks: app.submission_links || [],
          rejectionReason: app.rejection_reason || "",
          metrics: app.metrics || null,
          metricsRefreshedAt: app.metrics_refreshed_at || null,
          // B15 offer flow — the influencer UI needs the offer amount to
          // render the Accept / Withdraw card on offer_sent.
          brandOfferedRate: app.brand_offered_rate || 0,
          proposedRate: app.proposed_rate || 0,
        };
      }
    }

    if (campError) {
      console.error("Campaigns error:", campError.message);
      return new Response(
        JSON.stringify({ error: campError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get brand info for all campaigns (via brand_id or brand_invitation_id)
    const brandIds = [...new Set((campaigns || []).map((c: any) => c.brand_id).filter(Boolean))];
    const invitationIds = [...new Set((campaigns || []).map((c: any) => c.brand_invitation_id).filter(Boolean))];
    let brandMap: Record<string, any> = {};

    // Look up registered brands by brand_id
    if (brandIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("brand_profiles")
        .select("brand_id, brand_name, gstin_trade_name, logo_url, instagram_username")
        .in("brand_id", brandIds);

      for (const p of profiles || []) {
        brandMap[p.brand_id] = {
          name: p.gstin_trade_name || p.brand_name || "",
          logo: p.logo_url || "",
          instagram: p.instagram_username || "",
        };
      }
    }

    // Look up brand invitations by id
    if (invitationIds.length > 0) {
      const { data: invitations } = await supabaseAdmin
        .from("brand_invitations")
        .select("id, brand_name, logo_url, instagram_username")
        .in("id", invitationIds);

      for (const inv of invitations || []) {
        if (!brandMap[inv.id]) {
          brandMap[inv.id] = {
            name: inv.brand_name || "",
            logo: inv.logo_url || "",
            instagram: inv.instagram_username || "",
          };
        }
      }
    }

    // Format campaigns for frontend
    const formatted = (campaigns || []).map((c: any) => {
      const brand = brandMap[c.brand_invitation_id] || brandMap[c.brand_id] || { name: "Unknown Brand", logo: "", instagram: "" };
      const initials = brand.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      // Calculate days left + expired flag (uses end_date with deadline fallback)
      let daysLeft = "";
      let isExpired = false;
      const deadlineSource = c.campaign_end_date || c.application_deadline;
      if (deadlineSource) {
        const diff = Math.ceil(
          (new Date(deadlineSource).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (diff > 0) daysLeft = `${diff}d`;
        else if (diff === 0) daysLeft = "Today";
        else {
          daysLeft = "Expired";
          isExpired = true;
        }
      }

      // Application-deadline check is separate. isExpired above prefers
      // campaign_end_date and only falls back to application_deadline —
      // a campaign whose applications closed yesterday but whose overall
      // end date is next month wouldn't be flagged there. This flag is
      // what the Active-list visibility filter below actually checks so
      // late-deadline campaigns disappear from Active while the user's
      // in-flight applications (Applied / Completed tabs) still show them.
      let applicationDeadlinePassed = false;
      if (c.application_deadline) {
        applicationDeadlinePassed =
          new Date(c.application_deadline).getTime() < Date.now();
      }

      // Format deadline
      let deadline = "No deadline";
      if (c.application_deadline) {
        deadline = new Date(c.application_deadline).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      // Format budget
      let budget = "On request";
      if (c.budget_per_influencer) {
        budget = `₹${Number(c.budget_per_influencer).toLocaleString("en-IN")}`;
      } else if (c.budget_total) {
        budget = `₹${Number(c.budget_total).toLocaleString("en-IN")}`;
      }

      // Format deliverables from content_types_required
      // B10 — format "reels:2" entries as "2 Reels" (and "1 Reel", not
      // "1 REELS"): singularise when the count is exactly 1.
      let deliverables = "Not specified";
      if (c.content_types_required && c.content_types_required.length > 0) {
        deliverables = c.content_types_required
          .map((entry: string) => {
            const [type, countRaw] = String(entry).split(":");
            const n = Number(countRaw);
            if (!type) return entry;
            const base = type.charAt(0).toUpperCase() + type.slice(1); // "Reels"
            if (!Number.isFinite(n) || n <= 0) return base;
            const label = n === 1 && base.endsWith("s") ? base.slice(0, -1) : base;
            return `${n} ${label}`;
          })
          .join(" + ");
      }

      // Map status — check if influencer has applied
      const appData = applicationMap[c.campaign_id];
      const appStatus = appData?.status;
      let status = "Active";
      let applicationStatus = null;
      let applicationId = null;
      let submissionLinks: any[] = [];
      let rejectionReason = "";
      let applicationMetrics: any = null;
      let metricsRefreshedAt: string | null = null;
      let brandOfferedRate = 0;
      let proposedRate = 0;

      if (appStatus) {
        applicationStatus = appStatus;
        applicationId = appData.applicationId;
        submissionLinks = appData.submissionLinks || [];
        rejectionReason = appData.rejectionReason || "";
        applicationMetrics = appData.metrics || null;
        metricsRefreshedAt = appData.metricsRefreshedAt || null;
        brandOfferedRate = Number(appData.brandOfferedRate || 0);
        proposedRate = Number(appData.proposedRate || 0);

        if (appStatus === "completed") {
          status = "Completed";
        } else if (appStatus === "rejected" || appStatus === "withdrawn") {
          status = "Active"; // Rejected/withdrawn go back to Active (can re-apply if needed)
        } else {
          // pending, offer_sent, offer_accepted, approved, submitted,
          // accepted, live_submitted, payment all stay in Applied
          status = "Applied";
        }
      } else if (c.status === "open" || c.status === "active") {
        status = "Active";
      } else if (c.status === "closed" || c.status === "completed") {
        status = "Completed";
      } else if (c.status === "draft") {
        status = "Active";
      } else {
        status = c.status.charAt(0).toUpperCase() + c.status.slice(1);
      }

      // Location
      const location = c.target_cities && c.target_cities.length > 0
        ? c.target_cities.join(", ")
        : "Pan India";

      // Tags from categories
      const tags = c.target_categories || [];

      // Unpack metadata from description (banner, gallery, audit fields)
      const { body: descBody, meta } = unpackDescription(c.description);
      const m = meta as any;
      const bannerImage = m.banner_image || "";
      const galleryImages = Array.isArray(m.gallery_images) ? m.gallery_images : [];

      // Platforms — pulled from metadata (lowercased for icon mapping); fallback
      // to instagram so legacy campaigns keep working.
      const rawPlatforms = Array.isArray(m.platforms) ? m.platforms : [];
      const platforms = rawPlatforms.length > 0
        ? rawPlatforms.map((p: string) => String(p).toLowerCase().replace(/\s+\(.*\)/, "").trim())
        : ["instagram"];

      return {
        id: c.campaign_id,
        initials,
        title: c.title || "Untitled Campaign",
        brandId: c.brand_id || null,
        brandName: brand.name,
        brandLogo: brand.logo,
        status,
        tags,
        budget,
        deadline,
        daysLeft,
        deliverables,
        location,
        platforms,
        description: descBody || "",
        bannerImage,
        galleryImages,
        maxInfluencers: c.max_influencers || 0,
        campaignType: c.campaign_type || "",
        startDate: c.campaign_start_date || "",
        endDate: c.campaign_end_date || "",
        applicationDeadline: c.application_deadline || "",
        targetCities: c.target_cities || [],
        targetFollowerMin: c.target_follower_min || 0,
        targetFollowerMax: c.target_follower_max || 0,
        targetInfluencerTier: c.target_influencer_tier || "all",
        applicationStatus,
        applicationId,
        submissionLinks,
        rejectionReason,
        applicationMetrics,
        metricsRefreshedAt,
        brandOfferedRate,
        proposedRate,
        contentTypesRequired: c.content_types_required || [],
        isExpired,
        // Audit fields packed in metadata
        offeringType: m.offering_type || "",
        productName: m.product_name || "",
        productValue: m.product_value || 0,
        shippingRequired: m.shipping_required || "",
        shippingTimelineDays: m.shipping_timeline_days || 0,
        serviceLocation: m.service_location || "",
        barterCompensation: m.barter_compensation || "",
        contentDos: m.content_dos || "",
        contentDonts: m.content_donts || "",
        requiredHashtags: m.required_hashtags || "",
        brandHandlesToTag: m.brand_handles_to_tag || "",
        usageRights: m.usage_rights || "",
        keepupDuration: m.keepup_duration || "",
        exclusivityDays: m.exclusivity_days || "0",
        paymentTimeline: m.payment_timeline || "",
        targetGender: m.target_gender || [],
        targetLanguages: m.target_languages || [],
        minEngagementRate: m.min_engagement_rate || 0,
        rawPlatforms,
        applicationDeadlinePassed,
      };
    });

    // Hide from the influencer list when either the overall campaign
    // ended (isExpired) or the application deadline itself passed
    // (applicationDeadlinePassed), UNLESS the influencer already applied
    // — in that case keep the row so they can still see status, submit
    // deliverables, etc.
    const visible = formatted.filter(
      (c: any) => (!c.isExpired && !c.applicationDeadlinePassed) || c.applicationStatus,
    );

    return new Response(
      JSON.stringify({ campaigns: visible }),
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
