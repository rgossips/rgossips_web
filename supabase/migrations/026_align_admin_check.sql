-- Align with the admin app's existing `admin_profiles` table instead of
-- maintaining a parallel `app_admins`. Migration 024 created app_admins
-- before we realised the admin app already had its own table; this
-- collapses them.
--
-- admin_profiles is owned by the rgossips-admin repo's migration set
-- (001_admin_profiles.sql there). We just need to point our is_app_admin
-- helper at it.

DROP FUNCTION IF EXISTS public.is_app_admin();

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

-- Now safe to drop the stub table — nothing references it.
DROP TABLE IF EXISTS public.app_admins CASCADE;
