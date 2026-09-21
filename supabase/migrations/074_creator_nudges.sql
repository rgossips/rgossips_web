-- Creator nudges (admin portal: /dashboard/nudges).
--
-- Re-engagement emails + in-app pushes sent to creators — subscription
-- sequence, inactivity, free-application limit, incomplete profile. Sent by
-- an admin (manual) or, once the switch below is on, by the admin portal's
-- scheduled job (auto). The admin portal owns all reads and writes through
-- the service role, so RLS is on with no policies: nothing is exposed to the
-- consumer app's anon/authenticated roles.

-- One row per creator per nudge sent. Eligibility rules read this to never
-- repeat a one-off nudge, to space the subscription sequence, and to cap
-- every creator at one nudge per 48 hours.
create table if not exists public.creator_nudge_sends (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  nudge_key text not null,
  channels text[] not null default '{}',
  mode text not null default 'manual' check (mode in ('manual', 'auto')),
  sent_by uuid,
  sent_at timestamptz not null default now()
);
create index if not exists creator_nudge_sends_user_idx on public.creator_nudge_sends (user_id, nudge_key, sent_at desc);
create index if not exists creator_nudge_sends_sent_at_idx on public.creator_nudge_sends (sent_at desc);
alter table public.creator_nudge_sends enable row level security;

-- Creators who clicked "unsubscribe" in a nudge email. They get no further
-- nudges on any channel.
create table if not exists public.creator_nudge_opt_outs (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.creator_nudge_opt_outs enable row level security;

-- Single-row settings. auto_enabled = the "Automatic" switch on the page;
-- off by default, so nothing is sent until an admin turns it on.
create table if not exists public.creator_nudge_settings (
  id boolean primary key default true check (id),
  auto_enabled boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
insert into public.creator_nudge_settings (id) values (true) on conflict (id) do nothing;
alter table public.creator_nudge_settings enable row level security;
