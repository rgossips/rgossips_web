// Client-side feature switches.
//
// These mirror server-side gates so the UI never advertises something the
// backend will refuse. Keep them in step — a page offering a benefit the
// server declines is worse than not offering it at all.

/**
 * Rewards programme: referral discount, welcome RC bonus, RC balance and
 * redemption.
 *
 * OFF while store billing ships on mobile. Apple IAP and Google Play Billing
 * charge a fixed price from a price point chosen when the SKU is created —
 * there is no way to express a per-user discount computed from a wallet
 * balance, which is what the Razorpay and Stripe checkouts do today.
 *
 * Disabled on the web too, not just in the app. A web-only discount would
 * leave the mobile app either promising something it cannot deliver, or
 * pointing users at this site for a cheaper price — and the latter is exactly
 * the steering Apple guideline 3.1.1 prohibits.
 *
 * Mirrors REWARDS_ENABLED in supabase/functions/_shared/rewards.ts and
 * REWARDS_ENABLED in the mobile app's src/lib/features.ts. Flip all three
 * together, never one alone.
 */
export const REWARDS_ENABLED = false;
