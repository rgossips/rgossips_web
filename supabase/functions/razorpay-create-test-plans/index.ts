// One-shot: provisions the 6 test-mode Razorpay Subscription Plans
// (3 tiers × monthly + annual) and returns their IDs. Mirrors
// stripe-create-test-prices but for Razorpay.
//
// Amounts mirror PLAN_PRICING in src/lib/plans.js:
//   Starter  ₹99/mo   ₹899/yr
//   Pro      ₹299/mo  ₹2699/yr
//   Elite    ₹699/mo  ₹6299/yr

const PLANS = [
  { id: "starter", label: "Starter", monthly: 99,  annual: 899  },
  { id: "pro",     label: "Pro",     monthly: 299, annual: 2699 },
  { id: "elite",   label: "Elite",   monthly: 699, annual: 6299 },
];

async function rzp(path: string, body: any) {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const res = await fetch(`https://api.razorpay.com${path}`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${keyId}:${secret}`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Razorpay ${path}: ${json?.error?.description || res.status}`);
  return json;
}

Deno.serve(async () => {
  try {
    const out: Record<string, string> = {};
    for (const p of PLANS) {
      const monthly = await rzp("/v1/plans", {
        period: "monthly",
        interval: 1,
        item: {
          name: `RGossips ${p.label}`,
          amount: p.monthly * 100,  // paise
          currency: "INR",
        },
        notes: { plan: p.id, cycle: "monthly" },
      });

      const annual = await rzp("/v1/plans", {
        period: "yearly",
        interval: 1,
        item: {
          name: `RGossips ${p.label}`,
          amount: p.annual * 100,
          currency: "INR",
        },
        notes: { plan: p.id, cycle: "annual" },
      });

      out[`NEXT_PUBLIC_RAZORPAY_PLAN_${p.id.toUpperCase()}_MONTHLY`] = monthly.id;
      out[`NEXT_PUBLIC_RAZORPAY_PLAN_${p.id.toUpperCase()}_ANNUAL`]  = annual.id;
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
