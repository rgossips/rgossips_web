// Brand Trust Score — the ONE implementation.
//
// There used to be four: the web dashboard's (5 pillars, 300–900), the
// mobile app's (3 pillars, 0–1000, LOW/GOOD/HIGH), list-brands' "lightweight
// port" (5 pillars but communication pinned at neutral), and a stray copy of
// the retired band labels in the mobile brand card. A brand could see three
// different numbers for itself, and creators saw a fourth — still using the
// punitive "Poor"/"Fair" wording that was renamed in 2026-07.
//
// Both clients now render what this module computes, and the number on a
// creator-facing brand card is the same number the brand sees on its own
// dashboard. Ported from src/lib/brandProfile.js, which stays only for the
// pure-UI helpers (profile completion, GST/PAN classification).
//
//   P1 Influencer Reviews      30%   ratings with recency decay
//   P2 Campaign Execution      25%   approve→complete funnel + revision norms
//   P3 Verification & Identity 20%   email / mobile / PAN / GSTIN flags
//   P4 Communication           15%   response-time SLAs + feedback richness
//   P5 Platform Engagement     10%   activity recency + profile completeness
//
// Bands: 800+ Elite · 740+ Trusted · 670+ Established · 580+ Emerging ·
//        below that Building Trust. Cold-start caps at 720 until the brand
//        has 3 completed campaigns.

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** No data for a pillar scores neutral, not zero — the cold-start cap is
 *  what keeps unproven brands honest. */
export const NEUTRAL = 50;
export const SCALE_MIN = 300;
export const SCALE_MAX = 900;
export const COLD_START_CAP = 720;
export const COLD_START_THRESHOLD = 3;
export const PENALTY_CAP = 400;

export const PILLAR_WEIGHTS = {
  reviews: 0.30,
  execution: 0.25,
  verification: 0.20,
  communication: 0.15,
  engagement: 0.10,
} as const;

const BANDS: Array<{ min: number; label: string }> = [
  { min: 800, label: "Elite" },
  { min: 740, label: "Trusted" },
  { min: 670, label: "Established" },
  { min: 580, label: "Emerging" },
  { min: 0, label: "Building Trust" },
];

export function bandFor(score: number): string {
  for (const b of BANDS) if (score >= b.min) return b.label;
  return "Building Trust";
}

const ratingToPct = (avg: number) => (avg > 0 ? Math.round((Math.min(5, avg) / 5) * 100) : 0);

/** Half-life of 180 days: a year-old review carries about a quarter weight. */
function recencyWeight(createdAtIso: string | null | undefined, now = Date.now()): number {
  if (!createdAtIso) return 1;
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t) || t > now) return 1;
  return Math.pow(0.5, ((now - t) / 86_400_000) / 180);
}

function embeddedPanFromGstin(gstinRaw: string | null | undefined): string | null {
  if (!gstinRaw) return null;
  const v = String(gstinRaw).toUpperCase().trim();
  if (!GSTIN_RE.test(v)) return null;
  const embedded = v.slice(2, 12);
  return PAN_RE.test(embedded) ? embedded : null;
}

const PROFILE_FIELDS: Array<{ key: string; label: string; test: (p: any) => boolean }> = [
  { key: "categories", label: "Categories", test: (p) => Array.isArray(p?.categories) && p.categories.length > 0 },
  { key: "about", label: "About the brand", test: (p) => !!(p?.full_description || p?.short_description) },
  { key: "logo", label: "Logo", test: (p) => !!p?.logo_url },
  { key: "website", label: "Website", test: (p) => !!p?.website_url },
  { key: "contactEmail", label: "Contact email", test: (p) => !!p?.contact_email },
  { key: "contactPhone", label: "Contact phone", test: (p) => !!p?.contact_phone },
  // brand_profiles has instagram_username / instagram_url and nothing
  // else — the facebook/linkedin/twitter columns this test used to check
  // do not exist, so the field could only ever be credited via Instagram
  // and silently cost every other brand a completion point.
  { key: "socials", label: "Social links", test: (p) => !!(p?.instagram_username || p?.instagram_url) },
];

