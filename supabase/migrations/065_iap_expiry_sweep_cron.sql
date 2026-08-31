-- Schedule the iap-expiry-sweep Edge Function hourly.
--
-- Why it needs to exist at all: iap-notifications answers 200 even when it
-- cannot act, because a non-2xx makes Apple and Google retry into a storm.
-- That trade is only safe if something else eventually catches what was
-- dropped — a Pub/Sub outage, a deploy window, a notification that never
-- fired. This is that something. It re-reads any subscription the ledger
-- still believes is live but whose expiry has passed, and applies the store's
-- answer: renewed subscribers are corrected back to active, genuine lapses
-- lose the plan.
--
-- Hourly rather than more often: the sweep is a backstop, not the primary
-- path. RTDN and App Store Server Notifications deliver within seconds on the
-- happy path, and the function already waits 60 minutes past expiry before
-- acting so an in-flight renewal is never yanked. A tighter cadence would add
-- Play/Apple API calls without shortening the worst case meaningfully.
--
-- Runs at :20 past, away from the payouts cron on */15 and the 21:45/21:50
-- referral jobs, so the ticks do not pile onto the same minute.
--
-- Auth mirrors 025_payouts_cron: the x-cron-secret shared secret rather than a
-- service-role JWT, which Postgres would otherwise have to hold. Same
-- CRON_SECRET, so rotation stays a single change in Supabase function secrets
-- plus a re-run of these two migrations.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent — unschedule any prior version before rescheduling.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-iap-expiry-sweep') THEN
    PERFORM cron.unschedule('rgossips-iap-expiry-sweep');
  END IF;
END$$;

SELECT cron.schedule(
  'rgossips-iap-expiry-sweep',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hlfevcdtbehukxrrgykv.supabase.co/functions/v1/iap-expiry-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '767346d160047d79002b4500dc3f0e69d420b4da90b6fc49e168b93d796925ee'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
