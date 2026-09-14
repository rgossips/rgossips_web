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
// Body: { userId: string } — but see the auth note below: for a normal
// caller this is IGNORED and the id comes from their JWT. It is honoured
// only for a service-role caller (reconcile-subscription).
// Returns:
//   { invoices: Invoice[] }
//
// Invoice = {
//   id, gateway, number, plan, cycle, amount, currency, status,
//   created_at, paid_at, pdf_url, hosted_url, subscription_id
// }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { razorpayCreds } from "../_shared/razorpay.ts";
import { log } from "../_shared/log.ts";
import { serveWithLogging } from "../_shared/serve.ts";
import { unverifiedJwtRole } from "../_shared/jwt.ts";

// True only for a caller holding the service role. Compares the key first,
// then falls back to exercising a service-role-only API — the string
// compare alone fails when the deployed env value and the caller's key are
// different representations of the same role, which is how the first cut of
// this gate locked reconcile-subscription out.
async function isServiceRoleCaller(bearer: string): Promise<boolean> {
  if (!bearer) return false;
  if (bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  // Nearly every caller is a creator's own session (or, from a stale client,
  // the publishable key). Neither can be the service role, and probing the
  // admin API with them is a guaranteed 401 — one wasted Auth request per
  // plan-card load, visible in the API logs. Rule them out without the call.
  // This can only ever say "no": a token claiming service_role still has to
  // pass the probe below.
  const role = unverifiedJwtRole(bearer);
  if (role === "authenticated" || role === "anon" || bearer.startsWith("sb_publishable_")) return false;
  try {
    const probe = createClient(Deno.env.get("SUPABASE_URL")!, bearer, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}

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

serveWithLogging("subscription-history", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedId = String(body?.userId || "");

    // Whose history this is.
    //
    // This used to be whatever `userId` the body said, with no auth at all —
    // so anyone holding a user id could read that person's billing history:
    // amounts, plans, invoice links. The ids are not secret (they appear in
    // notification payloads and admin exports), so this was effectively open.
    //
    // Now the id comes from the caller's own JWT and the body is ignored.
    // The one exception is a service-role caller — reconcile-subscription
    // runs server-to-server on behalf of a user and has no user token — and
    // the service role key never reaches a browser.
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let userId: string;

    if (await isServiceRoleCaller(token)) {
      if (!requestedId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      userId = requestedId;
    } else {
      const authed = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey, {
        auth: { persistSession: false },
      });
      const { data: userRes, error: userErr } = await authed.auth.getUser(token);
      const callerId = userRes?.user?.id || "";
      if (userErr || !callerId) {
        // Also the path a caller lands on when they send the publishable key
        // instead of a session token — which is what an anonymous prober has.
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: jsonHeaders,
        });
      }
      // Not an error — the clients all pass their own id, so a mismatch is
      // either a stale token or someone probing. Serve the caller's own
      // history either way, and record the mismatch.
      if (requestedId && requestedId !== callerId) {
        log.persistWarn("subscription_history.id_mismatch", {
          fn: "subscription-history",
          userId: callerId,
          requestedId,
        });
      }
      userId = callerId;
    }

    const out: any[] = [];

    // ── Razorpay ─────────────────────────────────────────────────────
    // Razorpay subscription statuses we treat as "currently billing":
    //   active = paying & will renew, authenticated = first auth done
    //   (about to charge), created = waiting for first auth.
    // Anything else (cancelled / completed / halted / expired / paused)
    // we surface as "cancelled" for display purposes.
    const RZP_ACTIVE_STATUSES = new Set(["active", "authenticated", "created"]);

    // Read a user's own history with the same keys that created it.
    const rzpCreds = razorpayCreds(userId);
    const rzpKey = rzpCreds?.keyId;
    const rzpSecret = rzpCreds?.keySecret;
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
