/**
 * TR-01 / TR-14 — reward-credit and referral guards, offline.
 *
 * This is the layer the strategy cares about most and the one nothing could
 * reach before: escrow, ledger and referral logic lives in Deno edge functions
 * that Jest cannot import, and `src/lib` contains no money code at all. Running
 * these guards against the live project is not an option — qualifying a referral
 * writes a ledger row. So they run here, offline, against a scripted database.
 *
 * Assertions: A-18 (rolling daily cap routes to manual review), A-19 (referral
 * attribution guards), plus the REWARD_BY_PLAN table and the idempotency
 * short-circuit that makes a re-delivered webhook a no-op.
 *
 * Run: deno test --allow-none __deno__/
 */
import { assertEquals, assertExists } from "jsr:@std/assert@1";
import {
  REWARD_BY_PLAN,
  ensureReferralCode,
  qualifyReferralIfEligible,
} from "../supabase/functions/_shared/referrals.ts";
import { makeStub, updateTo } from "./_stub.ts";

// deno-lint-ignore no-explicit-any
type AnyClient = any;

const REFERRER = "11111111-1111-1111-1111-111111111111";
const REFEREE = "22222222-2222-2222-2222-222222222222";
const EVENT = "sub_test_event_1";

/** An open referral row awaiting qualification. */
const openReferral = {
  id: "ref-1",
  referrer_id: REFERRER,
  referee_id: REFEREE,
  status: "SIGNED_UP",
  qualifying_event_id: null,
};

/** A referrer whose subscription is live — the strict eligibility requirement. */
const activeReferrer = {
  subscription_plan: "pro",
  stripe_subscription_id: "sub_123",
  razorpay_subscription_id: null,
};

Deno.test("REWARD_BY_PLAN matches the locked Phase 0 decision (50/150/300)", () => {
  assertEquals(REWARD_BY_PLAN.starter, 50);
  assertEquals(REWARD_BY_PLAN.pro, 150);
  assertEquals(REWARD_BY_PLAN.elite, 300);
});

Deno.test("no open referral → no reward, no write", async () => {
  const db = makeStub({ tables: { referrals: [] } }) as AnyClient;
  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });
  assertEquals(r.ok, false);
  assertEquals(r.reason, "no_open_referral");
  assertEquals(db.calls.length, 0); // nothing touched
});

Deno.test("A-17 idempotency: the same qualifying event twice is a no-op", async () => {
  const db = makeStub({
    tables: { referrals: [[{ ...openReferral, qualifying_event_id: EVENT }]] },
  }) as AnyClient;
  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });
  assertEquals(r.ok, false);
  assertEquals(r.reason, "already_qualified");
  // The important half: a re-delivered webhook must not write a second reward.
  assertEquals(db.calls.length, 0);
});

Deno.test("A-19 referrer cancelled before qualification → REVERSED, earns nothing", async () => {
  const db = makeStub({
    tables: {
      referrals: [[openReferral]],
      influencer_profiles: [[{ subscription_plan: "trial" }]], // not an active paid plan
    },
  }) as AnyClient;

  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });

  assertEquals(r.ok, false);
  assertEquals(r.reason, "referrer_cancelled");
  const patch = updateTo(db, "referrals");
  assertExists(patch);
  assertEquals(patch!.status, "REVERSED");
  // No ledger row: the referee keeps their welcome discount, the referrer earns nothing.
  assertEquals(db.calls.filter((c: { table: string }) => c.table === "reward_credits_ledger").length, 0);
});

Deno.test("A-19 referrer with no gateway subscription id is not 'active'", async () => {
  const db = makeStub({
    tables: {
      referrals: [[openReferral]],
      // A plan string alone is not enough — the strict check needs a gateway id.
      influencer_profiles: [[{ subscription_plan: "pro", stripe_subscription_id: null, razorpay_subscription_id: null }]],
    },
  }) as AnyClient;

  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });
  assertEquals(r.reason, "referrer_cancelled");
});

