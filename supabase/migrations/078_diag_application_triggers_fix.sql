-- 077's second branch called pg_get_functiondef() over every function in
-- public, which errors on aggregates ("array_agg is an aggregate function")
-- and took the whole query down with it. Restrict to plain functions.

CREATE OR REPLACE FUNCTION public._diag_application_triggers()
RETURNS TABLE (kind text, name text, detail text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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

  SELECT
    'function'::text,
    p.proname::text,
    left(pg_get_functiondef(p.oid), 400)::text
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'          -- not aggregates, not window, not procedures
    AND (
      pg_get_functiondef(p.oid) ILIKE '%Application Approved!%'
      OR pg_get_functiondef(p.oid) ILIKE '%campaign_approved%'
    );
$$;

REVOKE ALL ON FUNCTION public._diag_application_triggers() FROM PUBLIC, anon, authenticated;
