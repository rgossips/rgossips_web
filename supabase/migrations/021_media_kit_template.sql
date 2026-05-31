-- Adds a template selector for the influencer media kit. Default 'classic'
-- keeps the existing layout for every current creator; new templates
-- (glass_blue, editorial_noir, bento_sunset, neo_brutalist) are gated on
-- the user's subscription plan in the UI.
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS media_kit_template TEXT DEFAULT 'classic';

-- Anything that isn't recognised falls back to classic at render time, so
-- a simple text column without an enum constraint keeps the schema flexible
-- for future template additions without another migration.
