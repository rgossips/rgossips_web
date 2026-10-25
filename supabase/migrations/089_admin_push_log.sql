-- Which ops items each admin has already been pushed about.
--
-- THE PROBLEM THIS SOLVES. Admin "notifications" are derived, not stored:
-- the bell polls the source tables and computes what is awaiting action
-- (see the admin portal's lib/ops-streams.ts). That works for a badge,
-- which can recompute the same answer forever, and is exactly wrong for a
-- push, which must fire once.
--
-- A campaign sitting in review is in the feed every single time the feed is
-- computed. Without a record of what has already gone out, an hourly job
-- would buzz every admin's phone about the same campaign every hour until
-- someone approved it. notifications_push_after_insert (migration 056) fans
-- EVERY notifications row out to web push and FCM, so there is no safety
-- net downstream — the dedupe has to happen before the insert.
--
-- One row per (admin, item). The unique index IS the dedupe: the producer
-- inserts with ON CONFLICT DO NOTHING and only notifies about the rows that
-- were actually created, which is race-safe across overlapping runs in a
-- way that "select then insert" is not.

create table if not exists public.admin_push_log (
  id          uuid primary key default gen_random_uuid(),
  -- The admin this went to. References auth.users because admins are auth
  -- users like anyone else — that is why they can receive a notifications
  -- row and an FCM push at all.
  admin_id    uuid not null references auth.users(id) on delete cascade,
  -- "<stream>:<row id>", e.g. "campaignReviews:8a221274-…". Stable for the
  -- life of the thing being flagged, so re-running cannot duplicate it.
  item_key    text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists admin_push_log_admin_item_uniq
  on public.admin_push_log (admin_id, item_key);

-- Housekeeping reads: "what went out recently", and the purge below.
create index if not exists admin_push_log_created_idx
  on public.admin_push_log (created_at);

-- Service-role only. Nothing in either client app reads or writes this; it
-- exists solely so a scheduled job can remember what it has already sent.
alter table public.admin_push_log enable row level security;

comment on table public.admin_push_log is
  'Dedupe ledger for admin ops push. One row per (admin, item); the unique index prevents a second push about the same thing. Written only by the admin portal''s scheduled producer.';

comment on column public.admin_push_log.item_key is
  'stream:rowId. Must stay stable while the item is outstanding, or the item would be pushed again under a new key.';
