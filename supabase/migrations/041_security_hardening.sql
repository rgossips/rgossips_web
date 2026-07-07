-- Security hardening pass (QA + security + abuse audit, 2026-07).
--
-- NOTE ON NUMBERING: there are two 040_* migrations in this repo
-- (040_admin_activity_log.sql and 040_perf_indexes_and_stats.sql).
-- Supabase tracks applied migrations by the leading version token, so a
-- duplicate prefix is a latent hazard — `db push` can consider one
-- "already applied" and skip it. Both 040s are idempotent and their
-- artifacts are live in the DB, so nothing is broken today, but the next
-- structural migration must NOT reuse 040. This file is 041.

-- ──────────────────────────────────────────────────────────────────
-- 1. OTP brute-force lockout  (CRITICAL)
--
-- whatsapp-otp-verifier compared the submitted code against the stored
-- one with no attempt counter and no lockout. A 6-digit code (900k
-- keyspace) valid for 5 minutes could be guessed with unlimited parallel
-- requests → practical account takeover once any OTP is outstanding.
--
-- Add an attempts counter so the verifier can burn a code after a small
-- number of wrong guesses. Combined with the sender's existing caps
-- (60s cooldown, 5/phone/hr) this bounds total guesses per phone to a
-- couple dozen per hour against a 900k space — infeasible.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- Atomic verify-and-count. Doing the compare + increment in the verifier
-- as read-then-write is a TOCTOU: parallel wrong guesses all read
-- attempts=0 and bypass the ceiling. This function takes a row lock
-- (implicit under the UPDATE) so concurrent guesses serialise. It:
--   * finds the newest unexpired, unverified code for the phone,
--   * if attempts already >= cap → returns locked_out and burns it,
--   * increments attempts,
--   * on match → marks verified and returns matched=true,
--   * on mismatch → returns remaining attempts, burning at the cap.
-- Returns one row: (matched bool, status text, remaining int).
-- service-role only (verifier runs as service role; revoke the rest).
CREATE OR REPLACE FUNCTION public.consume_otp_attempt(
  p_phone text,
  p_code  text,
  p_max   int DEFAULT 5
)
RETURNS TABLE (matched boolean, status text, remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.otp_verifications%ROWTYPE;
BEGIN
  SELECT * INTO rec
  FROM public.otp_verifications
  WHERE phone = p_phone
    AND verified = false
    AND expires_at >= now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'no_code'::text, 0;
    RETURN;
  END IF;

  IF rec.attempts >= p_max THEN
    UPDATE public.otp_verifications SET verified = true WHERE id = rec.id;
    RETURN QUERY SELECT false, 'locked_out'::text, 0;
    RETURN;
  END IF;

  IF rec.otp = p_code THEN
    -- Count the (successful) attempt but do NOT mark verified here. The
    -- verifier consumes the code just before it issues the session, so
    -- the reactivation short-circuit (deactivated account → re-submit the
    -- same code with reactivate:true) can still find it active.
    UPDATE public.otp_verifications
      SET attempts = rec.attempts + 1
      WHERE id = rec.id;
    RETURN QUERY SELECT true, 'matched'::text, (p_max - rec.attempts - 1);
    RETURN;
  END IF;

  -- Wrong guess: increment, burn at the ceiling.
  UPDATE public.otp_verifications
    SET attempts = rec.attempts + 1,
        verified = (rec.attempts + 1 >= p_max)
    WHERE id = rec.id;

  IF rec.attempts + 1 >= p_max THEN
    RETURN QUERY SELECT false, 'locked_out'::text, 0;
  ELSE
    RETURN QUERY SELECT false, 'invalid'::text, (p_max - rec.attempts - 1);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_otp_attempt(text, text, int) FROM PUBLIC, anon, authenticated;

-- ──────────────────────────────────────────────────────────────────
-- 2. Duplicate-application race  (MEDIUM)
--
-- apply-campaign guarded duplicates with an app-level SELECT-then-INSERT,
-- which is a TOCTOU race — two concurrent requests both pass the check
-- and insert. A DB-level uniqueness guarantee closes it regardless of
-- timing. Partial unique index (not a constraint) so we can scope it and
-- keep it online-buildable.
--
-- Guard against pre-existing duplicates blocking the index build: if any
-- exist they must be reconciled first. This DO block reports them loudly
-- rather than failing cryptically.
-- ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT campaign_id, influencer_id
    FROM public.campaign_applications
    WHERE campaign_id IS NOT NULL AND influencer_id IS NOT NULL
    GROUP BY campaign_id, influencer_id
    HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE NOTICE 'campaign_applications has % duplicate (campaign_id, influencer_id) pair(s); dedupe before the unique index will build.', dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_applications_unique_applicant_idx
  ON public.campaign_applications (campaign_id, influencer_id)
  WHERE campaign_id IS NOT NULL AND influencer_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────
-- 3. Leaderboard privacy tightening  (LOW)
--
-- get_referral_leaderboard is GRANTed to anon and returns full_name to
-- unauthenticated callers. Usernames/handles are already public surface;
-- legal names are not. Revoke anon and keep authenticated-only — the
-- refer page is behind login anyway. top_n is already capped at 100 in
-- the function body, so no unbounded-result concern remains.
-- ──────────────────────────────────────────────────────────────────
-- Must revoke from PUBLIC too: functions get an implicit EXECUTE grant to
-- PUBLIC on creation, which anon inherits — revoking the explicit anon
-- grant alone leaves it callable. Re-grant to authenticated afterward.
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(int) TO authenticated;
