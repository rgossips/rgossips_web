import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getBlockedIds,
  resolveViewerId,
  filterBlocked,
} from "../_shared/blocks.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Trust score helpers (lightweight port of src/lib/brandProfile.js) ──
// Mirrors the 5-pillar 300–900 CIBIL-style score but uses only signals
// we can fetch in bulk (no per-application status-history walk). The
// full per-brand calculation lives on the brand's own dashboard via
// useBrandTrustScore; this version is just enough for a card preview.

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const NEUTRAL = 50;

const PILLAR_WEIGHTS = {
  reviews: 0.30,
  execution: 0.25,
  verification: 0.20,
  communication: 0.15,
  engagement: 0.10,
};

const BANDS: Array<{ min: number; label: string }> = [
  { min: 800, label: "Excellent" },
  { min: 740, label: "Very Good" },
  { min: 670, label: "Good" },
  { min: 580, label: "Fair" },
  { min: 300, label: "Poor" },
];
function bandFor(score: number): string {
  for (const b of BANDS) if (score >= b.min) return b.label;
  return "Poor";
}

const COLD_START_CAP = 720;
const COLD_START_THRESHOLD = 3;

function recencyWeight(createdAtIso: string | null, now: number): number {
  if (!createdAtIso) return 1;
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t) || t > now) return 1;
  const days = (now - t) / 86_400_000;
  return Math.pow(0.5, days / 180);
}

function reviewsPercent(ratings: any[]): { percent: number; hasData: boolean } {
  if (!ratings || ratings.length === 0) return { percent: NEUTRAL, hasData: false };
  const now = Date.now();
  const sum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  const wsum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  for (const r of ratings) {
    const w = recencyWeight(r.created_at, now);
    if (Number.isFinite(r.target_rating) && r.target_rating > 0) { sum.target += r.target_rating * w; wsum.target += w; }
    if (Number.isFinite(r.brief_clarity) && r.brief_clarity > 0) { sum.brief += r.brief_clarity * w; wsum.brief += w; }
    if (Number.isFinite(r.fairness) && r.fairness > 0) { sum.fair += r.fairness * w; wsum.fair += w; }
    if (Number.isFinite(r.feedback_quality) && r.feedback_quality > 0) { sum.feedback += r.feedback_quality * w; wsum.feedback += w; }
  }
  const ratingPct = (avg: number) => (avg > 0 ? Math.round((Math.min(5, avg) / 5) * 100) : 0);
  const target = wsum.target ? sum.target / wsum.target : 0;
  const brief = wsum.brief ? sum.brief / wsum.brief : target;
  const fair = wsum.fair ? sum.fair / wsum.fair : target;
  const feedback = wsum.feedback ? sum.feedback / wsum.feedback : target;
  const blended = ratingPct(target) * 0.25 + ratingPct(brief) * 0.25 + ratingPct(fair) * 0.25 + ratingPct(feedback) * 0.25;
  return { percent: Math.round(blended), hasData: true };
}

function executionPercent({ approvedCount, finalAcceptedCount, abandonedAfterApproval, reachedDraftCount }: {
  approvedCount: number; finalAcceptedCount: number; abandonedAfterApproval: number; reachedDraftCount: number;
}): number {
  const denom = finalAcceptedCount + abandonedAfterApproval;
  const completionRatio = denom > 0 ? finalAcceptedCount / denom : null;
  const draftRatio = approvedCount > 0 ? reachedDraftCount / approvedCount : null;
  // Skip revision health (needs history walk); use neutral 80.
  const revisionScore = 80;
  const completionPct = completionRatio == null ? NEUTRAL : Math.round(completionRatio * 100);
  const draftPct = draftRatio == null ? NEUTRAL : Math.round(draftRatio * 100);
  return Math.round(completionPct * 0.5 + draftPct * 0.3 + revisionScore * 0.2);
}

function embeddedPanFromGstin(gstinRaw: string | null | undefined): string | null {
  if (!gstinRaw) return null;
  const v = String(gstinRaw).toUpperCase().trim();
  if (!GSTIN_RE.test(v)) return null;
  const embedded = v.slice(2, 12);
  return PAN_RE.test(embedded) ? embedded : null;
}

function verificationPercent({ emailVerified, phoneVerified, pan, gstin }: {
  emailVerified: boolean; phoneVerified: boolean; pan: string; gstin: string;
}): number {
  const gstinValid = GSTIN_RE.test(String(gstin || "").toUpperCase().trim());
  const standalonePan = PAN_RE.test(String(pan || "").toUpperCase().trim());
  const panFromGstin = !!embeddedPanFromGstin(gstin);
  const panOk = standalonePan || panFromGstin;
  return (emailVerified ? 25 : 0) + (phoneVerified ? 25 : 0) + (panOk ? 25 : 0) + (gstinValid ? 25 : 0);
}

function engagementPercent({ lastLoginAt, campaignsLast90d, profileCompletionPct }: {
  lastLoginAt: string | null; campaignsLast90d: number; profileCompletionPct: number;
}): number {
  let loginScore = NEUTRAL;
  if (lastLoginAt) {
    const days = (Date.now() - new Date(lastLoginAt).getTime()) / 86_400_000;
    if (Number.isFinite(days) && days >= 0) {
      if (days <= 7) loginScore = 100;
      else if (days <= 30) loginScore = 85;
      else if (days <= 60) loginScore = 65;
      else if (days <= 90) loginScore = 45;
      else if (days <= 180) loginScore = 25;
      else loginScore = 10;
    }
  }
  const activityScore =
    campaignsLast90d >= 3 ? 100 :
    campaignsLast90d === 2 ? 80 :
    campaignsLast90d === 1 ? 60 : 30;
  return Math.round(loginScore * 0.4 + activityScore * 0.3 + profileCompletionPct * 0.3);
}

