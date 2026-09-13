-- Central error log.
--
-- Errors were console-only: edge functions emitted JSON lines to the Supabase
-- log drain and the web app swallowed most failures into a popup. Nobody could
-- answer "how often does Instagram connect fail?" or "did that brand's payment
-- error?" without tailing logs at the moment it happened.
--
-- Shape notes:
--   * `area` is the product surface (instagram, signin, payment, …) — the axis
--     an admin actually filters on. `event` is the precise machine key
--     ("escrow.fund.order_failed") for grouping within an area.
--   * user_id is deliberately NOT a foreign key to auth.users. A deleted user
--     must not take their error history with them, and an FK would either
--     cascade the rows away or block the delete.
--   * `context` holds whatever else the call site knew. Everything that gets
--     filtered on is a real column; jsonb is for the long tail.
--
-- RLS is enabled with NO policies, the same posture as ai_config: only the
-- service role reads or writes. The admin console queries it through a
-- service-role server action behind requireAdmin(); the anon and authenticated
-- roles must never see this table — it aggregates failure patterns across
-- every user and is a reconnaissance gift if exposed.

create table if not exists public.error_logs (
  id            uuid primary key default gen_random_uuid(),
  occurred_at   timestamptz not null default now(),

  -- Where it happened.
  source        text not null check (source in ('web', 'mobile', 'admin', 'edge')),
  area          text not null,
  event         text not null,
  severity      text not null default 'error' check (severity in ('warn', 'error', 'fatal')),

  -- What happened.
  message       text,
  stack         text,
  status_code   int,

  -- Who / which request.
  user_id       uuid,
  user_role     text,
  request_id    text,
  fn            text,          -- edge function slug, when source = 'edge'
  path          text,          -- route or URL, when source is a client
  user_agent    text,
  ip_hash       text,          -- hashed, never the raw address

  context       jsonb not null default '{}'::jsonb
);

comment on table public.error_logs is
  'Application errors from every surface. Service-role only; read by the admin console.';

-- The admin list is "newest first, optionally filtered", so every index leads
-- with the filter column and ends on occurred_at desc to serve the sort.
create index if not exists error_logs_occurred_idx  on public.error_logs (occurred_at desc);
create index if not exists error_logs_area_idx      on public.error_logs (area, occurred_at desc);
create index if not exists error_logs_severity_idx  on public.error_logs (severity, occurred_at desc);
create index if not exists error_logs_source_idx    on public.error_logs (source, occurred_at desc);
create index if not exists error_logs_event_idx     on public.error_logs (event, occurred_at desc);
create index if not exists error_logs_user_idx      on public.error_logs (user_id, occurred_at desc)
  where user_id is not null;

alter table public.error_logs enable row level security;

-- Belt and braces on top of "no policies". Supabase's ALTER DEFAULT PRIVILEGES
-- grants on new public-schema tables to anon/authenticated directly, so RLS
-- alone is not the whole story — migrations 060 and 063 are the scar tissue
-- from exactly this. Revoke from PUBLIC *and* by name.
revoke all on public.error_logs from public;
revoke all on public.error_logs from anon;
revoke all on public.error_logs from authenticated;
grant all on public.error_logs to service_role;
