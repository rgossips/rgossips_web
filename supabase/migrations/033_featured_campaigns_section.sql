-- Featured Campaigns and the "Plan your stay with us" carousel now have
-- separate admin-curated lists, both backed by this same table. Each
-- row is tagged with its target section so the influencer-home reads
-- can fan out cleanly.
--
-- Existing rows default to 'campaign' (the original use — top deal
-- stack). Admin will curate the 'stay' list separately from the new
-- /dashboard/featured-stay page.

ALTER TABLE public.featured_campaigns
  ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'campaign'
    CHECK (section IN ('campaign', 'stay'));

-- Backfill is a no-op since the default already lands on every existing
-- row, but spelled out for clarity in case the table grew custom rows
-- without going through the migration runner.
UPDATE public.featured_campaigns SET section = 'campaign' WHERE section IS NULL;

-- The active+position index used by list-featured-campaigns is now
-- queried with a section filter — extend it so the planner can use a
-- single index scan instead of a filter step.
DROP INDEX IF EXISTS featured_campaigns_active_idx;
CREATE INDEX IF NOT EXISTS featured_campaigns_active_section_idx
  ON public.featured_campaigns (section, is_active, position);

-- Seed a section-title key for the Plan Your Stay carousel. The existing
-- featured_section_title key (migration 029) was originally used by the
-- Plan Your Stay carousel — keep that meaning and add a NEW
-- featured_campaigns_section_title in case admin wants to label the
-- top StackedDeals strip later. StackedDeals doesn't render a title
-- today; the seed exists so a future UI hook has a default.
INSERT INTO public.homepage_settings (key, value) VALUES
  ('featured_campaigns_section_title', 'FEATURED CAMPAIGNS')
ON CONFLICT (key) DO NOTHING;
