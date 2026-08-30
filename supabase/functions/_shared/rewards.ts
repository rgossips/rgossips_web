// Master switch for the rewards programme: referral discounts, the welcome
// RC bonus, referrer RC earnings, and RC redemption.
//
// Turned OFF while store billing is introduced. Apple IAP and Google Play
// Billing charge a fixed price from a price point chosen when the SKU is
// created — there is no mechanism for a server-computed, per-user price. The
// Razorpay flow does exactly that today: it mints a throwaway plan whose
// first cycle is `full − discount`, where the discount is a 50% referral perk
// or an RC redemption capped at half the invoice. That cannot be expressed in
// either store.
//
// Disabling everywhere rather than mobile-only is deliberate. A web-only
// discount would leave the app either advertising a benefit it cannot deliver,
// or pointing users at the website to get a better price — and the latter is
// exactly the steering Apple guideline 3.1.1 prohibits.
//
// Nothing is deleted. Existing ledger rows and balances are untouched, so the
// programme can be switched back on — set REWARDS_ENABLED=true — once there is
// a store-compatible design for it (granting entitlement DAYS after a
// full-price purchase is the usual answer, since it never touches store
// pricing).

/**
 * True only when explicitly enabled. Defaults to OFF so a missing secret
 * cannot silently re-enable discounts that store billing has no way to honour.
 */
export function rewardsEnabled(): boolean {
  return Deno.env.get("REWARDS_ENABLED") === "true";
}
