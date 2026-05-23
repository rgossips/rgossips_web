-- device_sessions: per-device record powering the Trusted Devices UI.
-- Each device is identified by a client-generated UUID kept in localStorage
-- (so the same UUID is reused across page loads on that device). On every
-- sign-in or app open we upsert (user_id, device_id) and refresh last_active.
-- The TrustedDevices page lists rows and lets the user flip is_active=false;
-- the AuthContext polls this column and signs out when its own row goes
-- inactive.

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  user_agent text,
  device_name text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (user_id, device_id)
);

create index if not exists device_sessions_user_active_idx
  on public.device_sessions (user_id, last_active_at desc);

alter table public.device_sessions enable row level security;

drop policy if exists "device_sessions_read_own" on public.device_sessions;
create policy "device_sessions_read_own" on public.device_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "device_sessions_insert_own" on public.device_sessions;
create policy "device_sessions_insert_own" on public.device_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "device_sessions_update_own" on public.device_sessions;
create policy "device_sessions_update_own" on public.device_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
