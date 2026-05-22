-- Captures phone numbers that tried to sign in but aren't registered yet.
-- One row per phone (primary key). Each new sign-in attempt bumps
-- attempts + last_attempt_at via upsert. Rows get deleted by create-profile
-- when the same phone actually completes sign-up.
--
-- The table is admin-only by default — RLS is enabled but no public read
-- policy is added; ops queries from the admin app go through service role.

create table if not exists public.leads (
  phone text primary key,
  role_attempted text,
  attempts int not null default 1,
  source text not null default 'signin_attempt',
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists leads_last_attempt_idx on public.leads (last_attempt_at desc);

alter table public.leads enable row level security;
