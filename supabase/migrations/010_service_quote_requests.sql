-- Quote requests submitted from the influencer/services/<id>/quote form.
-- Each user can read/insert their own; ops/admin can read all via the
-- service role for triage.

create table if not exists public.service_quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text,
  service_id text not null,
  service_title text,
  description text,
  asset_url text,
  delivery_date date,
  scope text,                -- e.g. "30-60 seconds" / "10-pack" / package name
  budget_range text,
  style_references text,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists service_quote_requests_user_id_idx on public.service_quote_requests (user_id);
create index if not exists service_quote_requests_service_id_idx on public.service_quote_requests (service_id);
create index if not exists service_quote_requests_status_idx on public.service_quote_requests (status);

alter table public.service_quote_requests enable row level security;

drop policy if exists "service_quote_requests_insert_own" on public.service_quote_requests;
create policy "service_quote_requests_insert_own"
  on public.service_quote_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "service_quote_requests_read_own" on public.service_quote_requests;
create policy "service_quote_requests_read_own"
  on public.service_quote_requests
  for select
  using (auth.uid() = user_id);
