// Brand Trust Score — CIBIL-style 300–900 scale.
//
// Implements the spec from Brand_Trust_Score_Implementation_Guide.docx:
// five weighted pillars, optional penalty layer (capped at 400), and a
// cold-start cap of 720 until the brand has 3 FINAL_ACCEPTED
// (status='completed') campaigns.
//
//   P1 Influencer Reviews         30%   ratings with recency decay
//   P2 Campaign Execution         25%   approve→complete funnel + revision norms
//   P3 Verification & Identity    20%   email / mobile / PAN / GSTIN flags
//   P4 Communication              15%   response-time SLAs + feedback richness
//   P5 Platform Engagement        10%   recency of activity + profile completeness
//
// Bands: 800–900 Elite · 740–799 Trusted · 670–739 Established
//        580–669 Emerging · <580 Building Trust
// (Renamed from Excellent / Very Good / Good / Fair / Poor — same
//  score cutoffs, non-punitive language for brands still ramping up.)

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstOrPan(value) {
  if (!value) return false;
  const v = String(value).toUpperCase().trim();
  return PAN_RE.test(v) || GSTIN_RE.test(v);
}

export function classifyGstPan(value) {
  if (!value) return { kind: "empty", valid: false };
  const v = String(value).toUpperCase().trim();
  if (PAN_RE.test(v)) return { kind: "pan", valid: true };
  if (GSTIN_RE.test(v)) return { kind: "gst", valid: true };
  if (v.length === 10) return { kind: "pan", valid: false };
  if (v.length === 15) return { kind: "gst", valid: false };
  return { kind: "unknown", valid: false };
}

// GSTINs embed the entity PAN in positions 3–12 (0-indexed 2–11).
// We use this to credit P3's PAN box when the brand has filled GSTIN
// but no separate PAN field.
function embeddedPanFromGstin(gstinRaw) {
  if (!gstinRaw) return null;
  const v = String(gstinRaw).toUpperCase().trim();
  if (!GSTIN_RE.test(v)) return null;
  const embedded = v.slice(2, 12);
  return PAN_RE.test(embedded) ? embedded : null;
}

// Profile completeness fields used by P5. Wider than the old 3-item list —
// the spec explicitly calls out brand category, About, logo, website,
// contact details, and social links.
const PROFILE_FIELDS = [
  { key: "categories",    label: "Categories",       test: (p) => Array.isArray(p?.categories) && p.categories.length > 0 },
  // Column names must match brand_profiles: about lives in full_description
  // (short_description as fallback), website in website_url — the old tests
  // read non-existent columns so these two never counted as filled.
  { key: "about",         label: "About the brand",  test: (p) => !!(p?.full_description || p?.short_description) },
  { key: "logo",          label: "Logo",             test: (p) => !!p?.logo_url },
  { key: "website",       label: "Website",          test: (p) => !!p?.website_url },
  { key: "contactEmail",  label: "Contact email",    test: (p) => !!p?.contact_email },
  { key: "contactPhone",  label: "Contact phone",    test: (p) => !!p?.contact_phone },
  { key: "socials",       label: "Social links",     test: (p) => !!(p?.instagram_username || p?.facebook_url || p?.linkedin_url || p?.twitter_url) },
];

export function getProfileCompletion(profile) {
  if (!profile) return { percent: 0, missing: PROFILE_FIELDS.map((f) => f.label), filled: [] };
  const filled = [];
  const missing = [];
  for (const f of PROFILE_FIELDS) {
    if (f.test(profile)) filled.push(f.label);
    else missing.push(f.label);
  }
  const percent = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  return { percent, missing, filled };
}

// ─── pillar helpers ────────────────────────────────────────────────────
// Each helper returns a 0–100 score plus enough metadata for the
// transparency popup. When the brand has no data for a pillar we default
// to a *neutral* 50 rather than 0 — the cold-start cap of 720 is what
// keeps unproven brands honest.

const NEUTRAL = 50;
const ratingToPct = (avg) => (avg > 0 ? Math.round((Math.min(5, avg) / 5) * 100) : 0);

