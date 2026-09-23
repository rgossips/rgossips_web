import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import {
  getBlockedIds,
  resolveViewerId,
  filterBlocked,
} from "../_shared/blocks.ts";
import {
  computeBrandTrustScore,
  executionFromApplications,
  historyMetrics,
} from "../_shared/brand-trust.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ───────────────────────────────────────────────────────────────────────

serveWithLogging("list-brands", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // Pagination bounds. Default = 500 (matches historical behaviour
    // for the discover page) but the HARD CAP is also 500 — a single
    // client can never pull more than that in one request, which
    // bounds both network payload and the per-brand trust-score work
    // the function does. Callers can pass smaller limits for perf.
    const MAX_LIMIT = 500;
    let limit = MAX_LIMIT;
    let offset = 0;
    try {
      const body = await req.json();
      if (Number.isFinite(body?.limit)) limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(body.limit)));
      if (Number.isFinite(body?.offset)) offset = Math.max(0, Math.floor(body.offset));
    } catch {
      // No body / not JSON → defaults.
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch registered brand profiles.
    //
    // F-03: this used to be select("*"), which dragged brand_profiles'
    // instagram_access_token into function memory for EVERY brand on an
    // influencer-facing listing. A directory endpoint has no use for it. The
    // columns below are exactly the ones this function reads downstream —
    // verified against the live schema, because selecting a column that does
    // not exist 42703s the whole query (the trap that `select("*")` was
    // originally here to dodge, and the one CLAUDE.md records `languages` and
    // `city` falling into). qa/checks/explicit-columns.mjs re-verifies this list
    // against the deployed schema so it fails loudly on drift instead of at
    // runtime — assertion A-35.
    //
    //
    // Deactivated / pending-deletion brands must not appear on any influencer
    // surface; filter them in SQL so every consumer of this list is covered.
    // The column list must be ONE unbroken string literal. supabase-js parses
    // the select spec at the type level, and neither a runtime-joined array nor
    // a "a," + "b" concatenation is literal enough for it — either widens every
    // row to `GenericStringError` and turns each downstream `p.brand_name` into
    // a type error (15 of them). Hence the long line; do not "tidy" it.
    // eslint-disable-next-line max-len
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("brand_profiles")
      .select("account_type,brand_id,brand_name,categories,contact_email,contact_name,contact_phone,followers_count,full_description,gstin,gstin_trade_name,instagram_url,instagram_username,is_verified,logo_url,short_description,status,website_url")
      // NOT IN would also drop NULL-status legacy rows — keep those.
      .or("status.is.null,status.not.in.(deactivated,pending_deletion)");

    if (profError) console.error("Brand profiles error:", profError.message);

    // Fetch brand invitations (pending + claimed)
    const { data: invitations, error: invError } = await supabaseAdmin
      .from("brand_invitations")
      .select("*");

    if (invError) console.error("Brand invitations error:", invError.message);

    const brands: any[] = [];
    const brandProfileById: Record<string, any> = {};

    // Add registered brand profiles
    for (const p of profiles || []) {
      brandProfileById[p.brand_id] = p;
      brands.push({
        id: p.brand_id,
        name:
          p.gstin_trade_name ||
          p.brand_name ||
          p.contact_name ||
          (p.instagram_username ? `@${p.instagram_username}` : "Unnamed Brand"),
        category: (p.categories && p.categories.length > 0) ? p.categories[0] : "General",
        categories: p.categories || [],
        logo: p.logo_url || "",
        instagram: p.instagram_username || "",
        isVerified: p.is_verified || false,
        // "brand" | "agency" — admin-set label (migration 075).
        accountType: p.account_type === "agency" ? "agency" : "brand",
        isRegistered: true,
        activeCampaigns: 0,
        rating: 0,
        // `instagram_followers_count` used to sit in this fallback chain. It is
        // not a column on brand_profiles — the column is `followers_count`,
        // which is tried first and works — so the second term was unreachable
        // dead code that read as a real fallback. select("*") hid that; the
        // explicit column list surfaced it.
        followers: Number(p.followers_count || 0),
        trustScore: 0,
        trustBand: "Building Trust",
        minBudget: 0,
        maxBudget: 0,
        payout: "On request",
      });
    }

    // Build a set of brand_ids we actually loaded from brand_profiles
    const registeredBrandIds = new Set(brands.map((b) => b.id));
    const registeredInstagrams = new Set(
      brands
        .map((b) => (b.instagram || "").toLowerCase())
        .filter((h) => h.length > 0)
    );

    // Add brand invitations that are NOT represented by a registered profile
    for (const inv of invitations || []) {
      if (inv.brand_profile_id && registeredBrandIds.has(inv.brand_profile_id)) continue;
      const igLower = (inv.instagram_username || "").toLowerCase();
      if (igLower && registeredInstagrams.has(igLower)) continue;

      let category = "General";
      let isVerified = false;
      try {
        const notes = typeof inv.notes === "string" ? JSON.parse(inv.notes) : inv.notes;
        if (notes?.category) category = notes.category;
        if (notes?.instagram_verified) isVerified = true;
      } catch {}

      brands.push({
        id: inv.id,
        name: inv.brand_name || (inv.instagram_username ? `@${inv.instagram_username}` : "Unnamed Brand"),
        category,
        categories: [category],
        logo: inv.logo_url || "",
        instagram: inv.instagram_username || "",
        isVerified,
        accountType: inv.account_type === "agency" ? "agency" : "brand",
        isRegistered: false,
        activeCampaigns: 0,
        rating: 0,
        followers: Number(inv.followers_count || 0),
        // Invitations have no behavioural data — show a cold-start neutral
        // (verification-only contribution) so the badge isn't empty.
        trustScore: isVerified ? 600 : 540,
        trustBand: isVerified ? "Emerging" : "Building Trust",
        minBudget: 0,
        maxBudget: 0,
        payout: "On request",
      });
    }

    // Count active campaigns per brand (via brand_id or brand_invitation_id)
    // and collect IDs for downstream queries.
    const { data: campaigns } = await supabaseAdmin
      .from("campaigns")
      .select("campaign_id, brand_id, brand_invitation_id, status, created_at, application_deadline, campaign_end_date");

    const campaignCounts: Record<string, number> = {};
    const campaignsLast90dByBrand: Record<string, number> = {};
    const campaignIdToBrandId: Record<string, string> = {};
    const since90 = Date.now() - 90 * 86_400_000;
    const now = Date.now();
    // Mirrors list-campaigns' Active-tab visibility: a campaign only counts
    // as "active" on the brand card if the creator could still actually
    // apply. Counting deadline-passed campaigns produced "1 active campaign"
    // cards that opened onto an empty list.
    const openForApplications = (c: any) => {
      if (c.application_deadline && new Date(c.application_deadline).getTime() < now) return false;
      const endSource = c.campaign_end_date || c.application_deadline;
      if (endSource && new Date(endSource).getTime() < now) return false;
      return true;
    };

    if (campaigns) {
      for (const c of campaigns as any[]) {
        const brandKey = c.brand_id || c.brand_invitation_id;
        if (brandKey && c.campaign_id) campaignIdToBrandId[c.campaign_id] = brandKey;

        if ((c.status === "active" || c.status === "open") && openForApplications(c)) {
          if (c.brand_invitation_id) campaignCounts[c.brand_invitation_id] = (campaignCounts[c.brand_invitation_id] || 0) + 1;
          if (c.brand_id) campaignCounts[c.brand_id] = (campaignCounts[c.brand_id] || 0) + 1;
        }

        if (c.created_at && new Date(c.created_at).getTime() >= since90 && c.brand_id) {
          campaignsLast90dByBrand[c.brand_id] = (campaignsLast90dByBrand[c.brand_id] || 0) + 1;
        }
      }
      for (const brand of brands) {
        brand.activeCampaigns = campaignCounts[brand.id] || 0;
      }
    }

    // ─── Trust score inputs ──────────────────────────────────────────
    const registeredIds = Object.keys(brandProfileById);

    // Ratings (P1) — bulk fetch all influencer→brand ratings.
    const ratingsByBrand: Record<string, any[]> = {};
    if (registeredIds.length > 0) {
      const { data: ratingRows } = await supabaseAdmin
        .from("campaign_ratings")
        .select("brand_id, target_rating, brief_clarity, fairness, feedback_quality, created_at")
        .in("brand_id", registeredIds)
        .eq("rater_role", "influencer");
      for (const r of ratingRows || []) {
        const bid = r.brand_id;
        if (!ratingsByBrand[bid]) ratingsByBrand[bid] = [];
        ratingsByBrand[bid].push(r);
      }
    }

    // Application funnel (P2) + communication (P4).
    //
    // The old version of this function skipped P4 entirely — it scored every
    // brand a neutral 50 there because "communication needs a status-history
    // walk". That is exactly why a card and a dashboard disagreed. The walk
    // is batched here instead: one applications query and one history query
    // for the whole page, grouped per brand, using the same helpers the
    // brand's own dashboard calls.
    const executionByBrand: Record<string, any> = {};
    const communicationByBrand: Record<string, any> = {};
    if (campaigns && campaigns.length > 0) {
      const campaignIds = (campaigns as any[]).map((c) => c.campaign_id).filter(Boolean);
      if (campaignIds.length > 0) {
        const { data: apps } = await supabaseAdmin
          .from("campaign_applications")
          .select("id, campaign_id, status")
          .in("campaign_id", campaignIds);

        const campaignById: Record<string, any> = {};
        for (const c of campaigns as any[]) campaignById[c.campaign_id] = c;

        // Group applications and campaigns by brand.
        const appsByBrand: Record<string, any[]> = {};
        const campaignsByBrand: Record<string, any[]> = {};
        const brandByApplicationId: Record<string, string> = {};
        for (const c of campaigns as any[]) {
          if (!c.brand_id) continue;
          (campaignsByBrand[c.brand_id] ||= []).push(c);
        }
        for (const a of apps || []) {
          const brandKey = campaignById[a.campaign_id]?.brand_id;
          if (!brandKey) continue;
          (appsByBrand[brandKey] ||= []).push(a);
          brandByApplicationId[a.id] = brandKey;
        }

        // One history query for every application on the page.
        const appIds = Object.keys(brandByApplicationId);
        const historyByBrand: Record<string, any[]> = {};
        if (appIds.length > 0) {
          const CHUNK = 500;
          for (let i = 0; i < appIds.length; i += CHUNK) {
            const { data: hist } = await supabaseAdmin
              .from("application_status_history")
              .select("application_id, from_status, to_status, changed_by_role, reason, created_at")
              .in("application_id", appIds.slice(i, i + CHUNK));
            for (const h of hist || []) {
              const brandKey = brandByApplicationId[h.application_id];
              if (!brandKey) continue;
              (historyByBrand[brandKey] ||= []).push(h);
            }
          }
        }

        for (const brandKey of Object.keys(appsByBrand)) {
          const execution = executionFromApplications(
            appsByBrand[brandKey] || [],
            campaignsByBrand[brandKey] || [],
          );
          const { totalRevisions, communication } = historyMetrics(historyByBrand[brandKey] || []);
          executionByBrand[brandKey] = { ...execution, totalRevisions };
          communicationByBrand[brandKey] = communication;
        }
      }
    }

    // Verification + last_sign_in (P3 + P5) — auth.admin.listUsers in bulk.
    const verificationByUserId: Record<string, { emailVerified: boolean; phoneVerified: boolean; lastLoginAt: string | null }> = {};
    try {
      // perPage cap is 1000; for our brand volume this is one page.
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000, page: 1 });
      for (const u of usersList?.users || []) {
        verificationByUserId[u.id] = {
          emailVerified: !!(u as any).email_confirmed_at,
          phoneVerified: !!(u as any).phone_confirmed_at,
          lastLoginAt: (u as any).last_sign_in_at || null,
        };
      }
    } catch (e) {
      console.warn("auth.admin.listUsers failed:", (e as any)?.message || e);
    }

    // Apply trust score to each registered brand
    for (const brand of brands) {
      if (!brand.isRegistered) continue;
      const profile = brandProfileById[brand.id] || {};
      const auth = verificationByUserId[brand.id] || { emailVerified: false, phoneVerified: false, lastLoginAt: null };
      const trust = computeBrandTrustScore({
        profile,
        reviews: ratingsByBrand[brand.id] || [],
        execution: executionByBrand[brand.id] || {},
        verification: {
          emailVerified: auth.emailVerified,
          phoneVerified: auth.phoneVerified,
          pan: profile.pan || "",
          gstin: profile.gstin || "",
        },
        communication: communicationByBrand[brand.id] || {},
        engagement: {
          lastLoginAt: auth.lastLoginAt,
          campaignsLast90d: campaignsLast90dByBrand[brand.id] || 0,
        },
      });
      const { score, band } = trust;
      brand.trustScore = score;
      brand.trustBand = band;
    }

    // Hide brands this creator has blocked (or who blocked them). Filtered
    // before the count so `total` matches what the user can actually page
    // through. Required by Play's UGC policy / Apple 1.2 — a block has to
    // remove content from view, not merely record a preference.
    const viewerId = await resolveViewerId(supabaseAdmin, req, null);
    const blockedIds = await getBlockedIds(supabaseAdmin, viewerId);
    const visibleBrands = filterBlocked(brands, blockedIds, "brand_id");

    const total = visibleBrands.length;
    const page = visibleBrands.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        brands: page,
        total,
        limit,
        offset,
        _debug: {
          profilesCount: profiles?.length || 0,
          invitationsCount: invitations?.length || 0,
          profileError: profError?.message || null,
          inviteError: invError?.message || null,
        },
      }),
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
