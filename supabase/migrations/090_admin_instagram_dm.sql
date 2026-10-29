-- Instagram DM tracking for the admin team.
--
-- WHY THIS EXISTS. Outreach to creators happens in Instagram DMs and nothing
-- in the product can see it. The outreach tracker asks "has this creator
-- replied?" and the only answer available today is an admin remembering. So
-- an admin connects their OWN Instagram professional account and we read
-- their message threads into these tables, where the rest of the portal can
-- join them to creators, campaigns and bookings.
--
-- WHAT IT DELIBERATELY IS NOT. It does not send cold DMs, because Meta does
-- not allow it: the Instagram Messaging API can only send inside a 24-hour
-- window that opens when the USER messages the business first (7 days with
-- the separately-approved HUMAN_AGENT tag). A per-day send cap was the
-- original ask and is moot — the limit on first contact is zero. First
-- contact stays a human pressing send in the Instagram app, which is what
-- the `ig.me/m/<handle>` links on the scouting and find-creators pages are
-- for.
--
-- WHY PER-ADMIN AND NOT ONE SHARED ACCOUNT. The team already DMs from their
-- own handles; a shared account would mean re-establishing every thread.
-- Each row here is one admin's connection, and the threads under it are that
-- admin's inbox.
--
-- ACCESS. Service-role only, like campaign_bookings' money columns: every
-- reader is a gated server action in the admin portal, and the tokens in
-- here are live Instagram credentials. There is no authenticated policy at
-- all, so a creator's or brand's session can never see a row — including
-- their own messages, which are not theirs to read from our side.

-- ── The admin's connected account ───────────────────────────────────────
create table if not exists public.admin_instagram_accounts (
  -- One account per admin. The admin IS the key: connecting again replaces
  -- the connection rather than accumulating stale tokens.
  admin_id            uuid primary key,
  ig_user_id          text not null,
  username            text,
  name                text,
  profile_picture_url text,
  -- A long-lived Instagram token (60 days). Refreshable while it is still
  -- valid; once expired the admin has to reconnect, which is why
  -- token_expires_at is read on every page load rather than only on failure.
  access_token        text not null,
  token_expires_at    timestamptz,
  -- What the token was actually granted. Messaging needs
  -- instagram_business_manage_messages, and an account connected before that
  -- scope was approved will not have it — stored so the page can say "this
  -- connection cannot read messages" instead of failing every sync.
  scopes              text[] not null default '{}',
  connected_at        timestamptz not null default now(),
  -- The last successful read, shown on the page. Null means never synced.
  last_synced_at      timestamptz,
  -- The last sync's error, cleared on success. Surfaced rather than only
  -- logged: a connection that silently stopped working looks identical to
  -- an inbox with nothing new in it.
  last_error          text,
  constraint admin_instagram_accounts_ig_user_uniq unique (ig_user_id)
);

comment on table public.admin_instagram_accounts is
  'One row per admin who has connected their Instagram professional account for DM tracking. Service-role only — holds live access tokens.';

-- ── One row per conversation ────────────────────────────────────────────
create table if not exists public.admin_instagram_threads (
  id                  uuid primary key default gen_random_uuid(),
  admin_id            uuid not null,
  -- Instagram's conversation id.
  ig_thread_id        text not null,
  -- The other party. An Instagram-scoped id: stable for this app + this
  -- account pair, and NOT the creator's public id, so it cannot be joined to
  -- anything outside these tables.
  participant_igsid   text,
  -- Their handle, which IS joinable — it is what influencer_profiles and
  -- influencer_invitations store. Read off a message's from/to rather than a
  -- participants field: that field needs Conversation Routing enabled on the
  -- account and is absent on most.
  participant_username text,
  participant_name    text,
  -- Denormalised from the newest message so a thread list costs one query.
  last_message_at     timestamptz,
  last_message_text   text,
  -- 'in' = they spoke last (we owe them a reply), 'out' = we did.
  last_direction      text,
  -- Have they EVER written to us? This is the question the outreach tracker
  -- wants answered, and it is not the same as "there are messages here" —
  -- a thread can be nothing but our own unanswered sends.
  has_inbound         boolean not null default false,
  first_inbound_at    timestamptz,
  -- Admin-maintained, so a handled thread stops competing for attention.
  is_archived         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint admin_instagram_threads_uniq unique (admin_id, ig_thread_id),
  constraint admin_instagram_threads_direction_chk
    check (last_direction is null or last_direction in ('in', 'out'))
);

create index if not exists idx_admin_ig_threads_admin
  on public.admin_instagram_threads (admin_id, last_message_at desc nulls last);
-- The join that makes this useful: find the thread for a creator's handle.
create index if not exists idx_admin_ig_threads_username
  on public.admin_instagram_threads (lower(participant_username));
create index if not exists idx_admin_ig_threads_inbound
  on public.admin_instagram_threads (admin_id, has_inbound, last_message_at desc nulls last);

comment on table public.admin_instagram_threads is
  'One Instagram DM conversation belonging to a connected admin account. participant_username is the join key to influencer_profiles / influencer_invitations.';

-- ── Append-only messages ────────────────────────────────────────────────
--
-- This table is the whole reason the feature stores anything at all: the
-- Instagram API will only return details for the 20 MOST RECENT messages in
-- a conversation, and asking for an older one fails with a "deleted" error.
-- So history is only obtainable by reading it before it ages out, and a row
-- written here is the only copy we will ever have.
create table if not exists public.admin_instagram_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.admin_instagram_threads (id) on delete cascade,
  -- Instagram's message id. The dedupe key: a sync re-reads the recent tail
  -- of every thread, so without this each run would duplicate it.
  mid           text not null,
  direction     text not null,
  -- Null for an attachment-only message (a reel share, a photo). Stored as
  -- null rather than '' so "no text" and "empty text" stay distinguishable.
  body          text,
  -- Shares return only the media URL, per Meta's own note, so this holds
  -- whatever the API gave rather than pretending to a richer shape.
  attachments   jsonb,
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  constraint admin_instagram_messages_mid_uniq unique (thread_id, mid),
  constraint admin_instagram_messages_direction_chk check (direction in ('in', 'out'))
);

create index if not exists idx_admin_ig_messages_thread
  on public.admin_instagram_messages (thread_id, sent_at desc nulls last);

comment on table public.admin_instagram_messages is
  'Append-only Instagram DM history. The API only serves the 20 most recent messages per conversation, so these rows are the only durable copy.';

-- ── RLS: nothing but service_role ───────────────────────────────────────
alter table public.admin_instagram_accounts enable row level security;
alter table public.admin_instagram_threads  enable row level security;
alter table public.admin_instagram_messages enable row level security;

-- No policies are created on purpose. With RLS on and no policy, every
-- authenticated and anonymous request reads zero rows, while service_role
-- bypasses RLS entirely. Matching the posture of 035_rls_critical_tables.sql
-- for tables a client has no business touching.
revoke all on public.admin_instagram_accounts from authenticated, anon;
revoke all on public.admin_instagram_threads  from authenticated, anon;
revoke all on public.admin_instagram_messages from authenticated, anon;
