/**
 * Single source of truth for influencer subscription plans + feature matrix.
 *
 * The matrix mirrors `src/assets/Payment Plan.xlsx` exactly. Use the
 * `feature_key` strings as DB / RBAC identifiers — never spread out copies
 * of these literals in components.
 *
 * Helpers:
 *  - `getEffectivePlan(profile)` — returns the plan a user is currently on,
 *    treating an active 30-day trial as Pro per product spec.
 *  - `hasFeature(plan, key)` — boolean gate for UI/edge-function checks.
 *  - `getFeatureValue(plan, key)` — for tiered values like
 *    "campaign_applications_limit" (number, or Infinity for Unlimited).
 *  - `isWithinTrial(profile)` — true when a user is in their first 30 days.
 */

export const PLAN_IDS = {
  STARTER: "starter",
  PRO: "pro",
  ELITE: "elite",
};

export const TRIAL_DAYS = 30;

// Pricing — adjust monthly/annual figures here. Stripe price IDs live below
// in PLAN_STRIPE_PRICES so the UI and the checkout edge function agree.
export const PLAN_PRICING = {
  starter: { monthly: 99, annual: 899, monthlyEquivalent: 75 },
  pro: { monthly: 299, annual: 2699, monthlyEquivalent: 225 },
  elite: { monthly: 699, annual: 6299, monthlyEquivalent: 525 },
};

// Stripe price IDs (set via env so we don't ship secrets in source).
// Add NEXT_PUBLIC_STRIPE_PRICE_<PLAN>_<CYCLE> in .env.local + Netlify.
export const PLAN_STRIPE_PRICES = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || "",
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || "",
  },
  elite: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY || "",
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL || "",
  },
};

// Feature matrix. Values:
//   true  → included
//   false → not included
//   number / string → tier-specific value (e.g. limit, payout speed text)
export const FEATURE_MATRIX = {
  // Discovery & Visibility
  discovery_listed:           { starter: true,  pro: true,  elite: true },
  discovery_priority:         { starter: false, pro: true,  elite: true },
  discovery_top_placement:    { starter: false, pro: false, elite: true },
  discovery_homepage_spotlight:{starter: false, pro: false, elite: true },
  badge_verified_eligible:    { starter: true,  pro: true,  elite: true },
  badge_elite_verified:       { starter: false, pro: false, elite: true },

  // Applications & Outreach
  campaign_applications_limit:{ starter: 3,     pro: 15,    elite: Infinity },
  brand_dms_limit:            { starter: 10,    pro: 50,    elite: Infinity },
  early_access_deals:         { starter: false, pro: true,  elite: true },
  priority_deal_matching:     { starter: false, pro: false, elite: true },
  manual_brand_curation:      { starter: false, pro: false, elite: true },

  // Analytics & Insights
  analytics_basic:                { starter: true,  pro: true,  elite: true },
  analytics_advanced:             { starter: false, pro: true,  elite: true },
  analytics_audience_demographics:{ starter: false, pro: true,  elite: true },
  analytics_deep_audience:        { starter: false, pro: false, elite: true },
  // "Monthly" is treated as enabled at our gate level
  analytics_fake_follower_audit:  { starter: false, pro: "monthly", elite: "monthly" },
  analytics_roi_report:           { starter: false, pro: false, elite: true },

  // Media Kit
  media_kit_designer_templates: { starter: "Classic only",  pro: "All 5 designs", elite: "All 5 designs" },
  media_kit_template_switches:  { starter: false,           pro: "3 lifetime",    elite: "Unlimited" },
  media_kit_share_link:         { starter: true,            pro: true,            elite: true },

  // Payouts (display string)
  payout_speed: { starter: "7–10 days", pro: "3–5 days", elite: "Within 48 hrs" },

  // Support
  support_standard:           { starter: true,  pro: true,  elite: true },
  support_priority:           { starter: false, pro: true,  elite: true },
  support_dedicated_manager:  { starter: false, pro: false, elite: true },
  support_strategy_call:      { starter: false, pro: false, elite: true },
};

