-- Schedule the payouts-cron Edge Function to run every 15 minutes.
--
-- Uses pg_cron + pg_net (both available in Supabase by default). The
-- function URL is hardcoded to this project's ref so we don't need to
-- thread it through database settings.
--
-- Auth: we don't pass the service role JWT (which would have to live
-- in the cron job source). Instead the function verifies an
-- x-cron-secret header that the cron job sends; the secret lives only
-- in (1) Postgres settings (set once below) and (2) the function's
-- Supabase secret. Rotating it is `ALTER DATABASE ... SET` + `supabase
-- secrets set`.
--
-- 15-min cadence balances latency for "Elite — instant" payouts (worst
-- case: 15 min from button click) against DB load.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent — unschedule any prior version before rescheduling.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-payouts-cron') THEN
    PERFORM cron.unschedule('rgossips-payouts-cron');
  END IF;
END$$;

-- The cron secret is inlined into the schedule body. Supabase's migration
-- role can't ALTER DATABASE (no superuser), and Vault would add a hop per
-- tick — for v1 we accept that the secret is visible in pg_cron.job to
-- anyone with service-role DB access (which is anyway the platform's
-- highest privilege). Rotate by re-running this migration with a new
-- value and updating CRON_SECRET in Supabase function secrets.
SELECT cron.schedule(
  'rgossips-payouts-cron',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlfevcdtbehukxrrgykv.supabase.co/functions/v1/payouts-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '767346d160047d79002b4500dc3f0e69d420b4da90b6fc49e168b93d796925ee'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
