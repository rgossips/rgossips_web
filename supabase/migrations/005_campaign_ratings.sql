-- Two-way ratings between brand and influencer for a single campaign application.
-- One row per (application_id, rater_role) — uniqueness is enforced so each side
-- can rate exactly once without overwriting via duplicate inserts.

create table if not exists public.campaign_ratings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.campaign_applications(id) on delete cascade,
  campaign_id uuid not null,
  brand_id uuid not null,
  influencer_id uuid not null,
  rater_role text not null check (rater_role in ('brand', 'influencer')),
  journey_rating int not null check (journey_rating between 1 and 5),
  target_rating int not null check (target_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (application_id, rater_role)
);

create index if not exists campaign_ratings_campaign_id_idx on public.campaign_ratings (campaign_id);
create index if not exists campaign_ratings_brand_id_idx on public.campaign_ratings (brand_id);
create index if not exists campaign_ratings_influencer_id_idx on public.campaign_ratings (influencer_id);

alter table public.campaign_ratings enable row level security;

-- Influencers can read/write only their own influencer-side ratings.
drop policy if exists "influencer_rate_own" on public.campaign_ratings;
create policy "influencer_rate_own"
  on public.campaign_ratings
  for all
  using (auth.uid() = influencer_id and rater_role = 'influencer')
  with check (auth.uid() = influencer_id and rater_role = 'influencer');

-- Brands can read/write only their own brand-side ratings.
drop policy if exists "brand_rate_own" on public.campaign_ratings;
create policy "brand_rate_own"
  on public.campaign_ratings
  for all
  using (auth.uid() = brand_id and rater_role = 'brand')
  with check (auth.uid() = brand_id and rater_role = 'brand');
