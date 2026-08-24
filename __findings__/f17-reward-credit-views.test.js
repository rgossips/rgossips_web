/**
 * F-17 — Reward-credit balance views are readable by anon  [NEW, found by TR-05]
 *
 * Severity: S1 by the strategy's own rule — "anything touching money or personal
 * data is S1 by default, regardless of how small it looks" (§9, Table 9).
 *
 * WHAT: `v_reward_credits_available_balance` and `v_reward_credits_balance`
 * return every user's reward-credit balance, keyed by `user_id`, to an
 * unauthenticated caller holding the publishable key — the key Next inlines into
 * every browser bundle. Verified live 2026-08-20:
 *
 *   GET /rest/v1/v_reward_credits_available_balance?select=*
 *   -> 200 [{"user_id":"1806361c-…","available_balance":50,"locked_balance":0}, …]
 *
 * WHY IT HAPPENS: the underlying `reward_credits_ledger` table has RLS and
 * correctly denies anon. These are VIEWS over it, and a Postgres view runs with
 * the privileges of its OWNER unless `security_invoker = on` is set, so the view
 * bypasses the very policy protecting the table. Migrations 036 and 038 created
 * them without that setting. This is the same shape as F-08 (SECURITY DEFINER
 * functions) applied to views rather than functions.
 *
 * FIX (a migration, therefore out of scope for a test-only pass):
 *   alter view public.v_reward_credits_balance set (security_invoker = on);
 *   alter view public.v_reward_credits_available_balance set (security_invoker = on);
 *   revoke all on public.v_reward_credits_balance from anon;
 *   revoke all on public.v_reward_credits_available_balance from anon;
 * Note migration 060's lesson: REVOKE ... FROM PUBLIC does NOT remove anon's
 * grant, because Supabase's ALTER DEFAULT PRIVILEGES grants it directly. Revoke
 * from anon by name.
 *
 * THIS TEST IS EXPECTED TO FAIL until that migration ships. It goes green on the
 * day the finding closes.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { rest, requireEnv, ANON_KEY } from "../__integration__/safety.js";

const VIEWS = ["v_reward_credits_available_balance", "v_reward_credits_balance"];

beforeAll(() => requireEnv());

describe("F-17 — reward-credit balances must not be readable by anon", () => {
  it.each(VIEWS)("%s returns no rows to an unauthenticated caller", async (view) => {
    const r = await rest(`${view}?select=*&limit=5`, { key: ANON_KEY });
    const rows = Array.isArray(r.body) ? r.body.length : 0;
    expect({ view, anonVisibleRows: rows }).toEqual({ view, anonVisibleRows: 0 });
  });

  it("no user_id/balance pair is enumerable across tenants", async () => {
    const r = await rest("v_reward_credits_balance?select=user_id,balance&limit=100", {
      key: ANON_KEY,
    });
    const rows = Array.isArray(r.body) ? r.body : [];
    // A cross-tenant financial dataset available to the public key.
    expect({ enumerableUsers: rows.length }).toEqual({ enumerableUsers: 0 });
  });
});
