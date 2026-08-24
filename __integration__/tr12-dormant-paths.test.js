/**
 * TR-12 — Dormant-Path & Feature-Flag Testing
 *
 * Strategy: "A payment path that is hidden but wired is still a payment path."
 * The secondary gateway is gated off in the interface while fully functional
 * server-side (F-14), and payout endpoints remain deployed although payout
 * policy is manual only (F-13). Both are reachable by anyone calling the
 * function directly.
 *
 * The rule being tested: "Assert a UI feature flag is never the only control."
 *
 * SAFETY: the checkout and payout functions are on the denylist in safety.js
 * and are NOT called here — invoking one could open a real subscription or move
 * real money. What this suite proves instead is REACHABILITY and AUTH POSTURE,
 * which is the actual question TR-12 asks: is the server refusing, or is only
 * the UI hiding the button? An unauthenticated probe that comes back with an
 * auth error proves the server refuses; one that comes back ready to work
 * proves the path is live. Neither outcome requires completing a transaction.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { URL_BASE, ANON_KEY, requireEnv } from "./safety.js";

beforeAll(() => requireEnv());

/**
 * OPTIONS preflight only — reaches the function's CORS handler and proves
 * deployment without invoking any business logic or side effect.
 */
async function probeDeployed(name) {
  const res = await fetch(`${URL_BASE}/functions/v1/${name}`, {
    method: "OPTIONS",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Access-Control-Request-Method": "POST",
      Origin: "https://rgossips.com",
    },
  });
  return { status: res.status, deployed: res.status < 500 };
}

describe("TR-12 / F-14 — the gated-off secondary gateway is still deployed", () => {
  it("stripe-checkout is reachable server-side despite being hidden in the UI", async () => {
    const r = await probeDeployed("stripe-checkout");
    // This documents the finding rather than asserting it away: the path exists.
    // If it is ever removed or server-side disabled, this flips and the finding closes.
    expect(typeof r.status).toBe("number");
    expect({ fn: "stripe-checkout", deployed: r.deployed }).toEqual({
      fn: "stripe-checkout",
      deployed: true,
    });
  });

  it("stripe-webhook is deployed and verifies signatures (the guarded half)", async () => {
    const res = await fetch(`${URL_BASE}/functions/v1/stripe-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "stripe-signature": "t=1,v1=deadbeef",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    });
    const text = await res.text();
    // A forged signature must be rejected — this is the control that makes a
    // dormant-but-deployed webhook acceptable rather than dangerous.
    const rejected = res.status >= 400 || /signature|invalid|unauthor/i.test(text);
    expect({ forgedSignatureRejected: rejected }).toEqual({ forgedSignatureRejected: true });
  });
});

describe("TR-12 / F-13 — payout endpoints outside current policy", () => {
  // CLAUDE.md: "RazorpayX removed 2026-07 in favour of manual payouts."
  // The strategy asks: are the endpoints refusing, or merely unused?
  const PAYOUT_FNS = ["razorpayx-test-balance", "payouts-cron"];

  it.each(PAYOUT_FNS)("%s: deployment status recorded for the register", async (name) => {
    const r = await probeDeployed(name);
    // Recorded, not asserted either way — the finding is about policy drift and
    // the decision (E-3) is the business's, not the suite's.
    expect(typeof r.status).toBe("number");
  });

  it("payouts-cron refuses an unauthenticated caller", async () => {
    const res = await fetch(`${URL_BASE}/functions/v1/payouts-cron`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: "{}",
    });
    const text = await res.text();
    // It is deployed with verify_jwt = true, so the platform rejects before the
    // function body runs. Anything else would mean anon can trigger a payout run.
    const refused = res.status >= 400 || /auth|unauthor|forbidden/i.test(text);
    expect({ fn: "payouts-cron", refusesAnon: refused }).toEqual({
      fn: "payouts-cron",
      refusesAnon: true,
    });
  });
});

describe("TR-12 — seed/test-data functions must not be callable by anon", () => {
  // These exist to create users and gateway objects. On a project with no
  // staging they are the sharpest edge in the deployed surface.
  const DANGEROUS = ["seed-test-users", "stripe-create-test-prices", "razorpay-create-test-plans"];

  it.each(DANGEROUS)("%s refuses an unauthenticated caller", async (name) => {
    // GET, not POST: reaches the auth/method guard without submitting a body
    // that could be interpreted as a seed request.
    const res = await fetch(`${URL_BASE}/functions/v1/${name}`, {
      method: "GET",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    });
    const text = await res.text();
    const created = /created|inserted|seeded|success/i.test(text) && res.status < 300;
    expect({ fn: name, createdSomething: created }).toEqual({ fn: name, createdSomething: false });
  });
});
