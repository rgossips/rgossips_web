-- Landing-page AI matcher rate limit.
--
-- The public `landing-match` edge function fronts a real LLM call + a full
-- influencer scan for UNAUTHENTICATED visitors, so it needs a server-side
-- abuse cap that can't be bypassed by clearing sessionStorage. Fixed-window
-- counter keyed by an opaque string (per-session id, or a hashed IP backstop),
-- bumped race-safely under a row lock — same pattern as consume_otp_attempt.

CREATE TABLE IF NOT EXISTS public.landing_match_usage (
  match_key    text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count        int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_match_usage ENABLE ROW LEVEL SECURITY;
-- No policies → service role only (the edge function). No client ever reads it.

-- Returns (allowed, remaining). Increments the window's counter and resets the
-- window once p_window_secs has elapsed. allowed=false when the cap is hit.
CREATE OR REPLACE FUNCTION public.bump_landing_match(
  p_key         text,
  p_max         int  DEFAULT 5,
  p_window_secs int  DEFAULT 86400
)
RETURNS TABLE (allowed boolean, remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.landing_match_usage%ROWTYPE;
BEGIN
  SELECT * INTO rec
  FROM public.landing_match_usage
  WHERE match_key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.landing_match_usage (match_key, window_start, count, updated_at)
    VALUES (p_key, now(), 1, now());
    RETURN QUERY SELECT true, GREATEST(p_max - 1, 0);
    RETURN;
  END IF;

  -- Window elapsed → reset.
  IF now() - rec.window_start >= make_interval(secs => p_window_secs) THEN
    UPDATE public.landing_match_usage
      SET window_start = now(), count = 1, updated_at = now()
      WHERE match_key = p_key;
    RETURN QUERY SELECT true, GREATEST(p_max - 1, 0);
    RETURN;
  END IF;

  -- Cap reached.
  IF rec.count >= p_max THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  UPDATE public.landing_match_usage
    SET count = rec.count + 1, updated_at = now()
    WHERE match_key = p_key;
  RETURN QUERY SELECT true, GREATEST(p_max - (rec.count + 1), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bump_landing_match(text, int, int) FROM PUBLIC, anon, authenticated;
