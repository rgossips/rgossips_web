-- RazorpayX is no longer in the payout flow — admin processes payouts
-- manually via the new /dashboard/payouts queue. Unschedule the cron
-- so we stop firing payouts-cron every 15 minutes against an account
-- we don't use anymore.
--
-- The function file (supabase/functions/payouts-cron) is intentionally
-- left on disk in case we switch back to an automated payout rail.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-payouts-cron') THEN
    PERFORM cron.unschedule('rgossips-payouts-cron');
  END IF;
END$$;
