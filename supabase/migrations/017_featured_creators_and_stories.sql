-- Admin-curated content for the brand home page.
--
-- featured_creators: rows the admin manually picks to appear in the
-- "Top Creators" carousel on /brands. Stores everything the card needs to
-- render (handle, avatar, rating, follower count, IG URL) so the carousel
-- doesn't have to join against influencer_profiles at render time. Position
-- controls display order; lower = earlier.
--
-- creator_stories: video story tiles in the "Top Creator Stories" carousel.
-- Each row points at a hosted video plus an avatar/poster image.
--
-- Both tables are admin-write, public-read.

create table if not exists public.featured_creators (
  id uuid primary key default gen_random_uuid(),
  -- Optional FK so the admin app can pick an existing influencer; if NULL,
  -- the row is a manually curated entry (e.g. a creator we haven't onboarded
  -- yet). All display fields are denormalised below.
  influencer_id uuid references public.influencer_profiles(influencer_id) on delete set null,
  username text not null,
  display_name text,
  avatar_url text,
  followers_label text,
  rating numeric(2,1),
  verified boolean not null default false,
  instagram_url text not null,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists featured_creators_active_idx
  on public.featured_creators (is_active, position);

create table if not exists public.creator_stories (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid references public.influencer_profiles(influencer_id) on delete set null,
  username text not null,
  avatar_url text,
  video_url text not null,
  poster_url text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists creator_stories_active_idx
  on public.creator_stories (is_active, position);

-- Public read for both, admin (service role) writes.
alter table public.featured_creators enable row level security;
alter table public.creator_stories enable row level security;

drop policy if exists "featured_creators_public_read" on public.featured_creators;
create policy "featured_creators_public_read"
  on public.featured_creators for select using (is_active = true);

drop policy if exists "creator_stories_public_read" on public.creator_stories;
create policy "creator_stories_public_read"
  on public.creator_stories for select using (is_active = true);
