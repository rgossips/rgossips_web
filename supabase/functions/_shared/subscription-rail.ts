// Which rail owns a creator's subscription, and is it still live?
//
// Three rails sell the same plans: Apple (in the iOS app), Google (in the
// Android app) and Razorpay (on the web). Store rules decide which one may
// sell on a given surface — Apple requires IAP inside the iOS app, Google
// requires Play Billing inside the Android app — but they say nothing about
// who is already billing. That is a property of the SUBSCRIPTION, not of the
// device in the user's hand, and only the profile knows it.
//
// Without this, a creator who subscribed on the web and then opened the iOS
// app was offered a plan again, and ended up charged by both. Neither store
// can cancel the other, and Apple forbids us doing it for them — so the only
// honest answer is to refuse the second purchase and say why.
//
// `payment_gateway` is the authority: every grant path writes it
// (razorpay-webhook, verify-iap-purchase), and it names who bills TODAY.

export type Rail = "apple_iap" | "google_play" | "razorpay" | "stripe";

/** The surface asking. Maps to the only rail allowed to sell there. */
export type Surface = "ios" | "android" | "web";

export const RAIL_FOR_SURFACE: Record<Surface, Rail> = {
  ios: "apple_iap",
  android: "google_play",
  web: "razorpay",
};

const PAID_PLANS = new Set(["starter", "pro", "elite"]);

export interface RailProfile {
  subscription_plan?: string | null;
  payment_gateway?: string | null;
  plan_expires_at?: string | null;
}

export interface RailStatus {
  /** Who is billing, or null when nothing is live. */
  rail: Rail | null;
  /** A paid plan that has not run out. */
  live: boolean;
  plan: string | null;
}

/**
 * A subscription counts as live until the period it was paid for ends.
 *
 * That deliberately includes a CANCELLED subscription whose period has not
 * expired — the creator still has the entitlement they paid for, so the
 * other rails must stay shut until it actually lapses. It also covers
 * billing-retry and grace periods, where the store keeps `plan_expires_at`
 * in the future while it retries the card: unlocking there would let a
 * second subscription start during a hiccup on the first.
 *
 * A null `plan_expires_at` means "no known end", which rows predating
 * migration 069 have — those keep their plan rather than being treated as
 * expired.
 */
export function subscriptionRail(profile: RailProfile | null | undefined): RailStatus {
  const plan = String(profile?.subscription_plan || "").toLowerCase();
  if (!PAID_PLANS.has(plan)) return { rail: null, live: false, plan: null };

  const raw = profile?.plan_expires_at;
  if (raw) {
    const at = Date.parse(String(raw));
    if (Number.isFinite(at) && at < Date.now()) {
      return { rail: null, live: false, plan: null };
    }
  }

  const gateway = String(profile?.payment_gateway || "").toLowerCase();
  const rail: Rail | null =
    gateway === "apple_iap" || gateway === "google_play" || gateway === "razorpay" || gateway === "stripe"
      ? (gateway as Rail)
      : null;

  // A live plan whose gateway we cannot name is treated as live but
  // unattributed: blocking on it would strand the user, and granting on it
  // would double-bill. Callers decide; most should let the purchase through
  // rather than lock someone out over missing data.
  return { rail, live: true, plan };
}

/**
 * Should `surface` be allowed to sell a NEW subscription?
 *
 * Same rail → yes: Apple and Google handle upgrades and downgrades natively
 * inside a subscription group, with proration, and forcing a cancel first
 * would cost the creator the days they already paid for.
 */
export function canSellOn(
  surface: Surface,
  profile: RailProfile | null | undefined,
): { allowed: boolean; blockedBy: Rail | null; plan: string | null } {
  const status = subscriptionRail(profile);
  if (!status.live || !status.rail) {
    return { allowed: true, blockedBy: null, plan: status.plan };
  }
  if (status.rail === RAIL_FOR_SURFACE[surface]) {
    return { allowed: true, blockedBy: null, plan: status.plan };
  }
  return { allowed: false, blockedBy: status.rail, plan: status.plan };
}
