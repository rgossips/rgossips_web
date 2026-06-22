-- Add the admin-editable section title for the "Top Creator Stories"
-- carousel on the marketing home. Same homepage_settings table introduced
-- in migration 029 — just a new key/value row.

insert into public.homepage_settings (key, value) values
  ('creator_stories_section_title', 'TOP CREATOR STORIES')
on conflict (key) do nothing;
