-- Generic key/value store for admin-editable copy on the influencer
-- home page. First customer: the title above the Plan Your Stay With Us
-- carousel (used to be hard-coded as "Featured Campaigns").
--
-- Public read so the unauthenticated home page can render the latest
-- string; writes happen via the admin app's service-role server actions.

create table if not exists public.homepage_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.homepage_settings enable row level security;

drop policy if exists "homepage_settings_public_read" on public.homepage_settings;
create policy "homepage_settings_public_read"
  on public.homepage_settings for select using (true);

insert into public.homepage_settings (key, value) values
  ('featured_section_title', 'Plan your stay with us')
on conflict (key) do nothing;
