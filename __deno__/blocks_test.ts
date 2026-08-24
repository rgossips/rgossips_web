/**
 * TR-05 / TR-06 — block-aware discovery filtering, offline.
 *
 * Play's UGC policy and Apple Guideline 1.2 require a block to actually take
 * effect. `_shared/blocks.ts` is what enforces that across every list-* surface,
 * and it was deployed in the same pass that added migration 059.
 *
 * The behaviour worth pinning is the FAIL-OPEN choice at blocks.ts:30-48:
 * "discovery degrading to unfiltered beats discovery breaking outright". That is
 * a deliberate tradeoff, not an oversight — but it means a broken RPC silently
 * disables blocking, so it needs a test that says so out loud.
 */
import { assertEquals } from "jsr:@std/assert@1";
import { getBlockedIds, filterBlocked } from "../supabase/functions/_shared/blocks.ts";
import { makeStub } from "./_stub.ts";

// deno-lint-ignore no-explicit-any
type AnyClient = any;

const VIEWER = "aaaaaaaa-0000-0000-0000-000000000001";
const BLOCKED = "bbbbbbbb-0000-0000-0000-000000000002";

Deno.test("an anonymous viewer has no block set (and costs no query)", async () => {
  const db = makeStub({}) as AnyClient;
  assertEquals((await getBlockedIds(db, null)).size, 0);
  assertEquals((await getBlockedIds(db, undefined)).size, 0);
});

Deno.test("returns the union of both directions as a flat id set", async () => {
  const db = makeStub({ rpcs: { blocked_user_ids: { data: [BLOCKED] } } }) as AnyClient;
  const ids = await getBlockedIds(db, VIEWER);
  assertEquals(ids.has(BLOCKED), true);
  assertEquals(ids.size, 1);
});

Deno.test("handles the object row shape supabase-js may return for setof uuid", async () => {
  // The helper defends against a client-version change altering the shape;
  // if that defence regresses, blocking silently stops working.
  const db = makeStub({
    rpcs: { blocked_user_ids: { data: [{ blocked_user_ids: BLOCKED }] } },
  }) as AnyClient;
  const ids = await getBlockedIds(db, VIEWER);
  assertEquals(ids.has(BLOCKED), true);
});

Deno.test("FAILS OPEN when the RPC errors — documented tradeoff, asserted explicitly", async () => {
  const db = makeStub({
    rpcs: { blocked_user_ids: { error: { message: "permission denied" } } },
  }) as AnyClient;
  const ids = await getBlockedIds(db, VIEWER);
  // Empty set = discovery runs unfiltered. Deliberate: a broken lookup must not
  // take the whole feed down. The cost is that blocks stop applying, which is
  // why the RPC's grant is itself a tested boundary (tr05-security-definer).
  assertEquals(ids.size, 0);
});

Deno.test("a null payload is treated as no blocks rather than throwing", async () => {
  const db = makeStub({ rpcs: { blocked_user_ids: { data: null } } }) as AnyClient;
  assertEquals((await getBlockedIds(db, VIEWER)).size, 0);
});

Deno.test("filterBlocked drops rows owned by a blocked id", () => {
  const rows = [
    { influencer_id: VIEWER, name: "keep" },
    { influencer_id: BLOCKED, name: "drop" },
  ];
  const out = filterBlocked(rows, new Set([BLOCKED]), "influencer_id");
  assertEquals(out.length, 1);
  assertEquals(out[0].name, "keep");
});

Deno.test("filterBlocked is a no-op for an empty block set (hot path stays cheap)", () => {
  const rows = [{ influencer_id: VIEWER }];
  assertEquals(filterBlocked(rows, new Set(), "influencer_id"), rows);
});

Deno.test("filterBlocked keeps rows whose owner column is missing or not a string", () => {
  const rows = [{ influencer_id: null }, { other: 1 }, { influencer_id: 42 }];
  // Better to show a row with a malformed owner than to silently vanish it.
  assertEquals(filterBlocked(rows as never, new Set([BLOCKED]), "influencer_id").length, 3);
});

Deno.test("filterBlocked tolerates null and empty input", () => {
  assertEquals(filterBlocked(null, new Set([BLOCKED]), "influencer_id"), []);
  assertEquals(filterBlocked([], new Set([BLOCKED]), "influencer_id"), []);
});