const PROFILE_FIELDS: Array<(p: any) => boolean> = [
  (p) => Array.isArray(p?.categories) && p.categories.length > 0,
  (p) => !!(p?.about || p?.description || p?.bio),
  (p) => !!p?.logo_url,
  (p) => !!p?.website,
  (p) => !!p?.contact_email,
  (p) => !!p?.contact_phone,
  (p) => !!(p?.instagram_username || p?.facebook_url || p?.linkedin_url || p?.twitter_url),
];
function profileCompletionPct(profile: any): number {
  if (!profile) return 0;
  const filled = PROFILE_FIELDS.filter((t) => t(profile)).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function computeTrust(input: {
  ratings: any[];
  execution: { approvedCount: number; finalAcceptedCount: number; abandonedAfterApproval: number; reachedDraftCount: number };
  verification: { emailVerified: boolean; phoneVerified: boolean; pan: string; gstin: string };
  engagement: { lastLoginAt: string | null; campaignsLast90d: number; profileCompletionPct: number };
}): { score: number; band: string } {
  const p1 = reviewsPercent(input.ratings).percent;
  const p2 = executionPercent(input.execution);
  const p3 = verificationPercent(input.verification);
  const p4 = NEUTRAL; // Communication needs status-history walk — skip for list view
  const p5 = engagementPercent(input.engagement);

  const overall100 =
    p1 * PILLAR_WEIGHTS.reviews +
    p2 * PILLAR_WEIGHTS.execution +
    p3 * PILLAR_WEIGHTS.verification +
    p4 * PILLAR_WEIGHTS.communication +
    p5 * PILLAR_WEIGHTS.engagement;

  let score = Math.round(300 + (overall100 / 100) * 600);
  score = Math.max(300, Math.min(900, score));
  const coldStart = input.execution.finalAcceptedCount < COLD_START_THRESHOLD;
  if (coldStart && score > COLD_START_CAP) score = COLD_START_CAP;

  return { score, band: bandFor(score) };
}

// ───────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
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
      .select("brand_id,brand_name,categories,contact_name,followers_count,gstin_trade_name,instagram_username,is_verified,logo_url,status")
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
        trustBand: "Poor",
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
        isRegistered: false,
        activeCampaigns: 0,
        rating: 0,
        followers: Number(inv.followers_count || 0),
        // Invitations have no behavioural data — show a cold-start neutral
        // (verification-only contribution) so the badge isn't empty.
        trustScore: isVerified ? 600 : 540,
        trustBand: isVerified ? "Fair" : "Poor",
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

    // Application funnel (P2) — bulk fetch all applications, group by brand.
    const executionByBrand: Record<string, { approvedCount: number; finalAcceptedCount: number; abandonedAfterApproval: number; reachedDraftCount: number }> = {};
    const DRAFT_REACHED = new Set(["submitted", "revision_needed", "accepted", "live_submitted", "payment", "completed"]);
    if (campaigns && campaigns.length > 0) {
      const campaignIds = (campaigns as any[]).map((c) => c.campaign_id).filter(Boolean);
      if (campaignIds.length > 0) {
        const { data: apps } = await supabaseAdmin
          .from("campaign_applications")
          .select("campaign_id, status")
          .in("campaign_id", campaignIds);

        const campaignById: Record<string, any> = {};
        for (const c of campaigns as any[]) campaignById[c.campaign_id] = c;

        for (const a of apps || []) {
          const camp = campaignById[a.campaign_id];
          const brandKey = camp?.brand_id;
          if (!brandKey) continue;
          if (!executionByBrand[brandKey]) {
            executionByBrand[brandKey] = { approvedCount: 0, finalAcceptedCount: 0, abandonedAfterApproval: 0, reachedDraftCount: 0 };
          }
          const e = executionByBrand[brandKey];
          const passedApproved = a.status !== "pending" && a.status !== "rejected" && a.status !== "withdrawn";
          if (passedApproved) e.approvedCount += 1;
          if (a.status === "completed") e.finalAcceptedCount += 1;
          if (passedApproved && a.status !== "completed") {
            const ended = camp.status === "closed" || camp.status === "completed" || camp.status === "archived";
            if (ended) e.abandonedAfterApproval += 1;
          }
          if (DRAFT_REACHED.has(a.status)) e.reachedDraftCount += 1;
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
      const { score, band } = computeTrust({
        ratings: ratingsByBrand[brand.id] || [],
        execution: executionByBrand[brand.id] || { approvedCount: 0, finalAcceptedCount: 0, abandonedAfterApproval: 0, reachedDraftCount: 0 },
        verification: {
          emailVerified: auth.emailVerified,
          phoneVerified: auth.phoneVerified,
          pan: profile.pan || "",
          gstin: profile.gstin || "",
        },
        engagement: {
          lastLoginAt: auth.lastLoginAt,
          campaignsLast90d: campaignsLast90dByBrand[brand.id] || 0,
          profileCompletionPct: profileCompletionPct(profile),
        },
      });
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
