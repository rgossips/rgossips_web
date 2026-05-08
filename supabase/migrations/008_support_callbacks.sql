-- Callback requests submitted from the in-app support chat.
-- Each user can insert + read their own rows; ops/admin tooling will read all
-- via the service role.

create table if not exists public.support_callbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text,
  topic text,
  topic_path text,            -- e.g. "campaigns > application_rejected"
  preferred_time text,
  phone text,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists support_callbacks_user_id_idx on public.support_callbacks (user_id);
create index if not exists support_callbacks_status_idx on public.support_callbacks (status);

alter table public.support_callbacks enable row level security;

drop policy if exists "support_callbacks_insert_own" on public.support_callbacks;
create policy "support_callbacks_insert_own"
  on public.support_callbacks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "support_callbacks_read_own" on public.support_callbacks;
create policy "support_callbacks_read_own"
  on public.support_callbacks
  for select
  using (auth.uid() = user_id);
