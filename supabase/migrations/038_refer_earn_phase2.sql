-- Refer & Earn — Phase 2.
--
-- Adds:
--   1. Welcome RC bonus: new influencer signups get 50 RC locked for 30 days.
--      Ledger gets a new reason 'WELCOME_BONUS' and a new column `unlocks_at`
--      that gates redemption (available balance skips locked rows).
--   2. Available-balance view. redeem-rc reads this instead of the raw sum
--      so locked-but-not-yet-unlocked credits can't be spent.
--   3. Fraud-attribution columns on referrals so attribute-referral can
--      capture signup IP + device fingerprint and the admin console has
--      something to review MANUAL_REVIEW rows against.

-- ────────────────────────────────────────────────────────────────────
-- 1. Extend reward_credits_ledger: unlocks_at + WELCOME_BONUS reason.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.reward_credits_ledger
  ADD COLUMN IF NOT EXISTS unlocks_at timestamptz;

-- Drop the old reason CHECK (Postgres auto-names it <table>_<col>_check).
-- We do it defensively via a DO block so re-runs are safe even if the
-- constraint has been renamed by a prior migration.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.reward_credits_ledger'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%REFERRAL_EARN%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reward_credits_ledger DROP CONSTRAINT %I', con_name);
  END IF;
END$$;

ALTER TABLE public.reward_credits_ledger
  ADD CONSTRAINT reward_credits_ledger_reason_check
  CHECK (reason IN (
    'REFERRAL_EARN',
    'WELCOME_BONUS',
    'MILESTONE_BONUS',
    'LEADERBOARD',
    'REDEMPTION',
    'CLAWBACK',
    'EXPIRY',
    'ADMIN_ADJUSTMENT'
  ));

CREATE INDEX IF NOT EXISTS reward_credits_unlocks_at_idx
  ON public.reward_credits_ledger (unlocks_at)
  WHERE unlocks_at IS NOT NULL AND delta_rc > 0;

-- ────────────────────────────────────────────────────────────────────
-- 2. Available-balance view.
--    Sum of ledger deltas, but positive rows only count once they've
--    unlocked. Debit rows (REDEMPTION / CLAWBACK / EXPIRY) are always
--    included so redemption drops the wallet immediately.
--
--    The rule "positive AND not-yet-unlocked → excluded" mirrors what a
--    naive user reads on the wallet screen: locked RC is visible but
--    not yet spendable.
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_reward_credits_available_balance AS
  SELECT
    user_id,
    COALESCE(SUM(
      CASE
        WHEN delta_rc > 0 AND unlocks_at IS NOT NULL AND unlocks_at > NOW() THEN 0
        ELSE delta_rc
      END
    ), 0)::int AS available_balance,
    COALESCE(SUM(
      CASE
        WHEN delta_rc > 0 AND unlocks_at IS NOT NULL AND unlocks_at > NOW() THEN delta_rc
        ELSE 0
      END
    ), 0)::int AS locked_balance
  FROM public.reward_credits_ledger
  GROUP BY user_id;

-- ────────────────────────────────────────────────────────────────────
-- 3. Fraud-attribution columns on referrals.
--    signup_ip is stored as inet so we can range-query for same-subnet
--    abuse ("N signups from the same /24 in an hour").
--    device_fingerprint is a client-computed hash (canvas+UA+timezone);
--    identical values across accounts is a strong duplicate signal.
--    Neither is on the RLS-visible surface — admin edge functions read
--    them via service role.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS signup_ip inet,
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS review_reason text,      -- populated when status flips to MANUAL_REVIEW
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;        -- admin user id

CREATE INDEX IF NOT EXISTS referrals_manual_review_idx
  ON public.referrals (created_at DESC)
  WHERE status = 'MANUAL_REVIEW';

CREATE INDEX IF NOT EXISTS referrals_device_fp_idx
  ON public.referrals (device_fingerprint)
  WHERE device_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS referrals_signup_ip_idx
  ON public.referrals (signup_ip)
  WHERE signup_ip IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────
-- 4. Also skip locked rows in the nightly expiry job.
--    A locked earn row can still expire in principle (locked 30d,
--    expires 90d → 60d spendable window). expire_reward_credits already
--    guards against overspend; the only tweak here is that a locked
--    earn shouldn't be counted against balance_after when computing the
--    expiry delta. Since we compare against SUM(delta_rc) — total, not
--    available — the existing math is already fine: expired locked RC
--    reduces the raw total the same way it reduces a spent balance.
--    No changes to expire_reward_credits() needed. Documented here so
--    future edits know the expiry logic was intentionally kept simple.
-- ────────────────────────────────────────────────────────────────────
