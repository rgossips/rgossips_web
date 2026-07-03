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

    // Refer & Earn — optional RC redemption on the first Razorpay invoice.
    // Razorpay applies discounts via `offer_id` on subscription creation.
    // Offers are created via POST /v1/offers with a validity window; the
    // account must have Offers enabled (many test accounts don't, in
    // which case the create call fails and we fall through to a normal
    // no-discount subscription). The applied amount is stamped into the
    // subscription's `notes.rc_applied` and only debited by the webhook
    // AFTER a successful subscription.charged — abandoned checkouts leave
    // the wallet untouched.
    let rcOfferId: string | null = null;
    let rcAppliedRupees = 0;
    if (applyRc && Number.isFinite(Number(planPriceRupees)) && Number(planPriceRupees) >= 1) {
      try {
        const supaUrl = Deno.env.get("SUPABASE_URL")!;
        const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const balRes = await fetch(
          `${supaUrl}/rest/v1/v_reward_credits_available_balance?user_id=eq.${encodeURIComponent(userId)}&select=available_balance`,
          { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
        );
        const balRows = await balRes.json().catch(() => []);
        const availableBalance = Array.isArray(balRows) && balRows[0]?.available_balance ? Number(balRows[0].available_balance) : 0;
        const maxApply = Math.floor(Number(planPriceRupees) * 0.5);
        const applied = Math.max(0, Math.min(availableBalance, maxApply));
        if (applied > 0) {
          const nowSec = Math.floor(Date.now() / 1000);
          const offerRes = await fetch("https://api.razorpay.com/v1/offers", {
            method: "POST",
            headers: { Authorization: auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `RGossips RC redemption (${applied})`,
              // "all" covers card / UPI / netbanking / wallet on accounts
              // where Offers is fully enabled. Some accounts require a
              // single method — if that's your case, hard-code "card".
              payment_method: "card",
              discount_amount: applied * 100,
              min_amount: Number(planPriceRupees) * 100,
              redeem_type: "promo",
              max_offer_usage: 1,
              display_text: `RC applied (${applied})`,
              starts_at: nowSec,
              // 24h window. If the user waits longer to complete checkout,
              // they'll retry from the pricing page and get a fresh offer.
              ends_at: nowSec + 24 * 60 * 60,
              notes: { user_id: userId, rc_applied: String(applied) },
            }),
          });
          const offer = await offerRes.json();
          if (offer?.id) {
            rcOfferId = offer.id;
            rcAppliedRupees = applied;
          } else {
            console.error("razorpay offer create failed:", offer?.error?.description || JSON.stringify(offer));
          }
        }
      } catch (e) {
        console.error("RC redemption (razorpay) prep failed:", (e as any)?.message);
      }
    }

    // total_count is the maximum number of billing cycles Razorpay will
    // charge. We pick a long horizon (≈10 years monthly / 50 years yearly)
    // — same effect as Stripe's "renew until cancelled". Cancellation
    // flips the subscription to cancelled-at-period-end on the webhook.
    const totalCount = cycle === "annual" ? 50 : 120;

    // Razorpay's POST /v1/subscriptions does NOT accept a customer_info
    // field on the subscription itself — sending it returns
    // `customer_info is/are not required and should not be sent`. If we
    // want to pre-fill the user's email/name/phone on Razorpay's hosted
    // checkout, we first POST /v1/customers and attach the resulting
    // customer_id to the subscription. Failures here are non-fatal — we
    // fall back to letting Razorpay collect those details during checkout.
    let customerId: string | undefined;
    if (email || name || contact) {
      try {
        const custRes = await fetch("https://api.razorpay.com/v1/customers", {
          method: "POST",
          headers: { Authorization: auth, "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email || undefined,
            name: name || undefined,
            contact: contact || undefined,
            // fail_existing=0 makes Razorpay return the existing customer
            // (by email/contact) instead of 400'ing on a re-upgrade.
            fail_existing: 0,
          }),
        });
        const cust = await custRes.json();
        if (cust?.id) customerId = cust.id;
        else console.warn("razorpay-customer create skipped:", cust?.error?.description || JSON.stringify(cust));
      } catch (e) {
        console.warn("razorpay-customer create threw:", (e as any)?.message);
      }
    }

    const body: Record<string, unknown> = {
      plan_id: planId,
      total_count: totalCount,
      // metadata Razorpay echoes back on webhook events. user_id is our
      // primary join key; plan + cycle save a profile lookup on each event.
      // rc_applied is the applied redemption amount (0 if none / offer
      // creation failed) — the webhook uses it to insert the REDEMPTION
      // ledger row after subscription.charged.
      notes: {
        user_id: userId,
        plan: plan || "",
        cycle: cycle || "monthly",
        rc_applied: String(rcAppliedRupees),
      },
      customer_notify: 1,
    };
    if (customerId) body.customer_id = customerId;
    if (rcOfferId) body.offer_id = rcOfferId;

    const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
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
        customer_id: customerId || null,
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
