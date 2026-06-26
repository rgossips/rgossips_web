-- Rate-limit log for whatsapp-otp-sender.
--
-- Each call appends one row (phone + ip + sent_at). The sender reads
-- recent rows to enforce three caps:
--   1. 60-second cooldown per phone
--   2. ≤ 5 sends per phone per rolling hour
--   3. ≤ 20 sends per IP per rolling hour
--
-- Without this, an unauthenticated attacker could drain the WhatsApp
-- balance by spamming this endpoint (each send costs money).
--
-- Rows older than 24h are pruned via the cleanup helper below so the
-- table stays bounded — the rolling window only ever looks back 1h.

CREATE TABLE IF NOT EXISTS public.otp_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  ip text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Hot read paths: (phone, sent_at DESC) for the cooldown + phone-cap
-- checks; (ip, sent_at DESC) for the IP cap.
CREATE INDEX IF NOT EXISTS otp_send_log_phone_sent_at_idx
  ON public.otp_send_log (phone, sent_at DESC);
CREATE INDEX IF NOT EXISTS otp_send_log_ip_sent_at_idx
  ON public.otp_send_log (ip, sent_at DESC)
  WHERE ip IS NOT NULL;

-- Service-role only — the client must never see other users' send
-- history.
ALTER TABLE public.otp_send_log ENABLE ROW LEVEL SECURITY;
-- (no policies = no client access; only service_role bypasses RLS)

-- Pruning helper. Call from pg_cron daily to keep the table bounded.
CREATE OR REPLACE FUNCTION public.prune_otp_send_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_send_log
  WHERE sent_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Schedule the prune to run hourly. Idempotent — unschedule any prior
-- version before re-scheduling so re-running this migration is safe.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rgossips-prune-otp-log') THEN
    PERFORM cron.unschedule('rgossips-prune-otp-log');
  END IF;
END$$;

SELECT cron.schedule(
  'rgossips-prune-otp-log',
  '17 * * * *',
  $$ SELECT public.prune_otp_send_log(); $$
);
