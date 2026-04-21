import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

// Merge metadata (banner/gallery/engagement) into description like the admin app.
function packDescription(description: string, meta: Record<string, unknown>) {
  const hasMeta = Object.keys(meta).length > 0;
  if (!hasMeta) return description || "";
  const clean = description || "";
  return clean
    ? `${clean}\n\n---\n${JSON.stringify(meta)}`
    : JSON.stringify(meta);
}

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

function buildContentTypes(nums: Record<string, number | undefined>) {
  const out: string[] = [];
  for (const k of ["reels", "posts", "stories", "videos"]) {
    const n = Number(nums[`num_${k}`] ?? 0);
    if (n > 0) out.push(`${k}:${n}`);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const payload = await req.json().catch(() => ({}));
    const action = payload.action;

    // ── LIST ─────────────────────────────────────────────────────────
    if (action === "list") {
      const { brandId } = payload;
      if (!brandId) return ok({ error: "brandId is required" });

      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) return ok({ error: error.message });

      // Count applications per campaign
      const campaignIds = (campaigns || []).map((c: any) => c.campaign_id);
      let appCounts: Record<string, { total: number; pending: number }> = {};
      if (campaignIds.length > 0) {
        const { data: apps } = await supabase
          .from("campaign_applications")
          .select("campaign_id, status")
          .in("campaign_id", campaignIds);
        for (const a of apps || []) {
          if (!appCounts[a.campaign_id]) appCounts[a.campaign_id] = { total: 0, pending: 0 };
          appCounts[a.campaign_id].total++;
          if (a.status === "pending") appCounts[a.campaign_id].pending++;
        }
      }

      const formatted = (campaigns || []).map((c: any) => {
        const { body, meta } = unpackDescription(c.description);
        return {
          id: c.campaign_id,
          title: c.title,
          description: body,
          bannerImage: meta.banner_image || "",
          galleryImages: meta.gallery_images || [],
          status: c.status || "draft",
          campaignType: c.campaign_type,
          maxInfluencers: c.max_influencers || 0,
          budgetTotal: c.budget_total || 0,
          budgetPerInfluencer: c.budget_per_influencer || 0,
          categories: c.target_categories || [],
          contentTypesRequired: c.content_types_required || [],
          targetCities: c.target_cities || [],
          startDate: c.campaign_start_date || "",
          endDate: c.campaign_end_date || "",
          applicationDeadline: c.application_deadline || "",
          createdAt: c.created_at,
          applicationsTotal: appCounts[c.campaign_id]?.total || 0,
          applicationsPending: appCounts[c.campaign_id]?.pending || 0,
        };
      });

      return ok({ campaigns: formatted });
    }

    // ── DETAIL ───────────────────────────────────────────────────────
    if (action === "get") {
      const { campaignId, brandId } = payload;
      if (!campaignId || !brandId) return ok({ error: "campaignId and brandId are required" });

      const { data: c, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("campaign_id", campaignId)
        .single();

      if (error || !c) return ok({ error: "Campaign not found" });
      if (c.brand_id !== brandId) return ok({ error: "Not authorized" });

      // Fetch applications with influencer info
      const { data: apps } = await supabase
        .from("campaign_applications")
        .select(
          "id, campaign_id, influencer_id, initiated_by, proposed_rate, brand_offered_rate, final_agreed_rate, status, rejection_reason, submission_links, created_at, influencer_profiles ( full_name, username, profile_photo_url, followers_count, instagram_handle, categories )"
        )
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      const { body, meta } = unpackDescription(c.description);

      return ok({
        campaign: {
          id: c.campaign_id,
          title: c.title,
          description: body,
          bannerImage: meta.banner_image || "",
          galleryImages: meta.gallery_images || [],
          minEngagementRate: meta.min_engagement_rate || 0,
          status: c.status || "draft",
          campaignType: c.campaign_type,
          maxInfluencers: c.max_influencers || 0,
          budgetTotal: c.budget_total || 0,
          budgetPerInfluencer: c.budget_per_influencer || 0,
          categories: c.target_categories || [],
          contentTypesRequired: c.content_types_required || [],
          targetCities: c.target_cities || [],
          targetFollowerMin: c.target_follower_min || 0,
          targetFollowerMax: c.target_follower_max || 0,
          targetInfluencerTier: c.target_influencer_tier || "all",
          startDate: c.campaign_start_date || "",
          endDate: c.campaign_end_date || "",
          applicationDeadline: c.application_deadline || "",
          createdAt: c.created_at,
        },
        applications: apps || [],
      });
    }

    // ── CREATE ───────────────────────────────────────────────────────
    if (action === "create") {
      const { brandId, campaign } = payload;
      if (!brandId) return ok({ error: "brandId is required" });
      if (!campaign?.title) return ok({ error: "Title is required" });
      if (!campaign?.campaign_start_date) return ok({ error: "Start date is required" });
      if (!campaign?.campaign_end_date) return ok({ error: "End date is required" });
      if (!campaign?.application_deadline) return ok({ error: "Application deadline is required" });

      const contentTypes = buildContentTypes(campaign);
      const meta: Record<string, unknown> = {};
      if (campaign.banner_image_url) meta.banner_image = campaign.banner_image_url;
      if (Array.isArray(campaign.gallery_image_urls) && campaign.gallery_image_urls.length > 0) {
        meta.gallery_images = campaign.gallery_image_urls;
      }
      if (campaign.min_engagement_rate) meta.min_engagement_rate = Number(campaign.min_engagement_rate);

      const fullDescription = packDescription(campaign.description || "", meta);

      const cities = Array.isArray(campaign.target_cities)
        ? campaign.target_cities.filter(Boolean)
        : typeof campaign.target_cities === "string" && campaign.target_cities
        ? campaign.target_cities.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const row = {
        brand_id: brandId,
        brand_invitation_id: null,
        created_by_admin: false,
        title: campaign.title,
        description: fullDescription || campaign.title,
        campaign_type: campaign.campaign_type || "barter",
        target_categories: Array.isArray(campaign.target_categories) && campaign.target_categories.length > 0
          ? campaign.target_categories
          : ["General"],
        max_influencers: campaign.max_influencers ? Number(campaign.max_influencers) : 10,
        campaign_start_date: campaign.campaign_start_date,
        campaign_end_date: campaign.campaign_end_date,
        application_deadline: campaign.application_deadline,
        content_types_required: contentTypes.length > 0 ? contentTypes : ["reels"],
        budget_total: campaign.budget_total ? Number(campaign.budget_total) : 0,
        budget_per_influencer: campaign.budget_per_influencer ? Number(campaign.budget_per_influencer) : 0,
        target_follower_min: campaign.target_follower_min ? Number(campaign.target_follower_min) : 0,
        target_follower_max: campaign.target_follower_max ? Number(campaign.target_follower_max) : 1000000,
        target_influencer_tier: campaign.target_influencer_tier || "all",
        target_cities: cities.length > 0 ? cities : ["All India"],
        status: "draft",
      };

      const { data: created, error } = await supabase
        .from("campaigns")
        .insert(row)
        .select("campaign_id")
        .single();

      if (error) return ok({ error: error.message });
      return ok({ success: true, campaignId: created.campaign_id });
    }

    // ── UPDATE STATUS ────────────────────────────────────────────────
    if (action === "updateStatus") {
      const { campaignId, brandId, status } = payload;
      if (!campaignId || !brandId || !status) {
        return ok({ error: "campaignId, brandId and status are required" });
      }
      if (!["draft", "active", "paused", "completed"].includes(status)) {
        return ok({ error: "Invalid status" });
      }

      // Verify ownership before mutating
      const { data: c, error: findErr } = await supabase
        .from("campaigns")
        .select("brand_id")
        .eq("campaign_id", campaignId)
        .single();
      if (findErr || !c) return ok({ error: "Campaign not found" });
      if (c.brand_id !== brandId) return ok({ error: "Not authorized" });

      const { error } = await supabase
        .from("campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("campaign_id", campaignId);

      if (error) return ok({ error: error.message });
      return ok({ success: true });
    }

    return ok({ error: "Unknown action" });
  } catch (err) {
    return ok({
      error: "Internal server error: " + ((err as any)?.message || String(err)),
    });
  }
});
