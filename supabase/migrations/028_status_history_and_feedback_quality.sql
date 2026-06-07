-- Brand Trust Score — backfilling the two missing inputs:
--   1. application_status_history: every status change with a timestamp,
--      so we can compute the P4 response-time SLAs (decision ≤48h,
--      draft feedback ≤48h, final acceptance ≤48h) and accurate revision
--      round counts for P2.
--   2. campaign_ratings.feedback_quality: the 4th sub-rating per the
--      spec (Influencer Reviews pillar) — completes the 4-axis blend.

--------------------------------------------------------------------------
-- 1. campaign_applications status-change log
--------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.campaign_applications(id) ON DELETE CASCADE,
  from_status     text,                              -- null on initial insert
  to_status       text NOT NULL,
  changed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_role text CHECK (changed_by_role IN ('brand','influencer','admin','system')),
  reason          text,                              -- optional free-form note
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_status_history_app_idx
  ON public.application_status_history (application_id, created_at DESC);

-- Brand-side trust score queries scan transitions across all of a brand's
-- applications, joined through campaign_applications → campaigns.brand_id.
-- A covering index makes that scan O(log n) instead of a full table read.
CREATE INDEX IF NOT EXISTS application_status_history_status_idx
  ON public.application_status_history (to_status, from_status, created_at);

ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- Brand can read history for applications on their own campaigns.
DROP POLICY IF EXISTS "ash_brand_read" ON public.application_status_history;
CREATE POLICY "ash_brand_read" ON public.application_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM public.campaign_applications a
        JOIN public.campaigns c ON c.campaign_id = a.campaign_id
       WHERE a.id = application_status_history.application_id
         AND c.brand_id = auth.uid()
    )
  );

-- Influencer can read history for their own applications.
DROP POLICY IF EXISTS "ash_influencer_read" ON public.application_status_history;
CREATE POLICY "ash_influencer_read" ON public.application_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM public.campaign_applications a
       WHERE a.id = application_status_history.application_id
         AND a.influencer_id = auth.uid()
    )
  );

-- Admins read everything.
DROP POLICY IF EXISTS "ash_admin_read" ON public.application_status_history;
CREATE POLICY "ash_admin_read" ON public.application_status_history
  FOR SELECT USING (public.is_app_admin());

-- Writes only via service_role / edge functions — no client-direct insert
-- (would let an actor backdate transitions and game the trust score).

--------------------------------------------------------------------------
-- 2. Backfill — synthesise a single 'current' row for every existing
-- application so older rows aren't invisible to the new trust-score
-- logic. We tag these as the system actor and stamp them with the
-- application's `updated_at` (best available proxy for when the status
-- last changed).
--------------------------------------------------------------------------
INSERT INTO public.application_status_history (application_id, from_status, to_status, changed_by_role, created_at)
SELECT a.id, NULL, a.status, 'system', COALESCE(a.updated_at, a.created_at, now())
  FROM public.campaign_applications a
  LEFT JOIN public.application_status_history h ON h.application_id = a.id
 WHERE h.id IS NULL;

--------------------------------------------------------------------------
-- 3. campaign_ratings.feedback_quality — the 4th sub-rating per spec.
--    Mirrors brief_clarity / fairness: nullable int 1–5, influencer-only.
--------------------------------------------------------------------------
ALTER TABLE public.campaign_ratings
  ADD COLUMN IF NOT EXISTS feedback_quality int CHECK (feedback_quality BETWEEN 1 AND 5);