export function getProfileCompletion(profile: any) {
  if (!profile) return { percent: 0, missing: PROFILE_FIELDS.map((f) => f.label), filled: [] as string[] };
  const filled: string[] = [];
  const missing: string[] = [];
  for (const f of PROFILE_FIELDS) (f.test(profile) ? filled : missing).push(f.label);
  return {
    percent: Math.round((filled.length / PROFILE_FIELDS.length) * 100),
    missing,
    filled,
  };
}

// ─── P1: influencer reviews ────────────────────────────────────────────
// feedback_quality is not collected yet, so it falls back to the overall
// rating — a brand is not penalised for a question we never asked.
export function getInfluencerReviewsScore(reviews: any[] = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { percent: NEUTRAL, count: 0, axes: null, hasData: false };
  }
  const now = Date.now();
  const sum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  const wsum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  for (const r of reviews) {
    const w = recencyWeight(r?.created_at, now);
    const add = (key: keyof typeof sum, value: any) => {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        sum[key] += n * w;
        wsum[key] += w;
      }
    };
    add("target", r?.target_rating);
    add("brief", r?.brief_clarity);
    add("fair", r?.fairness);
    add("feedback", r?.feedback_quality);
  }
  const target = wsum.target ? sum.target / wsum.target : 0;
  const brief = wsum.brief ? sum.brief / wsum.brief : target;
  const fair = wsum.fair ? sum.fair / wsum.fair : target;
  const feedback = wsum.feedback ? sum.feedback / wsum.feedback : target;

  const blended =
    ratingToPct(target) * 0.25 +
    ratingToPct(brief) * 0.25 +
    ratingToPct(fair) * 0.25 +
    ratingToPct(feedback) * 0.25;

  return {
    percent: Math.round(blended),
    count: reviews.length,
    axes: { target, brief, fair, feedback },
    hasData: true,
  };
}

// ─── P2: campaign execution ────────────────────────────────────────────
export interface ExecutionInput {
  approvedCount?: number;
  finalAcceptedCount?: number;
  abandonedAfterApproval?: number;
  reachedDraftCount?: number;
  totalRevisions?: number;
}

export function getCampaignExecutionScore(e: ExecutionInput = {}) {
  const approvedCount = e.approvedCount || 0;
  const finalAcceptedCount = e.finalAcceptedCount || 0;
  const abandonedAfterApproval = e.abandonedAfterApproval || 0;
  const reachedDraftCount = e.reachedDraftCount || 0;
  const totalRevisions = e.totalRevisions || 0;

  const denom = finalAcceptedCount + abandonedAfterApproval;
  const completionRatio = denom > 0 ? finalAcceptedCount / denom : null;
  const draftRatio = approvedCount > 0 ? reachedDraftCount / approvedCount : null;

  const avgRevisions = finalAcceptedCount > 0 ? totalRevisions / finalAcceptedCount : 0;
  let revisionScore = 100;
  if (avgRevisions < 0.5) revisionScore = 70;
  else if (avgRevisions <= 2.5) revisionScore = 100;
  else if (avgRevisions <= 4) revisionScore = 60;
  else revisionScore = 30;

  const completionPct = completionRatio == null ? NEUTRAL : Math.round(completionRatio * 100);
  const draftPct = draftRatio == null ? NEUTRAL : Math.round(draftRatio * 100);

  return {
    percent: Math.round(completionPct * 0.5 + draftPct * 0.3 + revisionScore * 0.2),
    completionRatio,
    draftRatio,
    avgRevisions,
    finalAcceptedCount,
    approvedCount,
    abandonedAfterApproval,
    hasData: finalAcceptedCount > 0 || approvedCount > 0,
  };
}