// Group features for display (used by pricing page).
export const FEATURE_GROUPS = [
  {
    title: "Discovery & Visibility",
    features: [
      { key: "discovery_listed",            label: "Listed in brand search" },
      { key: "discovery_priority",          label: "Priority brand search placement" },
      { key: "discovery_top_placement",     label: "Featured in brand search (top placement)" },
      { key: "discovery_homepage_spotlight",label: "Homepage spotlight feature" },
      { key: "badge_verified_eligible",     label: "Verified badge eligibility" },
      { key: "badge_elite_verified",        label: "Elite verified badge" },
    ],
  },
  {
    title: "Applications & Outreach",
    features: [
      { key: "campaign_applications_limit", label: "Campaign applications per month" },
      { key: "brand_dms_limit",             label: "Brand DMs per month" },
      { key: "early_access_deals",          label: "Early access to brand deals (48hr head start)" },
      { key: "priority_deal_matching",      label: "Priority deal matching" },
      { key: "manual_brand_curation",       label: "Manual brand match curation by RGossips" },
    ],
  },
  {
    title: "Analytics & Insights",
    features: [
      { key: "analytics_basic",                label: "Basic analytics dashboard" },
      { key: "analytics_advanced",             label: "Advanced analytics & reports (Excel, PDF, link)" },
      { key: "analytics_audience_demographics",label: "Audience insights (age, gender, location)" },
      { key: "analytics_deep_audience",        label: "Deep audience analytics + psychographics" },
      { key: "analytics_fake_follower_audit",  label: "Fake follower & engagement audit" },
      { key: "analytics_roi_report",           label: "Campaign ROI report for brand partners" },
    ],
  },
  {
    title: "Media Kit",
    features: [
      { key: "media_kit_designer_templates", label: "Designer templates" },
      { key: "media_kit_template_switches",  label: "Template switches" },
      { key: "media_kit_share_link",         label: "Shareable media-kit link" },
    ],
  },
  {
    title: "Payouts",
    features: [{ key: "payout_speed", label: "Payout speed" }],
  },
  {
    title: "Support & Account Management",
    features: [
      { key: "support_standard",          label: "Standard email support" },
      { key: "support_priority",          label: "Priority support" },
      { key: "support_dedicated_manager", label: "Dedicated account manager (WhatsApp + email)" },
      { key: "support_strategy_call",     label: "1:1 content strategy call (monthly)" },
    ],
  },
];

/**
 * Convert a feature value into a renderable string/symbol.
 *  true → "✓"
 *  false → "—"
 *  number → "N/month" or "Unlimited"
 *  string → the string as-is (e.g. payout speed text)
 */
export function formatFeatureValue(value) {
  if (value === true) return "✓";
  if (value === false || value === undefined || value === null) return "—";
  if (typeof value === "number") {
    if (!isFinite(value)) return "Unlimited";
    return `${value}/month`;
  }
  if (typeof value === "string") {
    if (value === "monthly") return "Monthly";
    return value;
  }
  return String(value);
}

/* ─────────── plan-resolution helpers ─────────── */

export function isWithinTrial(profile) {
  if (!profile) return false;
  // If the user has explicitly upgraded to a paid plan, the trial flag no longer matters.
  if (profile.subscription_plan && profile.subscription_plan !== "trial") return false;
  const createdAt = profile.created_at || profile.updated_at;
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!isFinite(created)) return false;
  const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return days >= 0 && days < TRIAL_DAYS;
}

