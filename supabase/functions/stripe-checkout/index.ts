// Creates a Stripe Checkout Session for an influencer subscribing to a paid plan.
// Required env (Supabase secrets):
//   STRIPE_SECRET_KEY     — sk_live_… or sk_test_…
//   APP_URL               — e.g. https://rgossips.com (used for success/cancel)
//
// Body:
//   { userId: string, priceId: string, plan: "pro"|"elite", cycle: "monthly"|"annual" }

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
    const { userId, priceId, plan, cycle, email, origin } = await req.json();

    if (!userId || !priceId) {
      return new Response(
        JSON.stringify({ error: "userId and priceId are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is not configured" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Stripe Checkout needs the absolute redirect URL up front; without
    // the client's actual origin we'd send everyone to APP_URL, which is
    // production by default. Accept the origin from the caller (validated
    // to a small allow-list to avoid open-redirect abuse) and fall back
    // to APP_URL only when none is provided.
    const fallbackUrl = Deno.env.get("APP_URL") || "https://rgossips.com";
    const ALLOWED_ORIGINS = [
      "https://rgossips.com",
      "https://www.rgossips.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      // Mobile app custom URL scheme — the React Native app sends this so
      // InAppBrowser.openAuth() can intercept the post-payment redirect and
      // hand control back to the app (instead of loading rgossips.com inside
      // the in-app browser tab). The scheme is registered as a deep link in
      // both AndroidManifest.xml and iOS Info.plist on the mobile side.
      "com.rgossips://stripe-return",
    ];
    const requestedOrigin = typeof origin === "string" ? origin.trim().replace(/\/+$/, "") : "";
    const appUrl = ALLOWED_ORIGINS.includes(requestedOrigin) ? requestedOrigin : fallbackUrl;

    // Stripe expects application/x-www-form-urlencoded for REST calls.
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("payment_method_types[]", "card");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("client_reference_id", userId);
    params.append("metadata[user_id]", userId);
    params.append("metadata[plan]", plan || "");
    params.append("metadata[cycle]", cycle || "monthly");
    params.append("success_url", `${appUrl}/influencer/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${appUrl}/influencer/pricing?canceled=1`);
    params.append("allow_promotion_codes", "true");
    // RBI / India-export compliance — Stripe accounts registered in India
    // require a customer name + billing address on every charge. Forcing
    // Checkout to collect the billing address satisfies this rule and
    // unblocks the "As per Indian regulations, export transactions
    // require a customer name and address" error. Subscription mode
    // implicitly creates the Customer object on Stripe, so the address
    // is attached to it automatically and shows up on every future
    // invoice — no need for customer_creation (which only applies to
    // one-time payment mode).
    params.append("billing_address_collection", "required");
    params.append("subscription_data[metadata][user_id]", userId);
    params.append("subscription_data[metadata][plan]", plan || "");
    // Pre-fill the email on the customer record so Stripe can email the
    // subscription invoice / receipt automatically. Without this, Checkout
    // still collects an email but it isn't always attached to the Customer
    // object up front, and the "successful payment" email setting in the
    // Stripe Dashboard has nothing to send to.
    if (typeof email === "string" && email.trim()) {
      params.append("customer_email", email.trim());
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (session?.error) {
      return new Response(
        JSON.stringify({ error: session.error.message || "Stripe error" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, id: session.id }),
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