// ─── P3: verification ──────────────────────────────────────────────────
export function getVerificationScore({
  emailVerified = false,
  phoneVerified = false,
  pan = "",
  gstin = "",
}: { emailVerified?: boolean; phoneVerified?: boolean; pan?: string; gstin?: string } = {}) {
  // There is no `pan` column on brand_profiles; callers pass "" and the
  // credit comes from the PAN embedded in a valid GSTIN. The parameter
  // stays so a standalone PAN field can be added without touching this.
  const gstinValid = GSTIN_RE.test(String(gstin || "").toUpperCase().trim());
  const panStr = String(pan || "").toUpperCase().trim();
  const panOk = PAN_RE.test(panStr) || !!embeddedPanFromGstin(gstin);

  const items = {
    emailVerified: !!emailVerified,
    phoneVerified: !!phoneVerified,
    panProvided: panOk,
    gstinVerified: gstinValid,
  };
  const percent =
    (items.emailVerified ? 25 : 0) +
    (items.phoneVerified ? 25 : 0) +
    (items.panProvided ? 25 : 0) +
    (items.gstinVerified ? 25 : 0);

  return { percent, items, hasData: true };
}

// ─── P4: communication ─────────────────────────────────────────────────
export interface CommunicationInput {
  avgApplicationDecisionHrs?: number | null;
  avgNegotiationHrs?: number | null;
  avgDraftFeedbackHrs?: number | null;
  avgFinalAcceptanceHrs?: number | null;
  /** 0–1: brand decisions that carried a written reason. */
  feedbackRichnessRatio?: number | null;
}

export function getCommunicationScore(c: CommunicationInput = {}) {
  const sla = (avgHrs: number | null | undefined, target: number) => {
    if (avgHrs == null) return null;
    if (avgHrs <= target) return 100;
    if (avgHrs <= target * 2) return 70;
    if (avgHrs <= target * 4) return 40;
    return 10;
  };

  const slaScores = [
    sla(c.avgApplicationDecisionHrs, 48),
    sla(c.avgNegotiationHrs, 24),
    sla(c.avgDraftFeedbackHrs, 48),
    sla(c.avgFinalAcceptanceHrs, 48),
  ].filter((x): x is number => x != null);

  const responseAvg = slaScores.length > 0
    ? slaScores.reduce((s, v) => s + v, 0) / slaScores.length
    : NEUTRAL;

  const richness = c.feedbackRichnessRatio == null
    ? NEUTRAL
    : Math.round(c.feedbackRichnessRatio * 100);

  return {
    percent: Math.round(responseAvg * 0.7 + richness * 0.3),
    responseAvg: Math.round(responseAvg),
    richnessPct: Math.round(richness),
    hasData: slaScores.length > 0 || c.feedbackRichnessRatio != null,
  };
}

// ─── P5: platform engagement ───────────────────────────────────────────
export function getEngagementScore({
  lastLoginAt = null,
  campaignsLast90d = 0,
  profile = null,
}: { lastLoginAt?: string | null; campaignsLast90d?: number; profile?: any } = {}) {
  const loginScore = (() => {
    if (!lastLoginAt) return NEUTRAL;
    const days = (Date.now() - new Date(lastLoginAt).getTime()) / 86_400_000;
    if (!Number.isFinite(days) || days < 0) return NEUTRAL;
    if (days <= 7) return 100;
    if (days <= 30) return 85;
    if (days <= 60) return 65;
    if (days <= 90) return 45;
    if (days <= 180) return 25;
    return 10;
  })();

  const activityScore =
    campaignsLast90d >= 3 ? 100 :
    campaignsLast90d === 2 ? 80 :
    campaignsLast90d === 1 ? 60 : 30;

  const completionPct = getProfileCompletion(profile).percent;

  return {
    percent: Math.round(loginScore * 0.4 + activityScore * 0.3 + completionPct * 0.3),
    loginScore,
    activityScore,
    profileCompletionPct: completionPct,
    campaignsLast90d,
    hasData: true,
  };
}

// ─── orchestration ─────────────────────────────────────────────────────
export interface TrustInput {
  profile?: any;
  reviews?: any[];
  execution?: ExecutionInput;
  verification?: { emailVerified?: boolean; phoneVerified?: boolean; pan?: string; gstin?: string };
  communication?: CommunicationInput;
  engagement?: { lastLoginAt?: string | null; campaignsLast90d?: number };
  penaltyPoints?: number;
}

