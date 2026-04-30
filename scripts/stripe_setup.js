/**
 * One-shot Stripe setup script for RGossips influencer plans.
 * Creates 3 products (Starter / Pro / Elite) × 2 prices (monthly / annual)
 * and prints the env vars to add to .env.local + Netlify.
 *
 * Run via:  node scripts/stripe_setup.js <STRIPE_KEY>
 */

const SK = process.argv[2];
if (!SK) {
  console.error("Usage: node scripts/stripe_setup.js <STRIPE_SECRET_KEY>");
  process.exit(1);
}

const PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    description: "RGossips Starter — Listed in brand search, 3 applications/month, basic analytics",
    monthly: 9900,   // ₹99
    annual: 89900,   // ₹899
  },
  {
    key: "PRO",
    name: "Pro",
    description: "RGossips Pro — Priority placement, 15 applications/month, advanced analytics, audience insights",
    monthly: 29900,  // ₹299
    annual: 269900,  // ₹2699
  },
  {
    key: "ELITE",
    name: "Elite",
    description: "RGossips Elite — Featured placement, unlimited applications, deep audience analytics, dedicated manager",
    monthly: 69900,  // ₹699
    annual: 629900,  // ₹6299
  },
];

async function stripe(path, body) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === "object" && v !== null) {
      for (const [k2, v2] of Object.entries(v)) {
        params.append(`${k}[${k2}]`, String(v2));
      }
    } else {
      params.append(k, String(v));
    }
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${SK}:`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${path} → ${data.error.message}`);
  return data;
}

(async () => {
  const ids = {};
  for (const plan of PLANS) {
    process.stdout.write(`Creating ${plan.name}… `);
    const product = await stripe("/products", {
      name: plan.name,
      description: plan.description,
      metadata: { plan: plan.key.toLowerCase() },
    });
    console.log(product.id);

    process.stdout.write(`  Monthly price (₹${plan.monthly / 100})… `);
    const m = await stripe("/prices", {
      product: product.id,
      unit_amount: plan.monthly,
      currency: "inr",
      recurring: { interval: "month" },
      nickname: `${plan.name} Monthly`,
    });
    ids[`${plan.key}_MONTHLY`] = m.id;
    console.log(m.id);

    process.stdout.write(`  Annual price (₹${plan.annual / 100})… `);
    const a = await stripe("/prices", {
      product: product.id,
      unit_amount: plan.annual,
      currency: "inr",
      recurring: { interval: "year" },
      nickname: `${plan.name} Annual`,
    });
    ids[`${plan.key}_ANNUAL`] = a.id;
    console.log(a.id);
  }

  console.log("\n=== Add these to .env.local AND Netlify env ===");
  for (const k of Object.keys(ids)) {
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_${k}=${ids[k]}`);
  }
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
