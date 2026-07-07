-- Performance pass: indexes for every hot filter the edge functions and
-- admin dashboards run, plus an aggregate RPC so the admin Refer & Earn
-- page stops shipping entire tables to compute six numbers.
--
-- All idempotent (IF NOT EXISTS / OR REPLACE) — safe to re-run.

-- ── influencer_profiles ─────────────────────────────────────────────
-- list-influencers pages the directory ordered by followers_count with
-- a status exclusion; the campaign matcher filters status='active' AND
-- a followers band. One composite index serves both.
CREATE INDEX IF NOT EXISTS influencer_profiles_status_followers_idx
  ON public.influencer_profiles (status, followers_count DESC);

-- ── campaigns ───────────────────────────────────────────────────────
-- brand-campaigns.list: brand's own campaigns newest-first.
CREATE INDEX IF NOT EXISTS campaigns_brand_created_idx
  ON public.campaigns (brand_id, created_at DESC);
-- list-campaigns (influencer discovery): active-status scan.
CREATE INDEX IF NOT EXISTS campaigns_status_idx
  ON public.campaigns (status);

-- ── campaign_applications ───────────────────────────────────────────
-- Per-campaign application lists (brand detail) and per-influencer
-- application map (influencer discovery). Both are the hottest joins
-- in the product.
CREATE INDEX IF NOT EXISTS campaign_applications_campaign_idx
  ON public.campaign_applications (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_applications_influencer_idx
  ON public.campaign_applications (influencer_id);

-- ── notifications ───────────────────────────────────────────────────
-- Inbox reads: newest-first per user; unread badge counts.
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE is_read = false;

-- ── influencer_invitations ──────────────────────────────────────────
-- list-influencers merges pending invitations on every directory read.
CREATE INDEX IF NOT EXISTS influencer_invitations_status_idx
  ON public.influencer_invitations (status);

-- ── referrals / ledger (admin analytics) ────────────────────────────
CREATE INDEX IF NOT EXISTS referrals_status_only_idx
  ON public.referrals (status);
CREATE INDEX IF NOT EXISTS reward_credits_reason_idx
  ON public.reward_credits_ledger (reason);

-- ── Admin stats RPC ─────────────────────────────────────────────────
-- The Refer & Earn admin page used to SELECT every referrals row and
-- every ledger row into the server action just to derive counts and
-- sums. This aggregates in Postgres and returns one small jsonb.
CREATE OR REPLACE FUNCTION public.get_referral_admin_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total',      (SELECT count(*) FROM public.referrals),
    'rewarded',   (SELECT count(*) FROM public.referrals WHERE status = 'REWARDED'),
    'signed_up',  (SELECT count(*) FROM public.referrals WHERE status IN ('PENDING','SIGNED_UP')),
    'review',     (SELECT count(*) FROM public.referrals WHERE status = 'MANUAL_REVIEW'),
    'signed',     (SELECT count(*) FROM public.referrals WHERE status IN ('SIGNED_UP','QUALIFIED','REWARDED','MANUAL_REVIEW')),
    'reversed',   (SELECT count(*) FROM public.referrals WHERE status = 'REVERSED'),
    'earned',     (SELECT coalesce(sum(delta_rc), 0)  FROM public.reward_credits_ledger WHERE reason = 'REFERRAL_EARN'),
    'welcome',    (SELECT coalesce(sum(delta_rc), 0)  FROM public.reward_credits_ledger WHERE reason = 'WELCOME_BONUS'),
    'admin_rc',   (SELECT coalesce(sum(delta_rc), 0)  FROM public.reward_credits_ledger WHERE reason = 'ADMIN_ADJUSTMENT'),
    'redeemed',   (SELECT coalesce(-sum(delta_rc), 0) FROM public.reward_credits_ledger WHERE reason = 'REDEMPTION'),
    'clawback',   (SELECT coalesce(-sum(delta_rc), 0) FROM public.reward_credits_ledger WHERE reason = 'CLAWBACK'),
    'expired',    (SELECT coalesce(-sum(delta_rc), 0) FROM public.reward_credits_ledger WHERE reason = 'EXPIRY')
  );
$$;

-- Aggregate program stats are operator-only. Functions default EXECUTE
-- to PUBLIC in Postgres — revoke, then rely on service_role (which the
-- admin server actions use) retaining superuser-level access.
REVOKE EXECUTE ON FUNCTION public.get_referral_admin_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_referral_admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_referral_admin_stats() FROM authenticated;
