/**
 * Razorpay test-mode allowlist — the safety property, pinned.
 *
 * Local dev and production share one Supabase project, so the edge functions
 * have a single set of secrets. `_shared/razorpay.ts` lets named developer
 * accounts transact against test keys while everyone else is live.
 *
 * The property that MUST hold is that mode is decided by the server from an
 * authenticated user id, never by anything the client can send. If a caller
 * could ask for test mode, they could "pay" with a test card and receive a
 * real subscription. These tests are the standing proof of that, plus the two
 * failure modes that would quietly send live traffic to test keys (or the
 * reverse): an unset allowlist, and an enrolled user with no test secrets.
 */
import { assertEquals } from "jsr:@std/assert@1";
import {
  isTestUser,
  razorpayCreds,
  razorpayCredsForMode,
  verifyWebhookSignature,
} from "../supabase/functions/_shared/razorpay.ts";

const DEV = "aaaaaaaa-0000-0000-0000-000000000001";
const CUSTOMER = "bbbbbbbb-0000-0000-0000-000000000002";

const ENV_KEYS = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_TEST_KEY_ID",
  "RAZORPAY_TEST_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_TEST_WEBHOOK_SECRET",
  "RAZORPAY_TEST_USER_IDS",
];

// MUST await fn() inside the try. `return fn()` would settle the try block
// the moment the promise is CREATED, tearing the environment down before any
// async assertion inside it runs — which is exactly what happened first time
// and made the signature tests read as if HMAC had matched the wrong secret.
async function withEnv(vars: Record<string, string | null>, fn: () => void | Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) saved[k] = Deno.env.get(k);
  for (const k of ENV_KEYS) Deno.env.delete(k);
  for (const [k, v] of Object.entries(vars)) if (v !== null) Deno.env.set(k, v);
  try {
    await fn();
  } finally {
    for (const k of ENV_KEYS) {
      Deno.env.delete(k);
      if (saved[k] !== undefined) Deno.env.set(k, saved[k]!);
    }
  }
}

const LIVE = { RAZORPAY_KEY_ID: "rzp_live_x", RAZORPAY_KEY_SECRET: "live_secret" };
const TEST = { RAZORPAY_TEST_KEY_ID: "rzp_test_x", RAZORPAY_TEST_KEY_SECRET: "test_secret" };

Deno.test("with no allowlist configured, everyone gets the primary keys", async () => {
  await withEnv({ ...LIVE, ...TEST }, () => {
    assertEquals(razorpayCreds(DEV)?.keyId, "rzp_live_x");
    assertEquals(razorpayCreds(CUSTOMER)?.keyId, "rzp_live_x");
    assertEquals(isTestUser(DEV), false);
  });
});

Deno.test("an enrolled user gets test keys; everyone else stays live", async () => {
  await withEnv({ ...LIVE, ...TEST, RAZORPAY_TEST_USER_IDS: DEV }, () => {
    assertEquals(razorpayCreds(DEV)?.keyId, "rzp_test_x");
    assertEquals(razorpayCreds(DEV)?.mode, "test");
    assertEquals(razorpayCreds(CUSTOMER)?.keyId, "rzp_live_x");
    assertEquals(razorpayCreds(CUSTOMER)?.mode, "primary");
  });
});

Deno.test("an anonymous / unknown caller can never reach the test keys", async () => {
  await withEnv({ ...LIVE, ...TEST, RAZORPAY_TEST_USER_IDS: DEV }, () => {
    // No user id at all — the case a forged or unauthenticated request lands in.
    assertEquals(razorpayCreds(null)?.keyId, "rzp_live_x");
    assertEquals(razorpayCreds(undefined)?.keyId, "rzp_live_x");
    assertEquals(razorpayCreds("")?.keyId, "rzp_live_x");
    assertEquals(isTestUser(null), false);
  });
});

Deno.test("allowlist parsing tolerates spacing and case, and does not match by prefix", async () => {
  await withEnv({ ...LIVE, ...TEST, RAZORPAY_TEST_USER_IDS: ` ${DEV.toUpperCase()} , , ${CUSTOMER} ` }, () => {
    assertEquals(isTestUser(DEV), true);
    assertEquals(isTestUser(CUSTOMER), true);
    // A prefix of an enrolled id must NOT be treated as enrolled.
    assertEquals(isTestUser(DEV.slice(0, 12)), false);
  });
});

Deno.test("enrolled but with no test secrets falls back to primary rather than failing", async () => {
  await withEnv({ ...LIVE, RAZORPAY_TEST_USER_IDS: DEV }, () => {
    // Half-configured is the likeliest operator mistake. Live keys are the
    // safe answer: the developer sees real charges and notices immediately,
    // whereas returning null would break checkout for a real customer if the
    // allowlist ever held the wrong id.
    assertEquals(razorpayCreds(DEV)?.keyId, "rzp_live_x");
    assertEquals(razorpayCreds(DEV)?.mode, "primary");
  });
});

Deno.test("missing primary credentials report null instead of a partial object", async () => {
  await withEnv({ RAZORPAY_KEY_ID: "rzp_live_x" }, () => {
    assertEquals(razorpayCreds(CUSTOMER), null);
    assertEquals(razorpayCredsForMode("primary"), null);
  });
});

// --- webhook signature: recovering mode from whichever secret validates ---

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.test("webhook signature identifies which dashboard sent the event", async () => {
  const body = JSON.stringify({ event: "subscription.charged" });
  await withEnv(
    { RAZORPAY_WEBHOOK_SECRET: "live_hook", RAZORPAY_TEST_WEBHOOK_SECRET: "test_hook" },
    async () => {
      assertEquals(await verifyWebhookSignature(body, await sign("live_hook", body)), {
        ok: true,
        mode: "primary",
      });
      assertEquals(await verifyWebhookSignature(body, await sign("test_hook", body)), {
        ok: true,
        mode: "test",
      });
      assertEquals(await verifyWebhookSignature(body, await sign("wrong", body)), {
        ok: false,
        mode: null,
      });
    },
  );
});

Deno.test("webhook refuses when unsigned, empty-signed, or unconfigured", async () => {
  const body = "{}";
  await withEnv({ RAZORPAY_WEBHOOK_SECRET: "live_hook" }, async () => {
    assertEquals(await verifyWebhookSignature(body, ""), { ok: false, mode: null });
  });
  // No secrets at all must refuse everything — never accept-by-default.
  await withEnv({}, async () => {
    assertEquals(await verifyWebhookSignature(body, await sign("anything", body)), {
      ok: false,
      mode: null,
    });
  });
});

Deno.test("a body tampered with after signing is rejected", async () => {
  await withEnv({ RAZORPAY_WEBHOOK_SECRET: "live_hook" }, async () => {
    const signed = await sign("live_hook", JSON.stringify({ amount: 100 }));
    const tampered = JSON.stringify({ amount: 999999 });
    assertEquals(await verifyWebhookSignature(tampered, signed), { ok: false, mode: null });
  });
});
