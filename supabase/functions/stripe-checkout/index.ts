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
    const { userId, priceId, plan, cycle } = await req.json();

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

    const appUrl = Deno.env.get("APP_URL") || "https://rgossips.com";

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
    params.append("subscription_data[metadata][user_id]", userId);
    params.append("subscription_data[metadata][plan]", plan || "");

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