// Recency decay: half-life of 180 days. A review from a year ago carries
// roughly 25% weight; reviews older than 2 years are near-zero.
function recencyWeight(createdAtIso, now = Date.now()) {
  if (!createdAtIso) return 1;
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t) || t > now) return 1;
  const days = (now - t) / 86_400_000;
  const halfLife = 180;
  return Math.pow(0.5, days / halfLife);
}

// P1 — Influencer Reviews (30%). Blends four 1–5 sub-ratings:
// briefClarity, fairness, feedbackQuality, overall (target_rating).
// We have brief_clarity + fairness + target_rating in DB; feedback_quality
// is not collected yet — we fall back to target_rating's average so a
// brand isn't penalised for a question we never asked.
export function getInfluencerReviewsScore({ reviews = [] } = {}) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { percent: NEUTRAL, count: 0, axes: null, hasData: false };
  }

  const now = Date.now();
  const sum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  const wsum = { target: 0, brief: 0, fair: 0, feedback: 0 };
  for (const r of reviews) {
    const w = recencyWeight(r.created_at, now);
    if (Number.isFinite(r.target_rating) && r.target_rating > 0) {
      sum.target  += r.target_rating  * w; wsum.target  += w;
    }
    if (Number.isFinite(r.brief_clarity) && r.brief_clarity > 0) {
      sum.brief   += r.brief_clarity  * w; wsum.brief   += w;
    }
    if (Number.isFinite(r.fairness) && r.fairness > 0) {
      sum.fair    += r.fairness       * w; wsum.fair    += w;
    }
    if (Number.isFinite(r.feedback_quality) && r.feedback_quality > 0) {
      sum.feedback += r.feedback_quality * w; wsum.feedback += w;
    }
  }
  const target  = wsum.target  ? sum.target  / wsum.target  : 0;
  const brief   = wsum.brief   ? sum.brief   / wsum.brief   : target;
  const fair    = wsum.fair    ? sum.fair    / wsum.fair    : target;
  const feedback = wsum.feedback ? sum.feedback / wsum.feedback : target;

  // Four axes, equal weight inside the pillar.
  const blended = ratingToPct(target) * 0.25 + ratingToPct(brief) * 0.25 + ratingToPct(fair) * 0.25 + ratingToPct(feedback) * 0.25;
  return {
    percent: Math.round(blended),
    count: reviews.length,
    axes: { target, brief, fair, feedback },
    hasData: true,
  };
}

// P2 — Campaign Execution Quality (25%). Funnel through the approval
// flow + revision norms. The doc cites 2 revision rounds as the healthy
// norm; we treat zero revisions or >3 revisions as worse than 1–2.
export function getCampaignExecutionScore({
  approvedCount = 0,
  finalAcceptedCount = 0,
  abandonedAfterApproval = 0,
  reachedDraftCount = 0,
  totalRevisions = 0,
} = {}) {
  // Funnel ratio: of applications you approved, how many made it to
  // FINAL_ACCEPTED? Healthy brands convert most of their approvals.
  const denom = finalAcceptedCount + abandonedAfterApproval;
  const completionRatio = denom > 0 ? finalAcceptedCount / denom : null;

  // Draft engagement: of approved apps, how many actually reached drafts?
  // Brands that approve and ghost score lower here.
  const draftRatio = approvedCount > 0 ? reachedDraftCount / approvedCount : null;

  // Revision health: average revisions per completed campaign.
  const avgRevisions = finalAcceptedCount > 0 ? totalRevisions / finalAcceptedCount : 0;
  let revisionScore = 100;
  if (avgRevisions < 0.5) revisionScore = 70;        // zero revisions → no creative iteration, suspicious
  else if (avgRevisions <= 2.5) revisionScore = 100; // healthy norm
  else if (avgRevisions <= 4)   revisionScore = 60;  // turbulent
  else                          revisionScore = 30;  // chaotic

  const completionPct = completionRatio == null ? NEUTRAL : Math.round(completionRatio * 100);
  const draftPct      = draftRatio == null ? NEUTRAL : Math.round(draftRatio * 100);

  const percent = Math.round(completionPct * 0.5 + draftPct * 0.3 + revisionScore * 0.2);
  return {
    percent,
    completionRatio,
    draftRatio,
    avgRevisions,
    finalAcceptedCount,
    approvedCount,
    abandonedAfterApproval,
    hasData: finalAcceptedCount > 0 || approvedCount > 0,
  };
}