export function computeBrandTrustScore(input: TrustInput = {}) {
  const profile = input.profile || null;
  const p1 = getInfluencerReviewsScore(input.reviews || []);
  const p2 = getCampaignExecutionScore(input.execution || {});
  const p3 = getVerificationScore({
    emailVerified: input.verification?.emailVerified,
    phoneVerified: input.verification?.phoneVerified,
    pan: input.verification?.pan,
    gstin: input.verification?.gstin || profile?.gstin || "",
  });
  const p4 = getCommunicationScore(input.communication || {});
  const p5 = getEngagementScore({ ...(input.engagement || {}), profile });

  const overall100 =
    p1.percent * PILLAR_WEIGHTS.reviews +
    p2.percent * PILLAR_WEIGHTS.execution +
    p3.percent * PILLAR_WEIGHTS.verification +
    p4.percent * PILLAR_WEIGHTS.communication +
    p5.percent * PILLAR_WEIGHTS.engagement;

  let score = SCALE_MIN + (overall100 / 100) * (SCALE_MAX - SCALE_MIN);
  const cappedPenalty = Math.max(0, Math.min(PENALTY_CAP, Number(input.penaltyPoints) || 0));
  score -= cappedPenalty;
  score = Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.round(score)));

  // Cold start applies AFTER the clamp, so a brand cannot ride a high
  // verification score past the cap before it has delivered anything.
  const coldStart = (input.execution?.finalAcceptedCount || 0) < COLD_START_THRESHOLD;
  if (coldStart && score > COLD_START_CAP) score = COLD_START_CAP;

  return {
    score,
    band: bandFor(score),
    overallPercent: Math.round(overall100),
    coldStart,
    coldStartCap: COLD_START_CAP,
    coldStartThreshold: COLD_START_THRESHOLD,
    penaltyApplied: cappedPenalty,
    breakdown: {
      influencerReviews: { ...p1, weight: PILLAR_WEIGHTS.reviews, label: "Influencer Reviews" },
      campaignExecution: { ...p2, weight: PILLAR_WEIGHTS.execution, label: "Campaign Execution" },
      verification: { ...p3, weight: PILLAR_WEIGHTS.verification, label: "Verification & Identity" },
      communication: { ...p4, weight: PILLAR_WEIGHTS.communication, label: "Communication Quality" },
      engagement: { ...p5, weight: PILLAR_WEIGHTS.engagement, label: "Platform Engagement" },
    },
    scaleMin: SCALE_MIN,
    scaleMax: SCALE_MAX,
  };
}

// ─── shared data shaping ───────────────────────────────────────────────
// Both callers (list-brands in bulk, brand-campaigns for one brand) need
// the same derivations from campaign_applications and
// application_status_history, so they live here rather than being written
// twice and drifting apart again.

export const SLA_RULES = [
  { key: "application_decision", fromStatuses: new Set(["pending"]), toStatuses: new Set(["approved", "rejected"]) },
  { key: "draft_feedback", fromStatuses: new Set(["submitted"]), toStatuses: new Set(["accepted", "revision_needed", "rejected"]) },
  { key: "final_acceptance", fromStatuses: new Set(["live_submitted"]), toStatuses: new Set(["payment", "rejected", "completed"]) },
];

const BRAND_DECISION_TARGETS = new Set([
  "approved",
  "accepted",
  "revision_needed",
  "rejected",
  "payment",
]);

const DRAFT_REACHED = new Set([
  "submitted",
  "revision_needed",
  "accepted",
  "live_submitted",
  "payment",
  "completed",
]);

export interface HistoryRow {
  application_id: string;
  from_status?: string | null;
  to_status?: string | null;
  changed_by_role?: string | null;
  reason?: string | null;
  created_at?: string | null;
}

export interface ApplicationRow {
  id: string;
  campaign_id: string;
  status?: string | null;
}

export interface CampaignRow {
  campaign_id: string;
  status?: string | null;
  campaign_end_date?: string | null;
}

/**
 * Funnel counts for P2 from one brand's applications.
 *
 * "Abandoned after approval" needs the campaign, not just the application:
 * an approved application on a campaign that is still running has not been
 * abandoned, it is in flight. A campaign counts as over when its status says
 * so OR its end date has passed.
 */
