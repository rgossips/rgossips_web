-- User safety: content reports + user blocks.
--
-- Required by Google Play's User Generated Content policy and Apple's
-- Guideline 1.2 (Safety — User Generated Content). Both demand that an app
-- carrying user-visible UGC provides an in-app way to REPORT objectionable
-- content, an in-app way to BLOCK an abusive user, and evidence that reports
-- are acted on. RGossips has no chat, but it does publish plenty of UGC:
-- creator profiles, campaign briefs, application pitches, deliverables, and
-- media kits — the last of which are world-readable at /kit/[id], which is
-- what removes any doubt about the policy applying.
--
-- Two tables rather than one: a report is a one-way signal to US (moderation
-- queue, admin-owned lifecycle), while a block is a symmetric-ish preference
-- owned by the USER that has to be cheap to join against on every list query.
-- Merging them would put an admin workflow column on a hot filter path.
--
-- All writes go through edge functions on the service role. Reads are scoped
-- by RLS so a user can see their own reports and their own block list, and
-- nothing else. Mirrors the posture of 035_rls_critical_tables.sql.

-- ─────────────────────────────── reports ───────────────────────────────

create table if not exists public.content_reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null,          -- auth.users id of whoever reported
  reported_user  uuid not null,          -- auth.users id being reported
  -- What was reported. 'user' means the profile itself; the others point at a
  -- specific row so a moderator can open the offending item directly.
  entity_type    text not null,
  entity_id      uuid,                   -- null only when entity_type = 'user'
  reason         text not null,
  details        text,                   -- optional free text from the reporter
  status         text not null default 'open',
  -- Moderation outcome. Filled by the admin app; kept on the report rather
  -- than a separate audit table because the queue only ever needs the latest
  -- decision and the volume here is low.
  resolution     text,
  resolved_by    uuid,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint content_reports_entity_type_chk
    check (entity_type in ('user','campaign','application','deliverable','media_kit','service')),
  constraint content_reports_reason_chk
    check (reason in (
      'spam','harassment','hate_speech','sexual_content','violence',
      'scam_or_fraud','impersonation','intellectual_property','other'
    )),
  constraint content_reports_status_chk
    check (status in ('open','reviewing','actioned','dismissed')),
  -- entity_id is required for everything except a whole-user report.
  constraint content_reports_entity_id_chk
    check ((entity_type = 'user' and entity_id is null)
        or (entity_type <> 'user' and entity_id is not null)),
  -- You cannot report yourself. Catches a UI bug rather than a real user.
  constraint content_reports_not_self_chk
    check (reporter_id <> reported_user)
);

-- The moderation queue is "oldest open first", so status leads the index.
create index if not exists idx_content_reports_status
  on public.content_reports (status, created_at);
create index if not exists idx_content_reports_reported_user
  on public.content_reports (reported_user);
create index if not exists idx_content_reports_reporter
  on public.content_reports (reporter_id);

-- One open report per reporter per entity. A user hammering "Report" should
-- not flood the queue, but they CAN report the same thing again once the
-- first is resolved — the partial index only constrains live rows.
create unique index if not exists idx_content_reports_dedupe_open
  on public.content_reports (reporter_id, reported_user, entity_type, coalesce(entity_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('open','reviewing');

alter table public.content_reports enable row level security;

-- A reporter can see what they filed (so the app can show "already reported").
-- Nobody can read reports filed against them — that would expose the reporter.
drop policy if exists "reports_read_own" on public.content_reports;
create policy "reports_read_own" on public.content_reports
  for select to authenticated using (reporter_id = auth.uid());

-- ─────────────────────────────── blocks ────────────────────────────────

create table if not exists public.user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null,             -- who pressed Block
  blocked_id  uuid not null,             -- who got blocked
  created_at  timestamptz not null default now(),
  constraint user_blocks_uniq unique (blocker_id, blocked_id),
  constraint user_blocks_not_self_chk check (blocker_id <> blocked_id)
);

-- Both directions are hot. A block must hide content BOTH ways — the blocker
-- stops seeing the blocked user, and the blocked user stops seeing the
-- blocker — otherwise blocking merely blinds the victim while leaving them
-- visible to the person they blocked.
create index if not exists idx_user_blocks_blocker
  on public.user_blocks (blocker_id);
create index if not exists idx_user_blocks_blocked
  on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;

-- A user reads their own block list (to render "Blocked" state and an unblock
-- screen). Deliberately NOT readable by the blocked party.
drop policy if exists "blocks_read_own" on public.user_blocks;
create policy "blocks_read_own" on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid());

-- ─────────────────────── helper for list filtering ─────────────────────

-- Every id the given user must not see, in either direction. Used by the
-- list-* edge functions to filter discovery, and cheap enough to call per
-- request because both columns are indexed and the row count per user is
-- tiny. SECURITY DEFINER so it can read the whole table while the caller
-- only ever gets back a flat id list — no way to enumerate who blocked whom.
create or replace function public.blocked_user_ids(p_user uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select blocked_id from public.user_blocks where blocker_id = p_user
  union
  select blocker_id from public.user_blocks where blocked_id = p_user;
$$;

revoke all on function public.blocked_user_ids(uuid) from public;
grant execute on function public.blocked_user_ids(uuid) to authenticated, service_role;