// P3 — Verification & Identity (20%). Four checkboxes × 25 points.
// PAN credit can come from a standalone PAN field OR derived from a
// valid GSTIN (which embeds the entity PAN).
export function getVerificationScore({
  emailVerified = false,
  phoneVerified = false,
  pan = "",
  gstin = "",
} = {}) {
  const gstinValid  = GSTIN_RE.test(String(gstin || "").toUpperCase().trim());
  const standalonePan = isValidGstOrPan(pan) && PAN_RE.test(String(pan).toUpperCase().trim());
  const panFromGstin = !!embeddedPanFromGstin(gstin);
  const panOk = standalonePan || panFromGstin;

  const items = {
    emailVerified: !!emailVerified,
    phoneVerified: !!phoneVerified,
    panProvided:   panOk,
    gstinVerified: gstinValid,
  };

  const percent =
    (items.emailVerified ? 25 : 0) +
    (items.phoneVerified ? 25 : 0) +
    (items.panProvided   ? 25 : 0) +
    (items.gstinVerified ? 25 : 0);

  return { percent, items, hasData: true };
}

// P4 — Communication Quality (15%). Response-time SLAs + feedback
// richness. SLA thresholds per spec: application decision ≤ 48h,
// negotiation ≤ 24h/round, draft feedback ≤ 48h, final acceptance ≤ 48h.
// We compute average latency where we have it; otherwise neutral.
export function getCommunicationScore({
  avgApplicationDecisionHrs = null,
  avgNegotiationHrs = null,
  avgDraftFeedbackHrs = null,
  avgFinalAcceptanceHrs = null,
  feedbackRichnessRatio = null, // 0–1: cycles with written comments / total cycles
} = {}) {
  const sla = (avgHrs, target) => {
    if (avgHrs == null) return null;
    if (avgHrs <= target) return 100;
    if (avgHrs <= target * 2) return 70;
    if (avgHrs <= target * 4) return 40;
    return 10;
  };

  const slaScores = [
    sla(avgApplicationDecisionHrs, 48),
    sla(avgNegotiationHrs, 24),
    sla(avgDraftFeedbackHrs, 48),
    sla(avgFinalAcceptanceHrs, 48),
  ].filter((x) => x != null);

  const responseAvg = slaScores.length > 0
    ? slaScores.reduce((s, v) => s + v, 0) / slaScores.length
    : NEUTRAL;

  const richness = feedbackRichnessRatio == null
    ? NEUTRAL
    : Math.round(feedbackRichnessRatio * 100);

  // 70/30 split — response time matters more to creators than how
  // wordy the feedback is.
  const percent = Math.round(responseAvg * 0.7 + richness * 0.3);

  return {
    percent,
    responseAvg: Math.round(responseAvg),
    richnessPct: Math.round(richness),
    hasData: slaScores.length > 0 || feedbackRichnessRatio != null,
  };
}

// P5 — Platform Engagement (10%). Login recency + recent activity +
// profile completeness.
export function getEngagementScore({
  lastLoginAt = null,
  campaignsLast90d = 0,
  profile = null,
} = {}) {
  // Login recency: full credit within 30 days, decays to ~0 after 180.
  const loginScore = (() => {
    if (!lastLoginAt) return NEUTRAL;
    const days = (Date.now() - new Date(lastLoginAt).getTime()) / 86_400_000;
    if (!Number.isFinite(days) || days < 0) return NEUTRAL;
    if (days <= 7)   return 100;
    if (days <= 30)  return 85;
    if (days <= 60)  return 65;
    if (days <= 90)  return 45;
    if (days <= 180) return 25;
    return 10;
  })();

  // Activity: 1+ campaigns in 90d = healthy. 3+ = excellent.
  const activityScore =
    campaignsLast90d >= 3 ? 100 :
    campaignsLast90d === 2 ? 80 :
    campaignsLast90d === 1 ? 60 : 30;

  const completionPct = getProfileCompletion(profile).percent;

  const percent = Math.round(loginScore * 0.4 + activityScore * 0.3 + completionPct * 0.3);
  return {
    percent,
    loginScore,
    activityScore,
    profileCompletionPct: completionPct,
    campaignsLast90d,
    hasData: true,
  };
}

