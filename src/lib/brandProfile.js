// Validation + scoring helpers for brand profiles.
//
// Trust score components (out of 100, then scaled ×10 to give a 0–1000):
//   50% — influencer ratings of this brand, blended:
//          30% target_rating (the headline overall score)
//          10% brief_clarity sub-score
//          10% fairness sub-score
//          Sub-axes that have no samples yet fall back to the target_rating
//          average so brands aren't penalised for data we don't have.
//   25% — completed-vs-stale ratio: completed / (completed + closed-stale)
//          where stale = closed/expired campaigns that never reached completion
//   25% — profile completeness (GST/PAN, contact email, categories)
//
// Profile completion requires: GST/PAN, contact email, ≥1 category.

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstOrPan(value) {
  if (!value) return false;
  const v = String(value).toUpperCase().trim();
  return PAN_RE.test(v) || GSTIN_RE.test(v);
}

// Returns the rough kind for inline messaging — used to tell the user what
// they entered and what's missing.
export function classifyGstPan(value) {
  if (!value) return { kind: "empty", valid: false };
  const v = String(value).toUpperCase().trim();
  if (PAN_RE.test(v)) return { kind: "pan", valid: true };
  if (GSTIN_RE.test(v)) return { kind: "gst", valid: true };
  if (v.length === 10) return { kind: "pan", valid: false };
  if (v.length === 15) return { kind: "gst", valid: false };
  return { kind: "unknown", valid: false };
}

const PROFILE_FIELDS = [
  {
    key: "gstPan",
    label: "GST / PAN",
    test: (p) => !!p?.gstin,
  },
  {
    key: "email",
    label: "Contact email",
    test: (p) => !!p?.contact_email,
  },
  {
    key: "categories",
    label: "Categories",
    test: (p) => Array.isArray(p?.categories) && p.categories.length > 0,
  },
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

// Stale = campaign that ended (closed / expired by end_date) without any
// completed application. We treat campaigns with at least one completed
// application as "completed", everything else that's no-longer-running as stale.
export function getCampaignDeliveryRatio({ completedCount = 0, staleCount = 0 } = {}) {
  const total = completedCount + staleCount;
  if (total === 0) return { percent: 0, completedCount, staleCount, total };
  return {
    percent: Math.round((completedCount / total) * 100),
    completedCount,
    staleCount,
    total,
  };
}

const ratingToPct = (avg) => (avg > 0 ? Math.round((Math.min(5, avg) / 5) * 100) : 0);

// Blends overall + brief_clarity + fairness into one 0-100 number used for
// the 50% slice. Each sub-axis contributes a fixed share of the slice; if
// brief/fair have no samples we reuse the overall average so a brand isn't
// penalised for missing data the influencer chose not to provide.
export function getInfluencerRatingScore({
  avgRating = 0,
  avgBriefClarity = 0,
  avgFairness = 0,
  count = 0,
  briefCount = 0,
  fairnessCount = 0,
} = {}) {
  if (!count || avgRating <= 0) {
    return {
      percent: 0,
      avgRating: 0,
      avgBriefClarity: 0,
      avgFairness: 0,
      count,
      briefCount,
      fairnessCount,
      // Sub-shares within the slice — kept here for tooltips so the UI can
      // explain how the 50% breaks down.
      shareTarget: 0.6,
      shareBrief: 0.2,
      shareFair: 0.2,
    };
  }

  const targetPct = ratingToPct(avgRating);
  const briefPct = briefCount > 0 ? ratingToPct(avgBriefClarity) : targetPct;
  const fairPct = fairnessCount > 0 ? ratingToPct(avgFairness) : targetPct;

  // 30/10/10 of the parent 50% slice → 0.6 / 0.2 / 0.2 *within* the slice.
  const blendedPercent = Math.round(targetPct * 0.6 + briefPct * 0.2 + fairPct * 0.2);

  return {
    percent: blendedPercent,
    avgRating,
    avgBriefClarity,
    avgFairness,
    count,
    briefCount,
    fairnessCount,
    shareTarget: 0.6,
    shareBrief: 0.2,
    shareFair: 0.2,
  };
}

// Returns a 0–1000 score with the breakdown so callers can show "what's
// dragging me down" tooltips/explanations. Each component contributes to the
// 0-100 weighted total which is then scaled up.
export function computeBrandTrustScore({ profile, ratings, campaignDelivery }) {
  const completion = getProfileCompletion(profile);
  const rating = getInfluencerRatingScore(ratings || {});
  const delivery = getCampaignDeliveryRatio(campaignDelivery || {});

  const weighted100 =
    rating.percent * 0.5 + delivery.percent * 0.25 + completion.percent * 0.25;
  const score1000 = Math.round(weighted100 * 10);

  let band = "LOW";
  if (weighted100 >= 75) band = "HIGH";
  else if (weighted100 >= 45) band = "GOOD";

  return {
    score: score1000,
    percent: Math.round(weighted100),
    band,
    breakdown: {
      influencerRating: { ...rating, weight: 0.5 },
      campaignDelivery: { ...delivery, weight: 0.25 },
      profileCompleteness: { ...completion, weight: 0.25 },
    },
  };
}