export function trialDaysLeft(profile) {
  if (!profile) return 0;
  const createdAt = profile.created_at || profile.updated_at;
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (!isFinite(created)) return 0;
  const days = TRIAL_DAYS - Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Returns the plan ID a user is effectively on.
 * Order: explicit subscription_plan → trial-as-Pro → starter (default).
 */
export function getEffectivePlan(profile) {
  if (!profile) return PLAN_IDS.STARTER;
  const plan = (profile.subscription_plan || "").toLowerCase();
  if (plan === PLAN_IDS.PRO || plan === PLAN_IDS.ELITE || plan === PLAN_IDS.STARTER) {
    return plan;
  }
  // Per spec: 30-day free trial = Pro features (all 5 templates, 3-change
  // cap, etc.) — so the trial gives a realistic preview of the paid tier
  // most creators would land on, without giving away the Elite perks.
  if (isWithinTrial(profile)) return PLAN_IDS.PRO;
  return PLAN_IDS.STARTER;
}

/**
 * True when the given plan unlocks the feature.
 * For tiered values (numeric/string), any non-falsy value counts as enabled.
 */
export function hasFeature(plan, key) {
  const row = FEATURE_MATRIX[key];
  if (!row) return false;
  const v = row[plan];
  if (v === true) return true;
  if (typeof v === "number") return v > 0;
  if (typeof v === "string") return v.length > 0 && v !== "—";
  return false;
}

/** Raw value for tiered features. */
export function getFeatureValue(plan, key) {
  const row = FEATURE_MATRIX[key];
  if (!row) return null;
  return row[plan];
}

/** Quick wrapper that takes a profile and resolves the active plan first. */
export function profileHasFeature(profile, key) {
  return hasFeature(getEffectivePlan(profile), key);
}

export function profileFeatureValue(profile, key) {
  return getFeatureValue(getEffectivePlan(profile), key);
}

/* ─────────── media-kit template tiers ─────────── */
// Plan rules requested by product:
//   Starter — Classic only; everything else is visible but locked
//   Pro     — all five templates available, capped at 3 lifetime saves
//   Elite   — all five, unlimited saves
// Trial users get Pro features (see getEffectivePlan): all five
// templates with the 3-change cap during the 30-day trial window.
export const MEDIA_KIT_TEMPLATES = [
  {
    id: "classic",
    label: "Classic Gradient",
    description: "The default RGossips two-column layout — friendly and balanced.",
    minPlan: PLAN_IDS.STARTER,
    preview: "linear-gradient(135deg,#9810FA 0%,#E60076 55%,#f472b6 100%)",
  },
  {
    id: "glass_blue",
    label: "Glass Blue",
    description: "Frosted-glass cards over an editorial blue gradient — clean and modern.",
    minPlan: PLAN_IDS.PRO,
    preview: "linear-gradient(160deg,#dce9f8 0%,#bcd6ef 50%,#1564d6 100%)",
  },
  {
    id: "editorial_noir",
    label: "Editorial Noir",
    description: "Magazine-style serif typography on warm paper — premium and considered.",
    minPlan: PLAN_IDS.PRO,
    preview: "linear-gradient(135deg,#f4efe6 0%,#ddd2c0 60%,#16130f 100%)",
  },
  {
    id: "bento_sunset",
    label: "Bento Sunset",
    description: "Bento-grid tiles with a sunset gradient — playful and high-energy.",
    minPlan: PLAN_IDS.PRO,
    preview: "linear-gradient(135deg,#ff9a56 0%,#ff5d73 50%,#c850c0 100%)",
  },
  {
    id: "neo_brutalist",
    label: "Neo-Brutalist",
    description: "Hard borders, mono type and chunky shadows — loud and unforgettable.",
    minPlan: PLAN_IDS.PRO,
    preview: "linear-gradient(135deg,#ffd23f 0%,#E94560 55%,#7F47CD 100%)",
  },
];

const PLAN_RANK = { [PLAN_IDS.STARTER]: 1, [PLAN_IDS.PRO]: 2, [PLAN_IDS.ELITE]: 3 };

// Per-plan cap on how many distinct template saves a creator can do over
// the lifetime of the account. Pro is intentionally tight so Elite has a
// meaningful upgrade story; Starter can only ever stay on Classic so the
// cap is moot.
export const MEDIA_KIT_TEMPLATE_CHANGE_LIMITS = {
  [PLAN_IDS.STARTER]: 0,
  [PLAN_IDS.PRO]: 3,
  [PLAN_IDS.ELITE]: Infinity,
};

/** True when the given effective plan unlocks the template. Trial counts as Elite. */
export function canUseMediaKitTemplate(plan, templateId) {
  const tmpl = MEDIA_KIT_TEMPLATES.find((t) => t.id === templateId);
  if (!tmpl) return false;
  return (PLAN_RANK[plan] || 0) >= (PLAN_RANK[tmpl.minPlan] || 0);
}

/** Convenience wrapper for the common "is this user allowed to pick X" check. */
export function profileCanUseMediaKitTemplate(profile, templateId) {
  return canUseMediaKitTemplate(getEffectivePlan(profile), templateId);
}

/** Lifetime cap for the given effective plan. Infinity for Elite only. */
export function getMediaKitTemplateChangeLimit(plan) {
  if (plan in MEDIA_KIT_TEMPLATE_CHANGE_LIMITS) return MEDIA_KIT_TEMPLATE_CHANGE_LIMITS[plan];
  return 0;
}

/**
 * Returns `{ used, limit, remaining }` for the profile. `remaining` is
 * Infinity for unlimited plans so callers can render that case explicitly.
 */
export function getProfileTemplateChangeUsage(profile) {
  const plan = getEffectivePlan(profile);
  const limit = getMediaKitTemplateChangeLimit(plan);
  const used = profile?.media_kit_template_changes || profile?.mediaKitTemplateChanges || 0;
  const remaining = isFinite(limit) ? Math.max(0, limit - used) : Infinity;
  return { used, limit, remaining, plan };
}
