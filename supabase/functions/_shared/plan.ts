// Server-side source of truth for what an influencer's subscription entitles
// them to. Mirrors `src/lib/plans.js` (web) and `src/lib/plans.ts` (mobile).
//
// There is no free trial. It was removed in 2026-09: every profile that has
// not paid is on `free`, whatever its `subscription_plan` column happens to
// say. That matters because the column literally holds the string "trial" for
// most existing rows — it was the signup default — and the old code read a
// 30-day window off `created_at` to decide entitlement. Anything that is not
// one of the three paid tiers is free, full stop; no dates involved.
//
// The free tier is deliberately narrow: a creator may apply to
// FREE_BARTER_APPLICATIONS barter campaigns, ever, and nothing else is
// unlocked. It exists so a new creator can see the product work end to end
// before paying, not as a permanent tier.

export type PlanId = "free" | "starter" | "pro" | "elite";

const PAID = new Set<string>(["starter", "pro", "elite"]);

/** Lifetime, not monthly — the point is to convert, not to meter. */
export const FREE_BARTER_APPLICATIONS = 3;

/** Monthly application caps for the paid tiers. */
export const APPLICATION_LIMITS: Record<PlanId, number> = {
  free: FREE_BARTER_APPLICATIONS,
  starter: 3,
  pro: 15,
  elite: Infinity,
};

/** AI generations per calendar month. Free gets none. */
export const AI_LIMITS: Record<PlanId, number> = {
  free: 0,
  starter: 25,
  pro: 150,
  elite: Infinity,
};

export interface PlanProfile {
  subscription_plan?: string | null;
  /** Paid through. NULL/absent = no known end, which never lapses. */
  plan_expires_at?: string | null;
}

/**
 * True when a paid plan has run past the period it was paid for.
 *
 * Only a NON-NULL date in the past lapses anyone. Every row predating
 * migration 069 has NULL here and must keep its plan — we do not know
 * those period ends, and guessing would cut paying creators off.
 */
export function isPlanExpired(profile: PlanProfile | null | undefined): boolean {
  const raw = profile?.plan_expires_at;
  if (!raw) return false;
  const at = Date.parse(String(raw));
  return Number.isFinite(at) && at < Date.now();
}

export function effectivePlan(profile: PlanProfile | null | undefined): PlanId {
  const plan = String(profile?.subscription_plan || "").toLowerCase();
  if (!PAID.has(plan)) return "free";
  // A cancelled subscription keeps its plan until the paid period ends,
  // then drops to free — never to `starter`, which is itself a paid tier.
  return isPlanExpired(profile) ? "free" : (plan as PlanId);
}

/** True when the creator holds any paid plan. The gate for everything. */
export function isSubscribed(profile: PlanProfile | null | undefined): boolean {
  return effectivePlan(profile) !== "free";
}

/**
 * Free creators may only apply to barter campaigns. `hybrid` ("paid +
 * product") is NOT barter — it carries cash, so it sits behind a plan.
 */
export function isBarterCampaign(campaignType: string | null | undefined): boolean {
  return String(campaignType || "").toLowerCase() === "barter";
}
