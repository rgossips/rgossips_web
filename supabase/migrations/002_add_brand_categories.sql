-- Add categories column to brand_profiles so brands can tag themselves
-- with the same category list shown to influencers/campaigns.
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
