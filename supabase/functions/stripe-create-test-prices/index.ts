// One-shot: provisions the 6 test-mode subscription prices (3 plans ×
// monthly + annual) and returns their IDs. Reuses STRIPE_SECRET_KEY
// from Supabase secrets so we don't have to plumb the test key
// elsewhere.
//
// Amounts mirror PLAN_PRICING in src/lib/plans.js:
//   Starter  ₹99/mo   ₹899/yr
//   Pro      ₹299/mo  ₹2699/yr
//   Elite    ₹699/mo  ₹6299/yr
//
// Idempotency: each call creates fresh Stripe Products + Prices. Safe
// to re-run, but you'll get a new set of IDs each time — just paste
// the latest output into Netlify and trigger a deploy.

const PLANS = [
  { id: "starter", label: "Starter", monthly: 99,  annual: 899  },
  { id: "pro",     label: "Pro",     monthly: 299, annual: 2699 },
  { id: "elite",   label: "Elite",   monthly: 699, annual: 6299 },
];

const STRIPE_BASE = "https://api.stripe.com/v1";

async function stripe(path: string, body: URLSearchParams) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")!}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path}: ${json?.error?.message || res.status}`);
  return json;
}

Deno.serve(async () => {
  try {
    const out: Record<string, string> = {};
    for (const p of PLANS) {
      const product = await stripe(
        "/products",
        new URLSearchParams({
          name: `RGossips ${p.label}`,
          "metadata[plan]": p.id,
        })
      );

      const monthlyPrice = await stripe(
        "/prices",
        new URLSearchParams({
          product: product.id,
          currency: "inr",
          unit_amount: String(p.monthly * 100),
          "recurring[interval]": "month",
          "metadata[plan]": p.id,
          "metadata[cycle]": "monthly",
        })
      );

      const annualPrice = await stripe(
        "/prices",
        new URLSearchParams({
          product: product.id,
          currency: "inr",
          unit_amount: String(p.annual * 100),
          "recurring[interval]": "year",
          "metadata[plan]": p.id,
          "metadata[cycle]": "annual",
        })
      );

      out[`NEXT_PUBLIC_STRIPE_PRICE_${p.id.toUpperCase()}_MONTHLY`] = monthlyPrice.id;
      out[`NEXT_PUBLIC_STRIPE_PRICE_${p.id.toUpperCase()}_ANNUAL`]  = annualPrice.id;
    }
    return new Response(JSON.stringify({ ok: true, env: out }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
