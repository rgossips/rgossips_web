-- Brand profiles now require Instagram connection (same as influencers).
-- Mirror the IG token columns from influencer_profiles so the OAuth flow
-- can store a long-lived access token + expiry on the brand row, and a
-- future refresh-instagram-brand cron can keep follower/media data fresh.

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS instagram_access_token text,
  ADD COLUMN IF NOT EXISTS instagram_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS instagram_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS followers_count integer,
  ADD COLUMN IF NOT EXISTS follows_count integer,
  ADD COLUMN IF NOT EXISTS media_count integer,
  ADD COLUMN IF NOT EXISTS profile_photo_url text;
