// Unified subscription invoice history across Stripe + Razorpay.
//
// Each upgrade creates a fresh gateway customer (Razorpay especially —
// since we send the customer's empty email/contact on create, fail_existing
// can't match a prior record). The profile only stores the *latest*
// customer id on each side, which is why filtering by customer_id missed
// every historical invoice.
//
// Instead, list all subscriptions on each gateway and filter to those
// whose notes.user_id / metadata.user_id matches the requester, then
// fetch invoices per matching subscription. Page through up to 1000
// subscriptions per gateway — plenty for any single creator's lifetime.
//
// Body: { userId: string }
// Returns:
//   { invoices: Invoice[] }
//
// Invoice = {
//   id, gateway, number, plan, cycle, amount, currency, status,
//   created_at, paid_at, pdf_url, hosted_url, subscription_id
// }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// ── Razorpay helpers ───────────────────────────────────────────────────

async function razorpaySubscriptionsForUser(auth: string, userId: string) {
  // /v1/subscriptions is paginated by count + skip; we walk up to 1000
  // (10 pages of 100) and filter notes.user_id client-side.
  const matched: any[] = [];
  for (let skip = 0; skip < 1000; skip += 100) {
    const u = `https://api.razorpay.com/v1/subscriptions?count=100&skip=${skip}`;
    const res = await fetch(u, { headers: { Authorization: auth } });
    if (!res.ok) {
      console.error("Razorpay /subscriptions list failed:", res.status, await res.text());
      break;
    }
    const body = await res.json();
    const items: any[] = Array.isArray(body?.items) ? body.items : [];
    for (const s of items) {
      const notes = s.notes || {};
      if (String(notes.user_id || "") === userId) matched.push(s);
    }
    if (items.length < 100) break; // last page
  }
  return matched;
}

async function razorpayInvoicesForSubscription(auth: string, subscriptionId: string) {
  const u = `https://api.razorpay.com/v1/invoices?subscription_id=${encodeURIComponent(subscriptionId)}&count=100`;
  const res = await fetch(u, { headers: { Authorization: auth } });
  if (!res.ok) {
    console.error("Razorpay /invoices list failed:", res.status, await res.text());
    return [];
  }
  const body = await res.json();
  return Array.isArray(body?.items) ? body.items : [];
}

// ── Stripe helpers ─────────────────────────────────────────────────────

async function stripeListAll(url: string, key: string) {
  const out: any[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 10; page += 1) {
    const u = cursor ? `${url}&starting_after=${encodeURIComponent(cursor)}` : url;
    const res = await fetch(u, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      console.error("Stripe list failed:", res.status, await res.text());
      break;
    }
    const body = await res.json();
    const data: any[] = Array.isArray(body?.data) ? body.data : [];
    out.push(...data);
    if (!body?.has_more || data.length === 0) break;
    cursor = data[data.length - 1].id;
  }
  return out;
}

async function stripeSubscriptionsForUser(key: string, userId: string) {
  // Stripe's /v1/subscriptions doesn't support filtering by metadata
  // directly; we list all and filter client-side. status=all so we get
  // cancelled subs too — that's the whole point of a history view.
  const all = await stripeListAll(
    "https://api.stripe.com/v1/subscriptions?limit=100&status=all",
    key
  );
  return all.filter((s) => String(s.metadata?.user_id || "") === userId);
}

async function stripeInvoicesForSubscription(key: string, subscriptionId: string) {
  return await stripeListAll(
    `https://api.stripe.com/v1/invoices?limit=100&subscription=${encodeURIComponent(subscriptionId)}`,
    key
  );
}

