-- Admin-curated campaign list used by the influencer home page on both
-- the "Deal Of The Day" stacked carousel AND the "Plan Your Stay With Us"
-- carousel. Same source feeds both surfaces so admin picks one list.
--
-- We keep only a pointer to the live campaign row so changes (title,
-- budget, banner) flow through without a re-snapshot. Position drives
-- ordering on the influencer home.

create table if not exists public.featured_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id)
);

create index if not exists featured_campaigns_active_idx
  on public.featured_campaigns (is_active, position);

alter table public.featured_campaigns enable row level security;

drop policy if exists "featured_campaigns_public_read" on public.featured_campaigns;
create policy "featured_campaigns_public_read"
  on public.featured_campaigns for select using (is_active = true);
