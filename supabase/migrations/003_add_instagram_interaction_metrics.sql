-- Add Instagram metrics columns used by refresh-instagram for the new
-- account-level insights (`total_interactions`, `accounts_engaged`).
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accounts_engaged INTEGER DEFAULT 0;