// ── main ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const out: any[] = [];

    // ── Razorpay ─────────────────────────────────────────────────────
    // Razorpay subscription statuses we treat as "currently billing":
    //   active = paying & will renew, authenticated = first auth done
    //   (about to charge), created = waiting for first auth.
    // Anything else (cancelled / completed / halted / expired / paused)
    // we surface as "cancelled" for display purposes.
    const RZP_ACTIVE_STATUSES = new Set(["active", "authenticated", "created"]);

    const rzpKey = Deno.env.get("RAZORPAY_KEY_ID");
    const rzpSecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (rzpKey && rzpSecret) {
      try {
        const auth = `Basic ${btoa(`${rzpKey}:${rzpSecret}`)}`;
        const subs = await razorpaySubscriptionsForUser(auth, userId);
        for (const sub of subs) {
          const notes = sub.notes || {};
          const plan = notes.plan || null;
          const cycle = notes.cycle || null;
          const subStatus = String(sub.status || "").toLowerCase();
          const isActive = RZP_ACTIVE_STATUSES.has(subStatus);
          // charge_at is the *next* billing date for an active sub. If
          // the sub is cancelled this is null/zero.
          const nextChargeAt = isActive ? (sub.charge_at || sub.current_end || null) : null;

          const invs = await razorpayInvoicesForSubscription(auth, sub.id);
          for (const inv of invs) {
            out.push({
              id: inv.id,
              subscription_id: sub.id,
              subscription_status: isActive ? "active" : "cancelled",
              next_charge_at: nextChargeAt,
              gateway: "razorpay",
              number: inv.invoice_number || inv.receipt || inv.id,
              plan,
              cycle,
              amount: inv.amount_paid ?? inv.amount ?? 0, // paise
              currency: (inv.currency || "INR").toLowerCase(),
              status: String(inv.status || "").toLowerCase(),
              created_at: inv.issued_at || inv.date || inv.created_at || 0,
              paid_at: inv.paid_at || null,
              pdf_url: null,
              hosted_url: inv.short_url || null,
            });
          }
        }
      } catch (e) {
        console.error("Razorpay history fetch failed:", (e as any)?.message);
      }
    }

    // ── Stripe ───────────────────────────────────────────────────────
    // Stripe subscription statuses we treat as "currently billing":
    //   active / trialing / past_due — these still renew. Anything else
    //   (canceled / unpaid / incomplete / incomplete_expired) is dead.
    const STRIPE_ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const subs = await stripeSubscriptionsForUser(stripeKey, userId);
        for (const sub of subs) {
          const plan = sub.metadata?.plan || null;
          const cycle = sub.metadata?.cycle || sub.items?.data?.[0]?.plan?.interval || null;
          const subStatus = String(sub.status || "").toLowerCase();
          const isActive = STRIPE_ACTIVE_STATUSES.has(subStatus) && !sub.cancel_at_period_end;
          const nextChargeAt = isActive ? (sub.current_period_end || null) : null;

          const invs = await stripeInvoicesForSubscription(stripeKey, sub.id);
          for (const inv of invs) {
            const line = inv.lines?.data?.[0];
            const planNickname = plan || line?.price?.nickname || line?.plan?.nickname || null;
            out.push({
              id: inv.id,
              subscription_id: sub.id,
              subscription_status: isActive ? "active" : "cancelled",
              next_charge_at: nextChargeAt,
              gateway: "stripe",
              number: inv.number || inv.id,
              plan: planNickname,
              cycle,
              amount: inv.amount_paid ?? inv.amount_due ?? 0, // minor units
              currency: (inv.currency || "inr").toLowerCase(),
              status: inv.status,
              created_at: inv.created || 0,
              paid_at: inv.status_transitions?.paid_at || null,
              pdf_url: inv.invoice_pdf || null,
              hosted_url: inv.hosted_invoice_url || null,
            });
          }
        }
      } catch (e) {
        console.error("Stripe history fetch failed:", (e as any)?.message);
      }
    }

    // Newest first, cap at 10 most recent — anything older is rarely
    // useful in the UI; if we ever need older history we can add a
    // server-side offset param.
    out.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    const trimmed = out.slice(0, 10);
    return new Response(JSON.stringify({ invoices: trimmed }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + ((err as any)?.message || String(err)),
        invoices: [],
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
