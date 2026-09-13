-- Triage state for error_logs.
--
-- The admin Errors page was read-only, so every row looked equally urgent
-- forever. An admin can now tick rows and mark them addressed (or reopen
-- them); the page defaults to the open queue.
--
-- Deliberately a status on the row, not a separate table: each row is one
-- occurrence, and "addressed" means "someone looked at this occurrence".
-- New occurrences of the same failure arrive as new rows with status 'open',
-- which is exactly what should happen if a fix didn't hold.
--
-- Access posture is unchanged from 066: service role only.

alter table public.error_logs
  add column if not exists status      text not null default 'open',
  add column if not exists addressed_at timestamptz,
  add column if not exists addressed_by uuid;  -- admin user id; no FK, like user_id

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'error_logs_status_check'
  ) then
    alter table public.error_logs
      add constraint error_logs_status_check check (status in ('open', 'addressed'));
  end if;
end $$;

-- The default view is "open, newest first".
create index if not exists error_logs_status_idx on public.error_logs (status, occurred_at desc);
