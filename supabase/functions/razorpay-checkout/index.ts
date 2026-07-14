// Creates a Razorpay subscription for an influencer upgrading to a paid
// plan. Mirrors stripe-checkout's contract — the client gets back a URL
// it can window.location to, and the webhook (razorpay-webhook) is what
// actually flips the user's subscription_plan on the influencer profile
// when Razorpay confirms the first charge.
//
// Required env (Supabase secrets):
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//   APP_URL                 — e.g. https://rgossips.com
//
// Body:
//   { userId: string, planId: string, plan: "starter"|"pro"|"elite", cycle: "monthly"|"annual", email?: string, name?: string, contact?: string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Idempotency guard. Before minting a new subscription, look for one this
// user already has for the SAME plan that hasn't reached a terminal state.
// Prevents rapid double-submits (or a retry after a slow first attempt)
// from creating a second parallel subscription — which is how a user can
// end up double-billed. Returns the reusable sub + its state, or null.
//   - active      → the user is already subscribed to this plan; the client
//                   should reconcile the profile rather than open checkout.
//   - authenticated/created → an in-flight attempt; reuse it so the client
//                   opens checkout on the same subscription.
//
// A first-cycle-discount subscription is created on a THROWAWAY plan (see
// below) with the real plan recorded in notes.base_plan_id, so we match on
// either the live plan_id OR that note to stay idempotent for both paths.
async function findReusableSubscription(auth: string, userId: string, planId: string) {
  const REUSE_STATES = ["active", "authenticated", "created"];
  // Only the first couple of pages — the user's newest subs are first.
  for (let skip = 0; skip < 200; skip += 100) {
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions?count=100&skip=${skip}`, {
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) break;
    const body = await res.json().catch(() => ({}));
    const items: any[] = Array.isArray(body?.items) ? body.items : [];
    const mine = items.filter(
      (s) =>
        String(s?.notes?.user_id || "") === userId &&
        (String(s?.plan_id || "") === planId ||
          String(s?.notes?.base_plan_id || "") === planId) &&
        REUSE_STATES.includes(String(s.status)),
    );
    if (mine.length) {
      // Prefer active > authenticated > created, then newest.
      mine.sort((a, b) => {
        const rank = (s: any) => REUSE_STATES.indexOf(String(s.status));
        return rank(a) - rank(b) || Number(b.created_at || 0) - Number(a.created_at || 0);
      });
      return mine[0];
    }
    if (items.length < 100) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, planId, plan, cycle, email, name, contact, applyRc, planPriceRupees } = await req.json();

    if (!userId || !planId) {
      return new Response(
        JSON.stringify({ error: "userId and planId are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials are not configured" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const appUrl = Deno.env.get("APP_URL") || "https://rgossips.com";
    const auth = `Basic ${btoa(`${keyId}:${keySecret}`)}`;

    // Idempotency: reuse an existing non-terminal subscription for this
    // user+plan instead of creating a duplicate. Done BEFORE any discount /
    // customer / subscription creation so a double-submit is cheap and
    // can't spawn a second sub.
    try {
      const reusable = await findReusableSubscription(auth, userId, planId);
      if (reusable) {
        const returnUrl = `${appUrl}/influencer/pricing?razorpay_success=1&subscription_id=${encodeURIComponent(reusable.id)}`;
        return new Response(
          JSON.stringify({
            id: reusable.id,
            subscription_id: reusable.id,
            key_id: keyId,
            customer_id: reusable.customer_id || null,
            url: reusable.short_url || null,
            return_url: returnUrl,
            reused: true,
            // Already paid/active — the client should reconcile the profile
            // rather than reopen checkout (no second charge to collect).
            already_active: String(reusable.status) === "active",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    } catch (e) {
      // Non-fatal — if the lookup fails we fall through and create a new
      // subscription (the previous behaviour). Better a rare duplicate than
      // a blocked upgrade.
      console.warn("razorpay-checkout idempotency lookup failed:", (e as any)?.message);
    }

    const supaUrl0 = Deno.env.get("SUPABASE_URL")!;
    const supaKey0 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── First-cycle discount ────────────────────────────────────────────────
    // Either the referral 50%-off (a referred creator's first subscription,
    // gifted by the referrer) or an RC redemption. Razorpay has NO programmatic
    // create-offer API (POST /v1/offers 404s) and the Offers product isn't
    // enabled on this account, so we can't discount via offer_id the way Stripe
    // discounts via a coupon. Instead we deliver the discount natively:
    //   1. create the subscription on a one-off DISCOUNTED plan (amount =
    //      full − discount) so the FIRST charge shown at checkout is reduced,
    //   2. schedule an automatic upgrade to the real plan at cycle end
    //      (schedule_change_at: "cycle_end").
    // Result: cycle 1 discounted, cycles 2..N at full price, auto-recurring,
    // and the discount is visible at checkout — all with the public Plans +
    // Subscriptions APIs (no Offers feature required). Referral takes
    // precedence over RC (one discount per first cycle); RC stays in the wallet.
    let discountPaise = 0;
    let isReferralDiscount = false;
    let rcAppliedRupees = 0;
    const planPaise = Math.round(Number(planPriceRupees) * 100);
    if (Number.isFinite(planPaise) && planPaise >= 100) {
      // Referral eligibility: referee on an active referral AND not yet subscribed.
      try {
        const [refRes, profRes] = await Promise.all([
          fetch(
            `${supaUrl0}/rest/v1/referrals?referee_id=eq.${encodeURIComponent(userId)}&status=in.(SIGNED_UP,QUALIFIED,REWARDED)&select=id&limit=1`,
            { headers: { apikey: supaKey0, Authorization: `Bearer ${supaKey0}` } }
          ),
          fetch(
            `${supaUrl0}/rest/v1/influencer_profiles?influencer_id=eq.${encodeURIComponent(userId)}&select=subscription_plan`,
            { headers: { apikey: supaKey0, Authorization: `Bearer ${supaKey0}` } }
          ),
        ]);
        const refRows = await refRes.json().catch(() => []);
        const profRows = await profRes.json().catch(() => []);
        const plan0 = (Array.isArray(profRows) && profRows[0]?.subscription_plan) || "";
        const notSubscribed = !plan0 || plan0 === "trial";
        if (Array.isArray(refRows) && refRows.length > 0 && notSubscribed) {
          discountPaise = Math.round(planPaise * 0.5);
          isReferralDiscount = true;
        }
      } catch (e) {
        console.error("Referral discount (razorpay) eligibility failed:", (e as any)?.message);
      }

      // RC redemption — only when no referral discount applies. Cap: available
      // balance, and at most 50% of the plan price. The applied amount is
      // stamped into notes.rc_applied and only debited by the webhook after a
      // successful charge (abandoned checkouts leave the wallet untouched).
      if (!isReferralDiscount && applyRc) {
        try {
          const balRes = await fetch(
            `${supaUrl0}/rest/v1/v_reward_credits_available_balance?user_id=eq.${encodeURIComponent(userId)}&select=available_balance`,
            { headers: { apikey: supaKey0, Authorization: `Bearer ${supaKey0}` } }
          );
          const balRows = await balRes.json().catch(() => []);
          const availableBalance = Array.isArray(balRows) && balRows[0]?.available_balance ? Number(balRows[0].available_balance) : 0;
          const maxApply = Math.floor(Number(planPriceRupees) * 0.5);
          const applied = Math.max(0, Math.min(availableBalance, maxApply));
          if (applied > 0) {
            discountPaise = applied * 100;
            rcAppliedRupees = applied;
          }
        } catch (e) {
          console.error("RC redemption (razorpay) prep failed:", (e as any)?.message);
        }
      }
    }
    // Never let the first-cycle amount fall below Razorpay's ₹1 minimum.
    if (discountPaise > planPaise - 100) discountPaise = Math.max(0, planPaise - 100);

    // total_count is the maximum number of billing cycles Razorpay will
    // charge. We pick a long horizon (≈10 years monthly / 50 years yearly)
    // — same effect as Stripe's "renew until cancelled". Cancellation
    // flips the subscription to cancelled-at-period-end on the webhook.
    const totalCount = cycle === "annual" ? 50 : 120;

    // NOTE: we deliberately do NOT pre-create a Razorpay customer and attach
    // its customer_id to the subscription. On this account, POST
    // /v1/subscriptions WITH a customer_id fails hard with 400 "Authentication
    // failed" (customer-linked subscriptions aren't enabled), which blocked
    // every Razorpay checkout that carried an email/name/contact — i.e. all of
    // them. The customer_id was only ever used to prefill the hosted page; the
    // embedded checkout already receives email/name/contact via its own
    // `prefill` on the client, so dropping it costs nothing and unblocks
    // checkout. `email`/`name`/`contact` remain in the request purely for that
    // client-side prefill.

    // Resolve the plan the FIRST cycle is billed on. With a discount we mint a
    // one-off plan at (full − discount) so checkout shows the reduced amount;
    // we upgrade back to the real plan at cycle end further below.
    const period = cycle === "annual" ? "yearly" : "monthly";
    let firstCyclePlanId = planId;
    if (discountPaise > 0) {
      try {
        const dpRes = await fetch("https://api.razorpay.com/v1/plans", {
          signal: AbortSignal.timeout(15000),
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({
            period,
            interval: 1,
            item: {
              name: `RGossips ${plan || "plan"} — first ${period} ${isReferralDiscount ? "50% off" : `RC ${rcAppliedRupees}`}`,
              amount: planPaise - discountPaise,
              currency: "INR",
            },
            notes: { kind: "first_cycle_discount", base_plan_id: planId, user_id: userId },
          }),
        });
        const dp = await dpRes.json();
        if (dp?.id) firstCyclePlanId = dp.id;
        else console.error("razorpay discounted-plan create failed:", dp?.error?.description || JSON.stringify(dp));
      } catch (e) {
        console.error("Discounted first-cycle plan (razorpay) failed:", (e as any)?.message);
      }
    }

    const body: Record<string, unknown> = {
      plan_id: firstCyclePlanId,
      total_count: totalCount,
      // metadata Razorpay echoes back on webhook events. user_id is our
      // primary join key; plan + cycle save a profile lookup on each event.
      // base_plan_id is the REAL plan the profile should reflect — reconcile
      // and the webhook must read `plan` here, never the possibly-discounted
      // first-cycle plan_id. rc_applied is the applied redemption amount (0 if
      // none) — the webhook uses it to insert the REDEMPTION ledger row after
      // subscription.charged.
      notes: {
        user_id: userId,
        plan: plan || "",
        cycle: cycle || "monthly",
        rc_applied: String(rcAppliedRupees),
        referral_discount: isReferralDiscount ? "50" : "",
        base_plan_id: planId,
      },
      customer_notify: 1,
    };

    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      signal: AbortSignal.timeout(15000),
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const sub = await subRes.json();
    if (sub?.error || !sub?.id) {
      const msg = sub?.error?.description || sub?.error?.reason || "Razorpay error";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // NOTE: the automatic upgrade from the discounted first-cycle plan back to
    // the real plan (so cycles 2..N charge full price) can NOT be scheduled
    // here — Razorpay rejects a plan change while the subscription is still in
    // `created` state ("not in Authenticated or Active state"). It only becomes
    // authenticated/active once the user completes checkout. The upgrade is
    // therefore deferred to `reconcile-subscription`, which the client always
    // calls after a successful payment (and which the webhook backstops): it
    // reads notes.base_plan_id and, if the sub is still on the throwaway
    // discounted plan, PATCHes it to base_plan_id with schedule_change_at:
    // "cycle_end". This keeps recurring revenue at full price.

    // Hand the subscription id back so the client can open Razorpay's
    // embedded Checkout modal (checkout.js) right on /influencer/pricing.
    // The hosted page at sub.short_url is unreliable on test accounts
    // (depends on dashboard branding state); the embedded checkout works
    // as long as the Subscriptions API works, which it just did. The plan
    // flip itself happens via the razorpay-webhook handler — handler() in
    // the client is only used to navigate to ?razorpay_success=1.
    const returnUrl = `${appUrl}/influencer/pricing?razorpay_success=1&subscription_id=${encodeURIComponent(sub.id)}`;
    return new Response(
      JSON.stringify({
        id: sub.id,
        subscription_id: sub.id,
        key_id: keyId,
        customer_id: null,
        // Kept for any legacy callers; new clients should use the
        // embedded checkout (subscription_id + key_id) instead.
        url: sub.short_url,
        return_url: returnUrl,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + ((err as any)?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
