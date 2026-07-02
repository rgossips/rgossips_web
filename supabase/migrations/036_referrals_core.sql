-- Refer & Earn — Phase 1 core.
--
-- Decisions locked (Phase 0):
--   1. Referral code = short slug (~8 chars) on the referrer's profile.
--      Populated only after they've had a first successful subscription.
--   2. Unused-code TTL = 30 days from creation.
--   3. Anti-fraud cap = max 5 QUALIFIED referrals per rolling day (IST).
--   4. All three plan tiers (Starter/Pro/Elite) qualify.
--   5. Claw-back window = 7 days from QUALIFIED.
--   6. Referrer must have an ACTIVE subscription at moment of QUALIFIED
--      (strict). Otherwise no reward.
--   7. No welcome bonus RC — referee gets 50% off first month only.
--   8. RC redemption capped at floor(plan_price × 0.5) per invoice.
--   9. RC survives cancellation (spendable on renewal).
--  10. Admin can grant/deduct RC manually via /dashboard/referrals.
--      Same 90-day expiry + same 50% redemption cap as earned RC.

-- ────────────────────────────────────────────────────────────────────
-- 1. Referral code on influencer profile.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.influencer_profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

CREATE INDEX IF NOT EXISTS influencer_profiles_referral_code_idx
  ON public.influencer_profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────
-- 2. Referrals — one row per (referrer, referee-attempt) pair.
--    referee_id is null until the invited user actually signs up.
--    qualifying_event_id is UNIQUE — same subscription can never
--    qualify a referral twice even under webhook re-delivery.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.influencer_profiles(influencer_id) ON DELETE CASCADE,
  referee_id uuid REFERENCES public.influencer_profiles(influencer_id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','SIGNED_UP','QUALIFIED','REWARDED','REVERSED','EXPIRED','MANUAL_REVIEW')),
  referee_first_plan text
    CHECK (referee_first_plan IN ('STARTER','PRO','ELITE')),
  qualifying_event_id text UNIQUE,        -- subscription id from Stripe/Razorpay
  referrer_reward_rc int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  signed_up_at timestamptz,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  reversed_at timestamptz
);

CREATE INDEX IF NOT EXISTS referrals_referrer_status_idx
  ON public.referrals (referrer_id, status);
CREATE INDEX IF NOT EXISTS referrals_referee_idx
  ON public.referrals (referee_id) WHERE referee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_code_open_idx
  ON public.referrals (referral_code)
  WHERE status IN ('PENDING','SIGNED_UP');

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral rows (as referrer OR referee).
DROP POLICY IF EXISTS "referrals_self_read" ON public.referrals;
CREATE POLICY "referrals_self_read" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());
-- Writes only happen from edge functions (service-role).

-- ────────────────────────────────────────────────────────────────────
-- 3. Reward Credits Ledger — append-only double-entry style.
--    Balance is always SUM(delta_rc); balance_after is a snapshot for
--    fast wallet reads. Never mutate rows.
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reward_credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.influencer_profiles(influencer_id) ON DELETE CASCADE,
  delta_rc int NOT NULL,                     -- signed (+earn / -redeem / -clawback / -expiry)
  reason text NOT NULL
    CHECK (reason IN ('REFERRAL_EARN','MILESTONE_BONUS','LEADERBOARD','REDEMPTION','CLAWBACK','EXPIRY','ADMIN_ADJUSTMENT')),
  ref_referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  admin_id uuid,                             -- set only on ADMIN_ADJUSTMENT rows
  note text,                                 -- required on ADMIN_ADJUSTMENT
  balance_after int NOT NULL,
  expires_at timestamptz,                    -- set on positive earn rows (90d); null otherwise
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reward_credits_user_created_idx
  ON public.reward_credits_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reward_credits_expiry_idx
  ON public.reward_credits_ledger (expires_at)
  WHERE expires_at IS NOT NULL AND delta_rc > 0;

ALTER TABLE public.reward_credits_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger.
DROP POLICY IF EXISTS "ledger_self_read" ON public.reward_credits_ledger;
CREATE POLICY "ledger_self_read" ON public.reward_credits_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- Writes only from edge functions (service-role).

-- ────────────────────────────────────────────────────────────────────
-- 4. Balance view.
--    Sum of all deltas per user. Cheap on the (user_id, created_at)
--    index. Callers who want a live balance read this; callers who
--    just want to know last-known balance read balance_after from the
--    most recent row.
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_reward_credits_balance AS
  SELECT user_id, COALESCE(SUM(delta_rc), 0)::int AS balance
  FROM public.reward_credits_ledger
  GROUP BY user_id;

-- ────────────────────────────────────────────────────────────────────
-- 5. Nightly cron jobs.
--    (a) Expire earn rows past expires_at → insert matching EXPIRY
--        row so balance reflects it.
--    (b) Expire PENDING referrals past 30-day TTL.
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_reward_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  new_balance int;
BEGIN
  FOR r IN
    SELECT id, user_id, delta_rc
    FROM public.reward_credits_ledger
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW()
      AND delta_rc > 0
      -- Skip rows that already have a matching EXPIRY entry.
      AND NOT EXISTS (
        SELECT 1 FROM public.reward_credits_ledger x
        WHERE x.reason = 'EXPIRY'
          AND x.ref_referral_id IS NOT DISTINCT FROM public.reward_credits_ledger.ref_referral_id
          AND x.user_id = public.reward_credits_ledger.user_id
          AND x.created_at > public.reward_credits_ledger.created_at
      )
  LOOP
    SELECT COALESCE(SUM(delta_rc),0) INTO new_balance
    FROM public.reward_credits_ledger
    WHERE user_id = r.user_id;
    -- Only expire what's left unspent. Cap the negative at current balance
    -- so we never drive the wallet below zero from expiry alone.
    IF new_balance > 0 THEN
      INSERT INTO public.reward_credits_ledger (user_id, delta_rc, reason, balance_after, note)
      VALUES (
        r.user_id,
        -LEAST(r.delta_rc, new_balance),
        'EXPIRY',
        new_balance - LEAST(r.delta_rc, new_balance),
        'Auto-expired 90d after credit'
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_pending_referrals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referrals
  SET status = 'EXPIRED'
  WHERE status IN ('PENDING','SIGNED_UP')
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-expire-rc') THEN
    PERFORM cron.unschedule('rgossips-expire-rc');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-expire-referrals') THEN
    PERFORM cron.unschedule('rgossips-expire-referrals');
  END IF;
END$$;

-- Run at 03:15 IST daily = 21:45 UTC previous day.
SELECT cron.schedule('rgossips-expire-rc',       '45 21 * * *', $$ SELECT public.expire_reward_credits(); $$);
SELECT cron.schedule('rgossips-expire-referrals','50 21 * * *', $$ SELECT public.expire_pending_referrals(); $$);
