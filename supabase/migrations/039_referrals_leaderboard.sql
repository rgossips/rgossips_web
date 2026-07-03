-- Referral leaderboard — public monthly ranking of referrers by earned RC.
--
-- The view is evaluated per-query so `now()` inside is fine — it always
-- reflects the current IST calendar month. Zero rows for the current
-- month is expected on the 1st minute of every month.
--
-- We do NOT expose referee identity through this view — only the
-- aggregate per referrer + the referrer's public identity.

CREATE OR REPLACE VIEW public.v_referral_leaderboard_monthly AS
  SELECT
    r.referrer_id,
    COUNT(*)::int                         AS rewarded_count,
    COALESCE(SUM(r.referrer_reward_rc), 0)::int AS rc_earned,
    -- IST month bucket the row belongs to. Callers can filter or group
    -- by this if the view is ever extended to include prior months.
    (date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata'))::date AS period_start
  FROM public.referrals r
  WHERE r.status = 'REWARDED'
    AND r.rewarded_at IS NOT NULL
    AND r.rewarded_at >= (date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')
    AND r.rewarded_at <  ((date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') + interval '1 month') AT TIME ZONE 'Asia/Kolkata')
  GROUP BY r.referrer_id
  ORDER BY rc_earned DESC, rewarded_count DESC;

-- Views inherit RLS from base tables. `referrals` has a self-read
-- policy, so this view would silently return 0 rows for non-referrer
-- users. Grant SELECT via SECURITY DEFINER function instead of trying
-- to relax RLS on referrals.
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(top_n int DEFAULT 10)
RETURNS TABLE (
  rank int,
  referrer_id uuid,
  full_name text,
  username text,
  instagram_handle text,
  profile_photo_url text,
  rewarded_count int,
  rc_earned int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (ROW_NUMBER() OVER (ORDER BY lb.rc_earned DESC, lb.rewarded_count DESC))::int AS rank,
    lb.referrer_id,
    p.full_name,
    p.username,
    p.instagram_handle,
    p.profile_photo_url,
    lb.rewarded_count,
    lb.rc_earned
  FROM public.v_referral_leaderboard_monthly lb
  JOIN public.influencer_profiles p ON p.influencer_id = lb.referrer_id
  ORDER BY lb.rc_earned DESC, lb.rewarded_count DESC
  LIMIT GREATEST(1, LEAST(top_n, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(int) TO authenticated, anon;

-- Same, scoped to caller: returns their rank on the current-month board.
-- Uses auth.uid() so it's safe to expose to any authenticated user.
CREATE OR REPLACE FUNCTION public.get_my_referral_rank()
RETURNS TABLE (
  rank int,
  rewarded_count int,
  rc_earned int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      (ROW_NUMBER() OVER (ORDER BY rc_earned DESC, rewarded_count DESC))::int AS rank,
      referrer_id,
      rewarded_count,
      rc_earned
    FROM public.v_referral_leaderboard_monthly
  )
  SELECT rank, rewarded_count, rc_earned
  FROM ranked
  WHERE referrer_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_rank() TO authenticated;
