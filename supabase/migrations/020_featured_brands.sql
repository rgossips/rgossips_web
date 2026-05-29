-- Admin-curated brand list for the influencer home "Brands You'll Love"
-- carousel. Mirrors featured_creators / featured_campaigns: the admin
-- picks brands (from brand_profiles or brand_invitations) and we
-- denormalise the display fields so the carousel renders without a join
-- and survives the source brand being edited.

create table if not exists public.featured_brands (
  id uuid primary key default gen_random_uuid(),
  -- Optional provenance pointers (exactly one is typically set). Display
  -- fields below are the source of truth for rendering.
  brand_id uuid references public.brand_profiles(brand_id) on delete set null,
  brand_invitation_id uuid references public.brand_invitations(id) on delete set null,
  name text not null,
  logo_url text,
  instagram_url text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists featured_brands_active_idx
  on public.featured_brands (is_active, position);

alter table public.featured_brands enable row level security;

drop policy if exists "featured_brands_public_read" on public.featured_brands;
create policy "featured_brands_public_read"
  on public.featured_brands for select using (is_active = true);
