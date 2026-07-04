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
  for (const k of ["reels", "posts", "stories", "videos", "blogs"]) {
    const n = Number(nums[`num_${k}`] ?? 0);
    if (n > 0) out.push(`${k}:${n}`);
  }
  return out;
}

// Extra audit fields stored inside description metadata (no DB migration).
function pickExtras(c: any) {
  const extras: Record<string, unknown> = {};
  const keys = [
    "offering_type",
    "platforms",
    "product_name",
    "product_value",
    "shipping_required",
    "shipping_timeline_days",
    "service_location",
    "barter_compensation",
    "content_dos",
    "content_donts",
    "required_hashtags",
    "brand_handles_to_tag",
    "usage_rights",
    "keepup_duration",
    "exclusivity_days",
    "payment_timeline",
    "target_gender",
    "target_languages",
  ];
  for (const k of keys) {
    const v = (c as any)[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    extras[k] = v;
  }
  return extras;
}

// ─── Matching + notification helpers ────────────────────────────
// Returns the set of influencer_ids that "match" a campaign — the same
// idea a brand would express in /brands/search as filter chips. Used at
// campaign create (for the fan-out notification) and campaign get (for
// the "N influencers match" callout on detail).
async function findMatchingInfluencerIds(
  supabase: any,
  campaignRow: {
    target_categories?: string[] | null;
    target_follower_min?: number | null;
    target_follower_max?: number | null;
    target_cities?: string[] | null;
  },
): Promise<string[]> {
  const wantedCats = new Set(
    Array.isArray(campaignRow.target_categories)
      ? campaignRow.target_categories.filter((c): c is string => typeof c === "string")
      : [],
  );
  const minFollowers = Number(campaignRow.target_follower_min || 0);
  const maxFollowers = Number(campaignRow.target_follower_max || 1_000_000_000);
  const cityList = (Array.isArray(campaignRow.target_cities) ? campaignRow.target_cities : [])
    .map((s) => String(s || "").toLowerCase().trim())
    .filter(Boolean);
  const cityAllIndia = cityList.length === 0 || cityList.includes("all india");

  // Pull the whole active directory. Same PAGE size as list-influencers
  // uses; caps at 10k to guard against pathological cases.
  const PAGE = 1000;
  const HARD_CAP = 10_000;
  const rows: any[] = [];
  for (let from = 0; from < HARD_CAP; from += PAGE) {
    const { data, error } = await supabase
      .from("influencer_profiles")
      .select("influencer_id, categories, followers_count, city, location, status")
      .eq("status", "active")
      .order("followers_count", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  if (rows.length === 0) return [];

  // Privacy filter — mirror list-influencers so a creator who set their
  // profile private isn't notified. Missing row defaults to public.
  const ids = rows.map((r) => r.influencer_id);
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("user_id, privacy_prefs")
    .in("user_id", ids);
  const privateIds = new Set<string>();
  for (const p of prefs || []) {
    if (p?.privacy_prefs?.publicProfile === false) privateIds.add(String(p.user_id));
  }

  const matches: string[] = [];
  for (const inf of rows) {
    if (privateIds.has(String(inf.influencer_id))) continue;

    // At least one shared category. If the campaign has "General"
    // (a placeholder we use when no categories were picked), we skip
    // this filter and match on the other axes only.
    if (wantedCats.size > 0 && !(wantedCats.size === 1 && wantedCats.has("General"))) {
      const infCats = Array.isArray(inf.categories) ? inf.categories : [];
      const overlap = infCats.some((c: string) => wantedCats.has(c));
      if (!overlap) continue;
    }

    // Followers band. 0-follower rows (mostly un-enriched invitations)
    // are excluded from a match so brands don't spam creators whose
    // Instagram hasn't been synced yet.
    const fc = Number(inf.followers_count || 0);
    if (fc <= 0) continue;
    if (fc < minFollowers || fc > maxFollowers) continue;

    // City match — same fuzzy substring pattern the client uses on the
    // Location filter. "All India" / empty city list matches everyone.
    if (!cityAllIndia) {
      const city = String(inf.city || inf.location || "").toLowerCase();
      if (!city) continue;
      const hit = cityList.some((c) => city.includes(c) || c.includes(city));
      if (!hit) continue;
    }

    matches.push(inf.influencer_id);
  }
  return matches;
}

// Fan-out — one notification row per matching creator, batched. Best-
// effort: notification failures never break campaign creation. We cap
// at 2000 to bound the write; anything beyond is silently truncated
// (an alert-only-first-N tradeoff we make because the fan-out is
// awaited before returning the create response).
async function notifyMatchingInfluencers(
  supabase: any,
  influencerIds: string[],
  campaign: { campaign_id: string; title: string },
  brandName: string,
): Promise<void> {
  if (influencerIds.length === 0) return;
  const capped = influencerIds.slice(0, 2000);
  const rows = capped.map((id) => ({
    user_id: id,
    type: "campaign_match",
    title: "New campaign matching your profile",
    body: JSON.stringify({
      text: `${brandName || "A brand"} just posted "${campaign.title}" — matches your categories. Apply before applications close.`,
      link: `/influencer/campaigns`,
    }),
    is_read: false,
  }));
  // Chunk into 500-row batches — the REST API handles this size cleanly
  // and any single failed chunk doesn't sink the rest.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    try {
      await supabase.from("notifications").insert(slice);
    } catch (e) {
      console.error("notifyMatchingInfluencers chunk failed:", (e as any)?.message);
    }
  }
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

      // Fetch applications with influencer info. custom_profile_photo_url
      // is the influencer's manual upload (via upload-profile-photo);
      // profile_photo_url is the Instagram-synced version. The client
      // reads `inf.profile_photo_url`, so we coalesce the two below so
      // a custom upload actually shows through on the campaign detail
      // page instead of being masked by the Instagram photo.
      const { data: apps } = await supabase
        .from("campaign_applications")
        .select(
          "id, campaign_id, influencer_id, initiated_by, proposed_rate, brand_offered_rate, final_agreed_rate, status, rejection_reason, submission_links, created_at, influencer_profiles ( full_name, username, profile_photo_url, custom_profile_photo_url, followers_count, follows_count, media_count, instagram_handle, categories, bio, engagement_rate, email, location, media_kit_published )"
        )
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      // Coalesce custom upload over Instagram photo so downstream
      // consumers can keep reading inf.profile_photo_url unchanged.
      const appsWithPhoto = (apps || []).map((a: any) => {
        const p = a.influencer_profiles;
        if (!p) return a;
        return {
          ...a,
          influencer_profiles: {
            ...p,
            profile_photo_url: p.custom_profile_photo_url || p.profile_photo_url || "",
          },
        };
      });

      const { body, meta } = unpackDescription(c.description);

      const m = meta as any;

      // Best-effort matching count. Errors don't sink the get response
      // — the client tolerates matchingCount=0 or undefined by hiding
      // the callout.
      let matchingCount = 0;
      try {
        const matchingIds = await findMatchingInfluencerIds(supabase, {
          target_categories: c.target_categories,
          target_follower_min: c.target_follower_min,
          target_follower_max: c.target_follower_max,
          target_cities: c.target_cities,
        });
        matchingCount = matchingIds.length;
      } catch (e) {
        console.error("matching count on get failed:", (e as any)?.message || e);
      }

      return ok({
        matchingCount,
        campaign: {
          id: c.campaign_id,
          title: c.title,
          description: body,
          bannerImage: m.banner_image || "",
          galleryImages: m.gallery_images || [],
          minEngagementRate: m.min_engagement_rate || 0,
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
          // Extended audit fields from description metadata
          platforms: m.platforms || [],
          productName: m.product_name || "",
          productValue: m.product_value || 0,
          shippingRequired: m.shipping_required || "no",
          shippingTimelineDays: m.shipping_timeline_days || 0,
          barterCompensation: m.barter_compensation || "",
          contentDos: m.content_dos || "",
          contentDonts: m.content_donts || "",
          requiredHashtags: m.required_hashtags || "",
          brandHandlesToTag: m.brand_handles_to_tag || "",
          requiresApproval: !!m.requires_approval,
          approvalTurnaroundHours: m.approval_turnaround_hours || "",
          usageRights: m.usage_rights || "",
          keepupDuration: m.keepup_duration || "",
          exclusivityDays: m.exclusivity_days || "0",
          paymentTimeline: m.payment_timeline || "",
          targetGender: m.target_gender || [],
          targetLanguages: m.target_languages || [],
        },
        applications: appsWithPhoto,
      });
    }

    // ── CREATE ───────────────────────────────────────────────────────
    if (action === "create") {
      const { brandId, campaign } = payload;
      if (!brandId) return ok({ error: "brandId is required" });
      if (!campaign?.title) return ok({ error: "Title is required" });
      if (!campaign?.campaign_start_date) return ok({ error: "Start date is required" });
      if (!campaign?.application_deadline) return ok({ error: "Application deadline is required" });
      if (!campaign?.campaign_end_date) return ok({ error: "Campaign end date is required" });
      const deadline = campaign.application_deadline;

      const contentTypes = buildContentTypes(campaign);
      const meta: Record<string, unknown> = {};
      if (campaign.banner_image_url) meta.banner_image = campaign.banner_image_url;
      if (Array.isArray(campaign.gallery_image_urls) && campaign.gallery_image_urls.length > 0) {
        meta.gallery_images = campaign.gallery_image_urls;
      }
      if (campaign.min_engagement_rate) meta.min_engagement_rate = Number(campaign.min_engagement_rate);
      // Pack the extended audit fields into the same metadata blob so we
      // don't need a DB migration for them.
      Object.assign(meta, pickExtras(campaign));

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
        application_deadline: deadline,
        content_types_required: contentTypes.length > 0 ? contentTypes : ["reels"],
        budget_total: campaign.budget_total ? Number(campaign.budget_total) : 0,
        budget_per_influencer: campaign.budget_per_influencer ? Number(campaign.budget_per_influencer) : 0,
        target_follower_min: campaign.target_follower_min ? Number(campaign.target_follower_min) : 0,
        target_follower_max: campaign.target_follower_max ? Number(campaign.target_follower_max) : 1000000,
        target_influencer_tier: campaign.target_influencer_tier || "all",
        target_cities: cities.length > 0 ? cities : ["All India"],
        status: campaign.status === "active" ? "active" : "draft",
      };

      const { data: created, error } = await supabase
        .from("campaigns")
        .insert(row)
        .select("campaign_id")
        .single();

      if (error) return ok({ error: error.message });

      // Match + notify — only on active-status create. Drafts are
      // work-in-progress and shouldn't spam creators. Failures here
      // never block the campaign creation.
      let matchingCount = 0;
      if (row.status === "active") {
        try {
          const matchingIds = await findMatchingInfluencerIds(supabase, {
            target_categories: row.target_categories as string[],
            target_follower_min: row.target_follower_min as number,
            target_follower_max: row.target_follower_max as number,
            target_cities: row.target_cities as string[],
          });
          matchingCount = matchingIds.length;
          // Resolve the brand's public name for the notification copy.
          let brandName = "A brand";
          try {
            const { data: bp } = await supabase
              .from("brand_profiles")
              .select("brand_name")
              .eq("brand_id", brandId)
              .maybeSingle();
            if (bp?.brand_name) brandName = bp.brand_name;
          } catch { /* silent */ }
          await notifyMatchingInfluencers(
            supabase,
            matchingIds,
            { campaign_id: created.campaign_id, title: row.title as string },
            brandName,
          );
        } catch (e) {
          console.error("match+notify on create failed:", (e as any)?.message || e);
        }
      }

      return ok({ success: true, campaignId: created.campaign_id, matchingCount });
    }

    // ── UPDATE (full edit) ───────────────────────────────────────────
    // Same field mapping as create, but as an UPDATE keyed on
    // campaign_id + brand_id. Refuses if ANY campaign_applications row
    // exists — once a creator's applied, the brief they applied to is
    // frozen. Client can either pause + duplicate or accept the
    // rejection here and try again. Not authorized returns 200 with an
    // error string to match the rest of this file.
    if (action === "update") {
      const { brandId, campaignId, campaign } = payload;
      if (!brandId) return ok({ error: "brandId is required" });
      if (!campaignId) return ok({ error: "campaignId is required" });
      if (!campaign?.title) return ok({ error: "Title is required" });
      if (!campaign?.campaign_start_date) return ok({ error: "Start date is required" });
      if (!campaign?.application_deadline) return ok({ error: "Application deadline is required" });
      if (!campaign?.campaign_end_date) return ok({ error: "Campaign end date is required" });

      // Ownership.
      const { data: existing, error: findErr } = await supabase
        .from("campaigns")
        .select("brand_id")
        .eq("campaign_id", campaignId)
        .single();
      if (findErr || !existing) return ok({ error: "Campaign not found" });
      if (existing.brand_id !== brandId) return ok({ error: "Not authorized" });

      // Application-count guard. head:true keeps the round-trip tiny —
      // we only need to know if the count is > 0. Any applicant, in any
      // state (including rejected/withdrawn), freezes the brief. The
      // client shows a "pause + duplicate" modal on this specific code.
      const { count: applied } = await supabase
        .from("campaign_applications")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId);
      if ((applied ?? 0) > 0) {
        return ok({ error: "has_applications", applied });
      }

      const contentTypes = buildContentTypes(campaign);
      const meta: Record<string, unknown> = {};
      if (campaign.banner_image_url) meta.banner_image = campaign.banner_image_url;
      if (Array.isArray(campaign.gallery_image_urls) && campaign.gallery_image_urls.length > 0) {
        meta.gallery_images = campaign.gallery_image_urls;
      }
      if (campaign.min_engagement_rate) meta.min_engagement_rate = Number(campaign.min_engagement_rate);
      Object.assign(meta, pickExtras(campaign));

      const fullDescription = packDescription(campaign.description || "", meta);

      const cities = Array.isArray(campaign.target_cities)
        ? campaign.target_cities.filter(Boolean)
        : typeof campaign.target_cities === "string" && campaign.target_cities
        ? campaign.target_cities.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const row: Record<string, unknown> = {
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
        // status is intentionally NOT touched here — pause / publish
        // still flow through updateStatus. Otherwise a brand editing a
        // paused campaign would silently unpause it.
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await supabase
        .from("campaigns")
        .update(row)
        .eq("campaign_id", campaignId);
      if (updErr) return ok({ error: updErr.message });
      return ok({ success: true, campaignId });
    }

    // ── DUPLICATE ─────────────────────────────────────────────────────
    // Clone an existing campaign as a fresh draft. Used when a campaign
    // already has applications and can't be edited in place — the brand
    // duplicates, tweaks, and publishes the copy. The clone drops all
    // application state, marks itself draft, and prefixes the title so
    // the two are distinguishable in the campaigns list.
    if (action === "duplicate") {
      const { brandId, campaignId } = payload;
      if (!brandId) return ok({ error: "brandId is required" });
      if (!campaignId) return ok({ error: "campaignId is required" });

      const { data: src, error: findErr } = await supabase
        .from("campaigns")
        .select("*")
        .eq("campaign_id", campaignId)
        .single();
      if (findErr || !src) return ok({ error: "Campaign not found" });
      if (src.brand_id !== brandId) return ok({ error: "Not authorized" });

      // Everything the create action would set. We copy over the source
      // row's fields verbatim — the duplicated campaign inherits the
      // full brief including the description metadata blob so the brand
      // isn't retyping the audit fields.
      const row = {
        brand_id: src.brand_id,
        brand_invitation_id: src.brand_invitation_id ?? null,
        created_by_admin: false,
        title: `Copy of ${src.title || "Campaign"}`,
        description: src.description || "",
        campaign_type: src.campaign_type || "barter",
        target_categories: src.target_categories || ["General"],
        max_influencers: src.max_influencers || 10,
        campaign_start_date: src.campaign_start_date,
        campaign_end_date: src.campaign_end_date,
        application_deadline: src.application_deadline,
        content_types_required: src.content_types_required || ["reels"],
        budget_total: src.budget_total || 0,
        budget_per_influencer: src.budget_per_influencer || 0,
        target_follower_min: src.target_follower_min || 0,
        target_follower_max: src.target_follower_max || 1000000,
        target_influencer_tier: src.target_influencer_tier || "all",
        target_cities: src.target_cities || ["All India"],
        // Always draft — the brand still has to Publish once they've
        // tweaked whatever prompted the duplicate.
        status: "draft",
      };

      const { data: created, error: insErr } = await supabase
        .from("campaigns")
        .insert(row)
        .select("campaign_id")
        .single();
      if (insErr) return ok({ error: insErr.message });
      return ok({ success: true, campaignId: created.campaign_id });
    }

    // ── DELETE ────────────────────────────────────────────────────────
    // Hard-delete the campaign row. Guarded the same way as update() —
    // a single application, in any state, is enough to reject the delete.
    // Client hides the Delete button when applications exist; the server
    // check is the belt-and-braces against a race.
    if (action === "delete") {
      const { brandId, campaignId } = payload;
      if (!brandId) return ok({ error: "brandId is required" });
      if (!campaignId) return ok({ error: "campaignId is required" });

      const { data: existing, error: findErr } = await supabase
        .from("campaigns")
        .select("brand_id")
        .eq("campaign_id", campaignId)
        .single();
      if (findErr || !existing) return ok({ error: "Campaign not found" });
      if (existing.brand_id !== brandId) return ok({ error: "Not authorized" });

      const { count: applied } = await supabase
        .from("campaign_applications")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId);
      if ((applied ?? 0) > 0) return ok({ error: "has_applications", applied });

      const { error: delErr } = await supabase
        .from("campaigns")
        .delete()
        .eq("campaign_id", campaignId);
      if (delErr) return ok({ error: delErr.message });
      return ok({ success: true });
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
