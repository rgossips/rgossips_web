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
    const { userId, planId, plan, cycle, email, name, contact } = await req.json();

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

    // total_count is the maximum number of billing cycles Razorpay will
    // charge. We pick a long horizon (≈10 years monthly / 50 years yearly)
    // — same effect as Stripe's "renew until cancelled". Cancellation
    // flips the subscription to cancelled-at-period-end on the webhook.
    const totalCount = cycle === "annual" ? 50 : 120;

    const body: Record<string, unknown> = {
      plan_id: planId,
      total_count: totalCount,
      // metadata Razorpay echoes back on webhook events. user_id is our
      // primary join key; plan + cycle save a profile lookup on each event.
      notes: {
        user_id: userId,
        plan: plan || "",
        cycle: cycle || "monthly",
      },
      customer_notify: 1,
    };

    if (email || name || contact) {
      body.customer_info = {
        email: email || undefined,
        name: name || undefined,
        contact: contact || undefined,
      };
    }

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

    // Razorpay hands back a `short_url` we can redirect the user to. That
    // page hosts the checkout iframe + redirects back to APP_URL on
    // success. The actual plan flip happens server-side via the webhook,
    // so the return URL is just for UX.
    const returnUrl = `${appUrl}/influencer/pricing?razorpay_success=1&subscription_id=${encodeURIComponent(sub.id)}`;
    return new Response(
      JSON.stringify({
        url: sub.short_url,
        id: sub.id,
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
