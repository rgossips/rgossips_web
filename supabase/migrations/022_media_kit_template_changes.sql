-- Per-plan cap on how many times a creator can switch media-kit template.
-- Starter has only the Classic template available so the counter never
-- moves; Pro is capped at 3 lifetime saves; Elite is unlimited and the
-- counter still ticks (cheap audit trail for support / future analytics).
ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS media_kit_template_changes INT NOT NULL DEFAULT 0;
