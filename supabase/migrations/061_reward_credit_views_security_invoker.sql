-- F-17 (S1): the reward-credit balance views returned every user's balance to anon.
--
-- reward_credits_ledger's own RLS is correct and always was — migration 036:
--   ledger_self_read  FOR SELECT TO authenticated USING (user_id = auth.uid())
-- with writes restricted to the service role.
--
-- The two views over it bypassed that policy. A Postgres view executes with the
-- privileges of its OWNER unless `security_invoker = on` is set, so the view
-- read the ledger as its owner and handed the result to whoever asked. With the
-- publishable key — the one Next inlines into every browser bundle — an
-- unauthenticated caller could enumerate the lot:
--
--   GET /rest/v1/v_reward_credits_available_balance?select=*
--   -> 200 [{"user_id":"1806361c-…","available_balance":50,"locked_balance":0}, …]
--
-- Found by the TR-05 anon-boundary suite (__integration__/tr05-rls.test.js),
-- which enumerates every relation PostgREST exposes rather than a hand-kept
-- list. src/app/influencer/pricing/page.js:324 already carried a comment saying
-- "RLS on v_reward_credits_available_balance…" — the belief was there, the
-- enforcement was not.
--
-- WHY THE REVOKE NAMES anon EXPLICITLY. `REVOKE … FROM PUBLIC` does not remove
-- it: Supabase's ALTER DEFAULT PRIVILEGES grants SELECT on new public-schema
-- objects to anon *directly*, so a PUBLIC revoke leaves that grant standing.
-- This is exactly what migration 060 had to correct after 059 read as locked
-- down and still answered anon 200. Same trap, applied to views instead of
-- functions.
--
-- CONSUMERS — checked before writing this, because security_invoker changes who
-- the view runs as and getting it wrong silently reads every balance as 0:
--   authenticated (ReferBalanceCard, WelcomeRewardModal, DashboardView,
--     /influencer/refer, /influencer/pricing) -> RLS now applies, each sees
--     their own row. The GROUP BY aggregates only visible rows, so the number
--     is still correct.
--   service role (create-profile, razorpay-checkout, _shared/referrals.ts
--     balance_after) -> bypasses RLS, unaffected.
--
-- Rollback: alter view … set (security_invoker = off).

alter view public.v_reward_credits_balance set (security_invoker = on);
alter view public.v_reward_credits_available_balance set (security_invoker = on);

revoke all on public.v_reward_credits_balance from anon;
revoke all on public.v_reward_credits_available_balance from anon;

grant select on public.v_reward_credits_balance to authenticated, service_role;
grant select on public.v_reward_credits_available_balance to authenticated, service_role;
