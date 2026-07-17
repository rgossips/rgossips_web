-- Content languages an influencer creates in (multi-select on profile edit).
-- Stored as a text[] array, same shape as `categories` / `services`.
alter table public.influencer_profiles
  add column if not exists content_languages text[] not null default '{}';

comment on column public.influencer_profiles.content_languages is
  'Languages the creator publishes content in (e.g. {Hindi,English,Tamil}). Editable from the influencer profile.';
