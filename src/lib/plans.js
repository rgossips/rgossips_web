/**
 * Single source of truth for influencer subscription plans + feature matrix.
 *
 * The matrix mirrors `src/assets/Payment Plan.xlsx` exactly. Use the
 * `feature_key` strings as DB / RBAC identifiers — never spread out copies
 * of these literals in components.
 *
 * Helpers:
 *  - `getEffectivePlan(profile)` — returns the plan a user is currently on,
 *    (`free` when they have never subscribed).
 *  - `hasFeature(plan, key)` — boolean gate for UI/edge-function checks.
 *  - `getFeatureValue(plan, key)` — for tiered values like
 *    "campaign_applications_limit" (number, or Infinity for Unlimited).
 *  - `isSubscribed(profile)` — true when the user holds any paid plan.
 *
 * There is NO free trial. Anything that is not one of the three paid
 * tiers resolves to `free`, whose only entitlement is
 * FREE_BARTER_APPLICATIONS barter applications for the life of the
 * account. Note that most existing rows literally store the string
 * "trial" in `subscription_plan` — that was the signup default and it
 * now means nothing more than "has not paid".
 */

export const PLAN_IDS = {
  // Not a purchasable plan — the state of having bought nothing.
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  ELITE: "elite",
};

/** The three tiers a creator can actually buy. */
export const PAID_PLAN_IDS = [PLAN_IDS.STARTER, PLAN_IDS.PRO, PLAN_IDS.ELITE];

/**
 * How many barter campaigns an unsubscribed creator may apply to.
 * Lifetime, not monthly — it is a taster, not an allowance. Enforced
 * server-side in `apply-campaign` (see supabase/functions/_shared/plan.ts);
 * everything here is presentation.
 */
export const FREE_BARTER_APPLICATIONS = 3;

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

// Razorpay subscription plan IDs (also env-driven for parity with Stripe).
// Test-mode IDs are checked in as defaults so the local + staging flows
// work without needing every dev to set six env vars. Production overrides
// via NEXT_PUBLIC_RAZORPAY_PLAN_<PLAN>_<CYCLE> in Netlify.
// NO FALLBACKS, deliberately. These used to default to hardcoded test-mode
// plan ids. Once the account is live, a single missing env var on the
// deploy host would pair a TEST plan id with a LIVE key — Razorpay rejects
// that at checkout, so it fails for real customers only, in production, and
// nowhere earlier. Empty is better: the caller in pricing/page.js already
// guards on a falsy id and shows an error naming the exact variable to set.
export const PLAN_RAZORPAY_IDS = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_MONTHLY || "",
    annual:  process.env.NEXT_PUBLIC_RAZORPAY_PLAN_STARTER_ANNUAL  || "",
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO_MONTHLY     || "",
    annual:  process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO_ANNUAL      || "",
  },
  elite: {
    monthly: process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_MONTHLY   || "",
    annual:  process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ELITE_ANNUAL    || "",
  },
};

// Public Razorpay key. Server-side secret + webhook secret live in Supabase
// Edge Function secrets only.
//
// Nothing in the web app reads this any more: every checkout path takes
// `key_id` from its own server response instead, which is what lets the
// test-mode allowlist work — the widget opens in whatever mode the server
// created the order in, and the two can never drift apart. Kept as an
// export for parity with the mobile config, without a test-key fallback
// that would silently misreport the mode.
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

export const PAYMENT_GATEWAYS = ["stripe", "razorpay"];

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
  media_kit_designer_templates: { starter: "Classic only",  pro: "3 designs",     elite: "All 5 designs" },
  media_kit_template_switches:  { starter: false,           pro: "3 lifetime",    elite: "Unlimited" },
  media_kit_share_link:         { starter: true,            pro: true,            elite: true },

  // AI Creator Tools (metered by ai_generations_limit; see ai-generate edge fn)
  ai_generations_limit:     { starter: 25,    pro: 150,   elite: Infinity },
  ai_content_studio:        { starter: true,  pro: true,  elite: true },
  ai_pitch_assistant:       { starter: true,  pro: true,  elite: true },
  ai_match_coach:           { starter: false, pro: true,  elite: true },
  ai_media_kit_v2:          { starter: false, pro: true,  elite: true },
  ai_rate_card_benchmarks:  { starter: false, pro: true,  elite: true },
  ai_growth_audit:          { starter: false, pro: true,  elite: true },
  ai_preflight_review:      { starter: false, pro: false, elite: true },
  ai_copilot:               { starter: false, pro: false, elite: true },

  // Payouts (display string)
  payout_speed: { starter: "7–10 days", pro: "3–5 days", elite: "Within 48 hrs" },

  // Support
  support_standard:           { starter: true,  pro: true,  elite: true },
  support_priority:           { starter: false, pro: true,  elite: true },
  support_dedicated_manager:  { starter: false, pro: false, elite: true },
  support_strategy_call:      { starter: false, pro: false, elite: true },
};

// Everything the free tier includes, and nothing else. Any key absent
// here is locked for free — the default is deny, so a feature added to
// the matrix later cannot leak into the free tier by omission.
//
// Discovery stays on deliberately: being findable by brands is supply
// for the marketplace, not a perk the creator is buying, and hiding
// unsubscribed creators would empty the brand-side search.
const FREE_TIER = {
  discovery_listed: true,
  badge_verified_eligible: true,
  campaign_applications_limit: FREE_BARTER_APPLICATIONS,
  support_standard: true,
};

for (const [key, row] of Object.entries(FEATURE_MATRIX)) {
  row.free = Object.hasOwn(FREE_TIER, key)
    ? FREE_TIER[key]
    : typeof row.starter === "number"
      ? 0
      : false;
}

