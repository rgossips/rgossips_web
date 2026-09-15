-- 071: 30-day Instagram account insights + token health.
--
-- refresh-instagram used to request `period=days_28&metric_type=total_value`,
-- which Instagram silently answers with roughly the last 1–3 days. Every media
-- kit understated reach ~12x and views ~40x. The fix asks for an explicit
-- since/until window, and that call also returns likes, comments, shares,
-- saves and reposts — which the existing columns cannot hold.
--
-- One jsonb rather than nine columns: the set of metrics Instagram exposes
-- keeps changing (views replaced impressions in 2025), and the kit reads it as
-- a unit with its window. Shape, written only by refresh-instagram:
--   { since, until, days, views, reelViews, reach, likes, comments, shares,
--     saves, reposts, interactions, accountsEngaged }
-- total_impressions / total_reach stay populated for existing readers.

alter table public.influencer_profiles
  add column if not exists instagram_insights jsonb,
  -- Set when Instagram rejects the stored token (OAuth error 190: password
  -- change, revoked access, expiry). Cleared by the next successful refresh.
  -- NOT used to block anyone: the Instagram-required gate keys off the token
  -- being present. This drives the "your analytics are out of date — reconnect"
  -- notice and admin visibility.
  add column if not exists instagram_token_invalid_at timestamptz;

comment on column public.influencer_profiles.instagram_insights is
  '30-day Instagram account totals from refresh-instagram: {since, until, days, views, reelViews, reach, likes, comments, shares, saves, reposts, interactions, accountsEngaged}';
comment on column public.influencer_profiles.instagram_token_invalid_at is
  'When Instagram last rejected the stored token; null once a refresh succeeds.';
