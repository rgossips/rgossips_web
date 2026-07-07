-- Admin activity log — dual purpose:
--   1. Rate limiting for the admin portal's sensitive actions (email sends,
--      invites, bulk imports, status toggles) — count rows for an
--      (action, actor) pair within a rolling window.
--   2. Audit trail — who did what, when (money-moving + comms actions).
--
-- Written ONLY by the admin app's service-role client. RLS is enabled with
-- no policies so no anon/authenticated (RLS-respecting) client can read or
-- write it; the service role bypasses RLS.

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    uuid,
  action      text NOT NULL,
  target      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Rate-limit lookups filter by (action, actor_id, created_at) — index it.
CREATE INDEX IF NOT EXISTS admin_activity_log_ratelimit_idx
  ON public.admin_activity_log (action, actor_id, created_at DESC);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (which bypasses RLS) may
-- touch this table.

-- Optional retention helper — callers/cron can prune old rows. Kept as a
-- function so a scheduled job can `SELECT public.prune_admin_activity_log(30)`.
CREATE OR REPLACE FUNCTION public.prune_admin_activity_log(keep_days int DEFAULT 30)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_activity_log
  WHERE created_at < now() - (keep_days || ' days')::interval;
$$;