Deno.test("A-18 daily cap: the 6th reward in 24h routes to MANUAL_REVIEW, not a payout", async () => {
  const db = makeStub({
    tables: {
      referrals: [[openReferral]],
      influencer_profiles: [[activeReferrer]],
    },
    counts: { referrals: 5 }, // DAILY_CAP is 5 — this request is the 6th
  }) as AnyClient;

  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });

  assertEquals(r.ok, false);
  assertEquals(r.reason, "daily_cap_hit");
  const patch = updateTo(db, "referrals");
  assertEquals(patch!.status, "MANUAL_REVIEW");
  // The cap must not silently drop the referral — an admin can still approve it.
  assertEquals(patch!.qualifying_event_id, EVENT);
});

Deno.test("daily cap boundary: the 5th reward is still allowed", async () => {
  const db = makeStub({
    tables: {
      referrals: [[openReferral]],
      influencer_profiles: [[activeReferrer]],
      v_reward_credits_balance: [[{ balance: 0 }]],
    },
    counts: { referrals: 4 }, // 4 already rewarded → this is the 5th, at the cap
  }) as AnyClient;

  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "pro",
    qualifyingEventId: EVENT,
  });

  // At exactly the cap the reward proceeds; only ABOVE it does review kick in.
  assertEquals(r.reason !== "daily_cap_hit", true);
});

Deno.test("an unrecognised plan yields no reward rather than a zero-value ledger row", async () => {
  const db = makeStub({
    tables: {
      referrals: [[openReferral]],
      influencer_profiles: [[activeReferrer]],
    },
    counts: { referrals: 0 },
  }) as AnyClient;

  const r = await qualifyReferralIfEligible(db, {
    refereeId: REFEREE,
    refereePlan: "enterprise_unknown",
    qualifyingEventId: EVENT,
  });

  assertEquals(r.ok, false);
  assertEquals(r.reason, "unknown_plan");
  assertEquals(db.calls.filter((c: { table: string }) => c.table === "reward_credits_ledger").length, 0);
});

Deno.test("ensureReferralCode returns the existing code rather than minting a second", async () => {
  const db = makeStub({
    tables: { influencer_profiles: [[{ influencer_id: REFERRER, referral_code: "abc12345" }]] },
  }) as AnyClient;

  const code = await ensureReferralCode(db, REFERRER);
  assertEquals(code, "abc12345");
  assertEquals(db.calls.length, 0); // no write when one already exists
});

Deno.test("ensureReferralCode returns null for a profile that does not exist", async () => {
  const db = makeStub({ tables: { influencer_profiles: [[]] } }) as AnyClient;
  assertEquals(await ensureReferralCode(db, REFERRER), null);
});

Deno.test("ensureReferralCode mints an 8-char slug with no confusable characters", async () => {
  const db = makeStub({
    tables: { influencer_profiles: [[{ influencer_id: REFERRER, referral_code: null }]] },
  }) as AnyClient;

  const code = await ensureReferralCode(db, REFERRER);
  assertExists(code);
  assertEquals(code!.length, 8);
  // 0/O/1/l are excluded deliberately so a code can be read aloud or retyped.
  assertEquals(/[0O1l]/.test(code!), false);
});

Deno.test("ensureReferralCode retries on a unique-index collision", async () => {
  const db = makeStub({
    tables: { influencer_profiles: [[{ influencer_id: REFERRER, referral_code: null }]] },
    updateErrors: { influencer_profiles: [{ code: "23505" }, null] }, // collide once, then succeed
  }) as AnyClient;

  const code = await ensureReferralCode(db, REFERRER);
  assertExists(code);
  assertEquals(db.calls.filter((c: { op: string }) => c.op === "update").length, 2);
});

Deno.test("ensureReferralCode gives up on a non-collision error instead of looping", async () => {
  const db = makeStub({
    tables: { influencer_profiles: [[{ influencer_id: REFERRER, referral_code: null }]] },
    updateErrors: { influencer_profiles: [{ code: "42501", message: "denied" }] },
  }) as AnyClient;

  assertEquals(await ensureReferralCode(db, REFERRER), null);
  assertEquals(db.calls.filter((c: { op: string }) => c.op === "update").length, 1);
});
