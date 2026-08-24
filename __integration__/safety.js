/**
 * Shared HTTP helper + hard safety rail for every integration suite.
 *
 * These suites run against the LIVE Supabase project — `RGossips-dev`
 * (hlfevcdtbehukxrrgykv) is the only project on the account and it serves web,
 * admin and mobile. There is no staging. Master Test Strategy Table 8 assumes
 * five environments; we have two (local, production).
 *
 * Everything here is therefore restricted to calls that CANNOT change state:
 *   - reads that RLS is expected to deny (a denied read writes nothing),
 *   - guard paths that are refused before any insert,
 *   - bad-signature webhook paths that are rejected before any state change.
 *
 * A refused call is safe. A happy-path call is not. The denylist below turns
 * that from a convention the next author has to remember into an error they
 * cannot get past: `fn()` throws rather than issuing the request.
 *
 * Two of these are worse than merely mutating — `whatsapp-otp-sender` bills a
 * real WhatsApp conversation per send, and the checkout functions can open a
 * real subscription or order.
 */
import { expect } from "@jest/globals";

export const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** An id that exists nowhere, so every lookup misses and every guard refuses. */
export const BOGUS = "00000000-0000-0000-0000-000000000000";

/**
 * Functions that may create rows, charge money, or send a billable message.
 * Guard/negative paths against these are still allowed — see ALLOW_GUARDED —
 * because the call is refused before any effect.
 */
const MUTATING_DENYLIST = new Set([
  "whatsapp-otp-sender", // every send is a billable WhatsApp conversation
  "stripe-checkout",
  "razorpay-checkout",
  "razorpay-service-checkout",
  "service-payment-checkout",
  "escrow-fund",
  "escrow-release",
  "admin-escrow-resolve",
  "payouts-cron",
  "seed-test-users",
  "stripe-create-test-prices",
  "razorpay-create-test-plans",
  "send-email",
  "send-account-event-email",
  "send-welcome-message",
  "send-push",
  "upload-profile-photo",
  "upload-campaign-image",
  "submit-deliverables",
  "submit-quote-request",
  "submit-service-review",
  "request-revision",
  "register-payout-method",
  "register-push",
  "redeem-rc",
  "attribute-referral",
  "ensure-referral-code",
  "block-user",
  "report-content",
]);

/**
 * Calls to a denylisted function that are provably refused before any effect,
 * and are therefore explicitly permitted. Each entry must state WHY the call
 * cannot mutate. Keep this list short and justified.
 */
const ALLOW_GUARDED = new Map([
  // Refused at the auth check: no caller JWT means no blocker/reporter id, so
  // the function returns "Not signed in." before touching the table.
  ["block-user", "anon caller — refused at auth.getUser before any write"],
  ["report-content", "anon caller — refused at auth.getUser before any write"],
  // Refused at the ownership/state guard before any gateway order is created.
  ["escrow-fund", "bogus ids — refused at ownership/state guard, no order created"],
  ["escrow-release", "bogus ids — refused at ownership guard, no release"],
]);

/**
 * POST a Supabase edge function. Throws rather than call anything that could
 * mutate, unless the call is an explicitly justified guard path.
 *
 * @param {string} name    function slug
 * @param {object} body    JSON body
 * @param {object} opts    { headers, guarded, key }
 */
export async function fn(name, body = {}, opts = {}) {
  const { headers = {}, guarded = false, key = ANON_KEY } = opts;

  if (MUTATING_DENYLIST.has(name) && !guarded) {
    throw new Error(
      `SAFETY: "${name}" can mutate live state or bill money. ` +
        `Integration suites run against production. If this call is provably ` +
        `refused before any effect, pass { guarded: true } and add a justification ` +
        `to ALLOW_GUARDED in __integration__/safety.js.`,
    );
  }
  if (guarded && !ALLOW_GUARDED.has(name)) {
    throw new Error(
      `SAFETY: guarded call to "${name}" has no justification in ALLOW_GUARDED. ` +
        `State why it cannot mutate before allowing it.`,
    );
  }

  const res = await fetch(`${URL_BASE}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, body: json, text };
}

/**
 * Read a table through PostgREST as a given key.
 *
 * NOTE the documented trap: an RLS-denied SELECT returns `[]` with HTTP 200,
 * NOT an error. An empty array on a table you know holds rows is the policy
 * working, not an empty table. Assertions must not read `[]` as "no data".
 */
export async function rest(path, { key = ANON_KEY, method = "GET", body } = {}) {
  const init = {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, body: json, text };
}

/** Call a Postgres RPC as a given key. Used for the EXECUTE-grant audit. */
export async function rpc(name, args = {}, { key = ANON_KEY } = {}) {
  return rest(`rpc/${name}`, { key, method: "POST", body: args });
}

/**
 * True when PostgREST refused for lack of privilege.
 *
 * This is the differential that caught migration 059's open grant: a correctly
 * revoked function answers 42501/401, an open one answers 200. `[]` from a
 * SELECT means RLS denied it; `42501` from an RPC means EXECUTE was revoked.
 */
export function isPermissionDenied(r) {
  return r.status === 401 || r.status === 403 || r.body?.code === "42501";
}

/** Skip a suite cleanly when credentials are absent (CI without secrets). */
export function requireEnv() {
  if (!URL_BASE || !ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local",
    );
  }
}

/** Assert a response leaks no stack trace, DB identifier or internal path (TR-04). */
export function expectNonLeakingError(r) {
  const t = r.text || "";
  expect(t).not.toMatch(/at \w+ \(.*:\d+:\d+\)/); // stack frame
  expect(t).not.toMatch(/\/home\/deno|\/tmp\/user_fn_|file:\/\/\//); // internal path
  expect(t).not.toMatch(/postgres:\/\/|password=|service_role/i); // connection/role leak
}
