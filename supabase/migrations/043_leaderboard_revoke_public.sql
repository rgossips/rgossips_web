-- 041 revoked the leaderboard RPC's EXECUTE from `anon` but not from
-- PUBLIC, so anon still inherited it and the function stayed callable
-- unauthenticated (verified against the live DB). This applies the
-- complete revoke to the already-migrated database. 041's source was
-- also corrected so fresh deploys don't need this file, but it's kept as
-- a no-op-safe migration for environments that already ran 041.
REVOKE EXECUTE ON FUNCTION public.get_referral_leaderboard(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(int) TO authenticated;