// The matrix stores a bare number for applications, but the free tier's
// three are lifetime AND barter-only — "3/month" would be a lie.
export const FREE_TIER_LABELS = {
  campaign_applications_limit: `${FREE_BARTER_APPLICATIONS} barter, one-time`,
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
    title: "AI Creator Tools",
    features: [
      { key: "ai_generations_limit",   label: "AI generations per month" },
      { key: "ai_content_studio",      label: "AI Content Studio (captions, scripts, hooks)" },
      { key: "ai_pitch_assistant",     label: "AI Pitch Assistant" },
      { key: "ai_match_coach",         label: "AI Match Coach" },
      { key: "ai_media_kit_v2",        label: "AI Media Kit writer" },
      { key: "ai_rate_card_benchmarks",label: "AI rate-card benchmarks" },
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
export function formatFeatureValue(value, { plan, key } = {}) {
  // Free-tier values that a generic formatter would misdescribe.
  if (plan === PLAN_IDS.FREE && key && FREE_TIER_LABELS[key]) return FREE_TIER_LABELS[key];
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

/**
 * Returns the plan ID a user is effectively on.
 *
 * An explicit paid tier wins; everything else — null, "", "free", and the
 * legacy "trial" most rows still carry — is `free`. No dates are consulted:
 * the trial was removed, so signup age no longer buys anything.
 */
export function getEffectivePlan(profile) {
  const plan = (profile?.subscription_plan || "").toLowerCase();
  if (!PAID_PLAN_IDS.includes(plan)) return PLAN_IDS.FREE;
  // A cancelled subscription keeps its plan until the paid period ends,
  // then drops to free — never to `starter`, which is itself a paid tier.
  return isPlanExpired(profile) ? PLAN_IDS.FREE : plan;
}

/**
 * True when a paid plan has run past the period it was paid for.
 *
 * Only a NON-NULL date in the past lapses anyone. Every row predating
 * migration 069 has `plan_expires_at` NULL and must keep its plan — we
 * do not know those period ends, and guessing would cut paying creators
 * off.
 */
export function isPlanExpired(profile) {
  const raw = profile?.plan_expires_at;
  if (!raw) return false;
  const at = Date.parse(raw);
  return Number.isFinite(at) && at < Date.now();
}

/**
 * Renewal standing for the UI: is the plan live, is auto-renew off, and
 * when does access actually end. `cancelled` is the state this exists
 * for — paid, still entitled, but not renewing.
 */
export function getSubscriptionStatus(profile) {
  const plan = getEffectivePlan(profile);
  const subscribed = plan !== PLAN_IDS.FREE;
  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const validExpiry = expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null;
  // `auto_renew` defaults true, so a row that predates 069 reads as
  // renewing — which is the safe assumption for an active subscriber.
  const autoRenew = profile?.auto_renew !== false;
  const daysLeft = validExpiry
    ? Math.max(0, Math.ceil((validExpiry.getTime() - Date.now()) / 86_400_000))
    : null;
  return {
    plan,
    subscribed,
    autoRenew,
    expiresAt: validExpiry,
    daysLeft,
    // Paid, still entitled, but will not renew.
    cancelled: subscribed && !autoRenew,
    // Was on a paid plan; the paid period has run out.
    lapsed: !subscribed && !!profile?.subscription_plan && isPlanExpired(profile),
  };
}

/** True when the creator holds any paid plan. The gate for everything. */
export function isSubscribed(profile) {
  return getEffectivePlan(profile) !== PLAN_IDS.FREE;
}

/**
 * Free-tier application allowance. `used` is the creator's LIFETIME
 * application count (the server counts rows in `campaign_applications`),
 * so the caller has to supply it — nothing on the profile carries it.
 */
export function getFreeApplicationStatus(profile, used = 0) {
  const subscribed = isSubscribed(profile);
  const remaining = subscribed ? Infinity : Math.max(0, FREE_BARTER_APPLICATIONS - used);
  return {
    subscribed,
    used,
    limit: FREE_BARTER_APPLICATIONS,
    remaining,
    exhausted: !subscribed && remaining === 0,
  };
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
//   Pro     — Classic + Glass Blue + Editorial Noir (3 designs),
//             capped at 3 lifetime saves between them
//   Elite   — all five designs, unlimited saves
// Free    — no media kit at all. It is a subscriber feature, so an
//           unsubscribed creator cannot pick any template (PLAN_RANK
//           has no `free` entry, so every template ranks above them).
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
    minPlan: PLAN_IDS.ELITE,
    preview: "linear-gradient(135deg,#ff9a56 0%,#ff5d73 50%,#c850c0 100%)",
  },
  {
    id: "neo_brutalist",
    label: "Neo-Brutalist",
    description: "Hard borders, mono type and chunky shadows — loud and unforgettable.",
    minPlan: PLAN_IDS.ELITE,
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

/** True when the given effective plan unlocks the template. Free unlocks none. */
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

/**
 * Monthly AI-generation quota status. `usedThisMonth` is fetched by the caller
 * from `ai_generation_usage` (sum of `count` for the current YYYY-MM). Mirrors
 * getProfileTemplateChangeUsage. `remaining` is Infinity for unlimited (Elite).
 */
export function getAiUsageStatus(profile, usedThisMonth = 0) {
  const plan = getEffectivePlan(profile);
  const limit = getFeatureValue(plan, "ai_generations_limit");
  const unlimited = !isFinite(limit);
  const remaining = unlimited ? Infinity : Math.max(0, limit - usedThisMonth);
  return { used: usedThisMonth, limit, remaining, unlimited, plan };
}
