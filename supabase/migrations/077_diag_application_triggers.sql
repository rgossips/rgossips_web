-- Diagnostic: what else writes a notification when an application is approved?
--
-- A creator who is approved gets TWO notifications 250ms apart: "Application
-- approved" (update-application-status, JSON body, since 2026-09) and
-- "Application Approved! 🎉" (type campaign_approved, plain-string body,
-- since 2026-04). The second one is not in ANY repo — not web, not admin, not
-- mobile, not a migration — so it lives in the database or in something
-- deployed by hand.
--
-- This function exists only to see it. It is SECURITY DEFINER because
-- pg_proc/pg_trigger are not reachable through PostgREST, and it is granted
-- to NOBODY: only the service role (which bypasses grants) can call it.
-- Migration 078 drops it again.

CREATE OR REPLACE FUNCTION public._diag_application_triggers()
RETURNS TABLE (kind text, name text, detail text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  -- Triggers on the tables an approval touches.
  SELECT
    'trigger'::text,
    t.tgname::text,
    (c.relname || ' -> ' || p.proname)::text
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal
    AND c.relname IN ('campaign_applications', 'notifications')

  UNION ALL

  -- Any function whose body mentions the mystery copy or its type.
  SELECT
    'function'::text,
    p.proname::text,
    left(pg_get_functiondef(p.oid), 400)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND (
      pg_get_functiondef(p.oid) ILIKE '%Application Approved!%'
      OR pg_get_functiondef(p.oid) ILIKE '%campaign_approved%'
    );
$$;

REVOKE ALL ON FUNCTION public._diag_application_triggers() FROM PUBLIC, anon, authenticated;
