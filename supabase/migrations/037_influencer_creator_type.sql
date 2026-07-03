-- Creator type distinguishes meme pages from celebrity/personality
-- profiles on the brand-facing discover surfaces. Optional — a null
-- value just means "unclassified" (the platform default). Admin sets
-- this from the invite / edit-influencer forms.
--
-- The brand homepage's Meme Pages + Celebrities cards on
-- CategorySection route to /brands/search?profileType=<value>. The
-- discover filter drawer also gains a "Profile Type" chip pair with
-- these two options.

ALTER TABLE public.influencer_profiles
  ADD COLUMN IF NOT EXISTS creator_type text
    CHECK (creator_type IS NULL OR creator_type IN ('meme_page', 'celebrity'));

CREATE INDEX IF NOT EXISTS influencer_profiles_creator_type_idx
  ON public.influencer_profiles (creator_type)
  WHERE creator_type IS NOT NULL;