// ─── orchestration ─────────────────────────────────────────────────────
// Pulls the 5 pillar scores into the CIBIL-style 300–900 number, applies
// penalties + cold-start cap + clamp, and returns the full breakdown.

const PILLAR_WEIGHTS = {
  reviews:      0.30,
  execution:    0.25,
  verification: 0.20,
  communication: 0.15,
  engagement:   0.10,
};

const BANDS = [
  { min: 800, label: "Elite" },
  { min: 740, label: "Trusted" },
  { min: 670, label: "Established" },
  { min: 580, label: "Emerging" },
  { min: 300, label: "Building Trust" },
];

function bandFor(score) {
  for (const b of BANDS) if (score >= b.min) return b.label;
  return "Building Trust";
}

const COLD_START_CAP = 720;
const COLD_START_THRESHOLD = 3;     // FINAL_ACCEPTED campaigns required to lift the cap
const PENALTY_CAP = 400;

export function computeBrandTrustScore({
  profile,
  reviews = [],
  execution = {},
  verification = {},
  communication = {},
  engagement = {},
  penaltyPoints = 0,
} = {}) {
  const p1 = getInfluencerReviewsScore({ reviews });
  const p2 = getCampaignExecutionScore(execution);
  const p3 = getVerificationScore({
    emailVerified: verification.emailVerified,
    phoneVerified: verification.phoneVerified,
    pan: verification.pan,
    gstin: verification.gstin || profile?.gstin,
  });
  const p4 = getCommunicationScore(communication);
  const p5 = getEngagementScore({ ...engagement, profile });

  const overall100 =
    p1.percent * PILLAR_WEIGHTS.reviews +
    p2.percent * PILLAR_WEIGHTS.execution +
    p3.percent * PILLAR_WEIGHTS.verification +
    p4.percent * PILLAR_WEIGHTS.communication +
    p5.percent * PILLAR_WEIGHTS.engagement;

  // Map 0–100 → 300–900, then apply penalties, then clamp.
  let score = 300 + (overall100 / 100) * 600;
  const cappedPenalty = Math.max(0, Math.min(PENALTY_CAP, Number(penaltyPoints) || 0));
  score -= cappedPenalty;
  score = Math.max(300, Math.min(900, Math.round(score)));

  // Cold-start cap applies AFTER clamp.
  const coldStart = (execution.finalAcceptedCount || 0) < COLD_START_THRESHOLD;
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
      influencerReviews:   { ...p1, weight: PILLAR_WEIGHTS.reviews,      label: "Influencer Reviews" },
      campaignExecution:   { ...p2, weight: PILLAR_WEIGHTS.execution,    label: "Campaign Execution" },
      verification:        { ...p3, weight: PILLAR_WEIGHTS.verification, label: "Verification & Identity" },
      communication:       { ...p4, weight: PILLAR_WEIGHTS.communication,label: "Communication Quality" },
      engagement:          { ...p5, weight: PILLAR_WEIGHTS.engagement,   label: "Platform Engagement" },
    },
    // Scale info so UI doesn't have to hard-code constants.
    scaleMin: 300,
    scaleMax: 900,
  };
}

// Backwards-compat shim. Old callers passed `ratings` and `campaignDelivery`;
// we keep a no-op that returns a neutral score so legacy components don't
// crash during the upgrade window. Prefer the new signature above.
export function getCampaignDeliveryRatio({ completedCount = 0, staleCount = 0 } = {}) {
  const total = completedCount + staleCount;
  return {
    percent: total === 0 ? 0 : Math.round((completedCount / total) * 100),
    completedCount,
    staleCount,
    total,
  };
}

export function getInfluencerRatingScore(legacyArgs = {}) {
  // Used to be the standalone helper for the old 50% slice. Kept for any
  // older callers; reviews-array helper above is the new source of truth.
  return getInfluencerReviewsScore({
    reviews: legacyArgs.reviews || [],
  });
}