export function executionFromApplications(
  apps: ApplicationRow[],
  campaigns: CampaignRow[],
): ExecutionInput {
  const campaignById = new Map<string, CampaignRow>();
  for (const c of campaigns || []) campaignById.set(c.campaign_id, c);

  let approvedCount = 0;
  let finalAcceptedCount = 0;
  let abandonedAfterApproval = 0;
  let reachedDraftCount = 0;

  for (const a of apps || []) {
    const status = String(a?.status || "");
    const passedApproved = status !== "pending" && status !== "rejected" && status !== "withdrawn" &&
      status !== "offer_sent" && status !== "offer_accepted";
    if (passedApproved) approvedCount++;
    if (status === "completed") finalAcceptedCount++;
    if (passedApproved && status !== "completed") {
      const camp = campaignById.get(a.campaign_id);
      const endedByDate = camp?.campaign_end_date
        ? new Date(camp.campaign_end_date).getTime() < Date.now()
        : false;
      const ended = !!camp && (
        camp.status === "closed" ||
        camp.status === "completed" ||
        camp.status === "archived" ||
        endedByDate
      );
      if (ended) abandonedAfterApproval++;
    }
    if (DRAFT_REACHED.has(status)) reachedDraftCount++;
  }

  return { approvedCount, finalAcceptedCount, abandonedAfterApproval, reachedDraftCount };
}

/**
 * Revision count (P2) and SLA latencies + feedback richness (P4) from one
 * brand's application_status_history rows. Rows may arrive in any order;
 * they are grouped per application and sorted before the walk, because a
 * latency is the gap to the PREVIOUS transition on that application.
 */
export function historyMetrics(rows: HistoryRow[]): {
  totalRevisions: number;
  communication: CommunicationInput;
} {
  const byApp = new Map<string, HistoryRow[]>();
  for (const h of rows || []) {
    const list = byApp.get(h.application_id) || [];
    list.push(h);
    byApp.set(h.application_id, list);
  }

  const slaSums: Record<string, number> = {};
  const slaCounts: Record<string, number> = {};
  let totalRevisions = 0;
  let brandDecisionsTotal = 0;
  let brandDecisionsWithReason = 0;

  for (const hist of byApp.values()) {
    hist.sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    );
    for (let i = 0; i < hist.length; i++) {
      const cur = hist[i];
      if (cur.to_status === "revision_needed") totalRevisions++;

      if (cur.from_status && i > 0) {
        const prev = hist[i - 1];
        const hrs =
          (new Date(cur.created_at || 0).getTime() -
            new Date(prev.created_at || 0).getTime()) / 3_600_000;
        if (Number.isFinite(hrs) && hrs >= 0) {
          for (const rule of SLA_RULES) {
            if (
              rule.fromStatuses.has(String(cur.from_status)) &&
              rule.toStatuses.has(String(cur.to_status))
            ) {
              slaSums[rule.key] = (slaSums[rule.key] || 0) + hrs;
              slaCounts[rule.key] = (slaCounts[rule.key] || 0) + 1;
              break;
            }
          }
        }
      }

      if (cur.changed_by_role === "brand" && BRAND_DECISION_TARGETS.has(String(cur.to_status))) {
        brandDecisionsTotal++;
        if (String(cur.reason || "").trim().length > 0) brandDecisionsWithReason++;
      }
    }
  }

  const avgOrNull = (key: string) =>
    slaCounts[key] > 0 ? slaSums[key] / slaCounts[key] : null;

  return {
    totalRevisions,
    communication: {
      avgApplicationDecisionHrs: avgOrNull("application_decision"),
      avgDraftFeedbackHrs: avgOrNull("draft_feedback"),
      avgFinalAcceptanceHrs: avgOrNull("final_acceptance"),
      // Rates are agreed at the Approve step, not through a back-and-forth,
      // so there is no negotiation latency to measure.
      avgNegotiationHrs: null,
      feedbackRichnessRatio:
        brandDecisionsTotal > 0 ? brandDecisionsWithReason / brandDecisionsTotal : null,
    },
  };
}
