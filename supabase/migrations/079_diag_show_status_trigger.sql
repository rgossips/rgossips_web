-- Show the whole body of notify_campaign_status_change.
--
-- It is the second sender: a trigger on campaign_applications
-- (campaign_status_notification) that exists in the database but in no
-- migration — schema drift, like the hand-deployed `bright-responder`
-- function. It has been writing "Application Approved! 🎉" since 2026-04,
-- and update-application-status now writes its own richer notification for
-- the same event, so creators get both.
--
-- Read it in full before deciding what to keep. Dropped in 080.

CREATE OR REPLACE FUNCTION public._diag_application_triggers()
RETURNS TABLE (kind text, name text, detail text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT 'function'::text, p.proname::text, pg_get_functiondef(p.oid)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'notify_campaign_status_change';
$$;

REVOKE ALL ON FUNCTION public._diag_application_triggers() FROM PUBLIC, anon, authenticated;
