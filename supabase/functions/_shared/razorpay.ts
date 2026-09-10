// Razorpay credential resolution, with a server-decided test-mode override.
//
// WHY THIS EXISTS
// Local development and production share one Supabase project, so the edge
// functions have exactly one set of secrets between them. Once
// RAZORPAY_KEY_ID/SECRET hold live keys, every local `next dev` session
// transacts against live Razorpay too — there is no second project to point
// at. This module carves out an exception for named developer accounts.
//
// THE SAFETY PROPERTY, and why it is shaped this way
// The client NEVER gets to ask for test mode. If it could, anyone could open
// checkout in test mode, "pay" with a test card and receive a real
// subscription. Mode is derived on the server from the AUTHENTICATED user id
// against an allowlist that only exists in Supabase secrets. A caller who is
// not on the list cannot reach the test keys by any request they can make.
//
// Because mode is a property of the USER, it is stable across a transaction's
// whole life: a test user's subscriptions, orders and payouts are always
// created, read back and reconciled with the same keys. The one caller with
// no user to derive from is the webhook — see verifyWebhookSignature below,
// which recovers the mode from whichever secret validates the signature.
//
// Getting the mode wrong fails closed rather than losing money: a test-mode
// order simply is not found with live keys, which surfaces as an error.
//
// SECRETS
//   RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET            — primary (live in prod)
//   RAZORPAY_WEBHOOK_SECRET                          — primary webhook secret
//   RAZORPAY_TEST_KEY_ID / RAZORPAY_TEST_KEY_SECRET  — test-mode override
//   RAZORPAY_TEST_WEBHOOK_SECRET                     — test-mode webhook secret
//   RAZORPAY_TEST_USER_IDS                           — comma-separated uuids
//
// With no test secrets set, every function behaves exactly as before: the
// primary credentials, for everyone. That is the safe default and is what
// production runs when no developer accounts are enrolled.

export type RzpMode = "primary" | "test";

export interface RzpCreds {
  keyId: string;
  keySecret: string;
  mode: RzpMode;
}

function readCreds(mode: RzpMode): RzpCreds | null {
  const prefix = mode === "test" ? "RAZORPAY_TEST_" : "RAZORPAY_";
  const keyId = Deno.env.get(`${prefix}KEY_ID`);
  const keySecret = Deno.env.get(`${prefix}KEY_SECRET`);
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, mode };
}

/** Is this user enrolled for test-mode payments? Server-side only. */
export function isTestUser(userId?: string | null): boolean {
  if (!userId) return false;
  const raw = Deno.env.get("RAZORPAY_TEST_USER_IDS") || "";
  const wanted = String(userId).trim().toLowerCase();
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(wanted);
}

/**
 * Credentials to use when acting on behalf of `userId`.
 *
 * Pass the user who OWNS the transaction, not necessarily the caller: for a
 * brand funding escrow that is the brand, for a payout it is the creator.
 * Falls back to the primary credentials whenever the user is not enrolled or
 * the test secrets are absent.
 */
export function razorpayCreds(userId?: string | null): RzpCreds | null {
  if (isTestUser(userId)) {
    const test = readCreds("test");
    if (test) return test;
    // Enrolled but unconfigured — fall through to primary rather than fail.
    console.warn("razorpay: test user with no RAZORPAY_TEST_* secrets set");
  }
  return readCreds("primary");
}

/** Credentials for an explicit mode — used by the webhook once it knows one. */
export function razorpayCredsForMode(mode: RzpMode): RzpCreds | null {
  return readCreds(mode);
}

/**
 * Test-mode Razorpay plan id for a tier + cycle, or null.
 *
 * Razorpay plans are scoped to a mode: a live plan id does not exist in test
 * mode and vice versa. The browser sends the plan id it was BUILT with —
 * live ids, baked into the bundle from the deploy host's env — so an
 * allowlisted developer would send a live id to a server holding test keys
 * and Razorpay would answer "plan not found". Their subscriptions would be
 * the one thing the allowlist broke.
 *
 * So for test mode the server ignores the client's id and resolves its own.
 * One JSON secret rather than six flat ones, because these six values only
 * ever change together:
 *
 *   RAZORPAY_TEST_PLAN_IDS={"starter":{"monthly":"plan_x","annual":"plan_y"},…}
 *
 * Unset or malformed returns null and the caller keeps the client's id —
 * which is correct for live mode and, for a misconfigured test account,
 * fails loudly at Razorpay rather than silently charging the wrong plan.
 */
export function testPlanId(plan: string, cycle: string): string | null {
  const raw = Deno.env.get("RAZORPAY_TEST_PLAN_IDS");
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, Record<string, string>>;
    const id = map?.[String(plan).toLowerCase()]?.[String(cycle).toLowerCase()];
    return id ? String(id) : null;
  } catch {
    console.error("razorpay: RAZORPAY_TEST_PLAN_IDS is not valid JSON");
    return null;
  }
}

export function rzpAuthHeader(creds: RzpCreds): string {
  return `Basic ${btoa(`${creds.keyId}:${creds.keySecret}`)}`;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}

/** Length-independent constant-time compare of two hex digests. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify a webhook signature against BOTH configured secrets and report which
 * one matched.
 *
 * The webhook is the one entry point with no authenticated user to derive a
 * mode from — Razorpay posts a signature and nothing else. Two dashboards
 * (test and live) can therefore point at the same endpoint, and the secret
 * that validates tells us which one sent it, so any Razorpay API call made
 * while handling the event uses matching credentials.
 *
 * Both secrets are always tried, and the result is combined without
 * short-circuiting, so the work done does not depend on which one matched.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<{ ok: boolean; mode: RzpMode | null }> {
  const primary = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const test = Deno.env.get("RAZORPAY_TEST_WEBHOOK_SECRET");
  if (!primary && !test) return { ok: false, mode: null };
  if (!signature) return { ok: false, mode: null };

  let primaryOk = false;
  let testOk = false;
  if (primary) primaryOk = timingSafeEqualHex(await hmacHex(primary, rawBody), signature);
  if (test) testOk = timingSafeEqualHex(await hmacHex(test, rawBody), signature);

  if (primaryOk) return { ok: true, mode: "primary" };
  if (testOk) return { ok: true, mode: "test" };
  return { ok: false, mode: null };
}
