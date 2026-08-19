-- Close the anon EXECUTE grant on blocked_user_ids().
--
-- 059 revoked the function from PUBLIC and granted it to authenticated +
-- service_role, which reads as locked down but is not: Supabase ships
-- ALTER DEFAULT PRIVILEGES granting EXECUTE on new public-schema functions
-- to anon directly, so anon holds its own grant that a REVOKE ... FROM
-- PUBLIC does not touch. Verified against the live project — a correctly
-- revoked function (get_referral_admin_stats) answers anon with 42501,
-- while blocked_user_ids answered 200. Same trap as 041 -> 043, mirrored:
-- there the anon revoke landed without the PUBLIC one.
--
-- This matters because the function is SECURITY DEFINER over the whole of
-- user_blocks and takes an arbitrary p_user, so EXECUTE is enough to read
-- any user's block list with the publishable key that ships in every
-- browser bundle — precisely what user_blocks' RLS ("deliberately NOT
-- readable by the blocked party") exists to prevent.
--
-- service_role is the only grantee it needs: the sole callers are the
-- list-* edge functions, which build a service-role client and pass the
-- viewer id they resolved themselves (see _shared/blocks.ts). authenticated
-- goes too — a signed-in caller could otherwise pass any uuid and enumerate
-- someone else's blocks. A client that ever needs this should get a
-- self-scoped wrapper that ignores its argument in favour of auth.uid(),
-- not a grant on this one.

revoke all on function public.blocked_user_ids(uuid) from public;
revoke all on function public.blocked_user_ids(uuid) from anon;
revoke all on function public.blocked_user_ids(uuid) from authenticated;
grant execute on function public.blocked_user_ids(uuid) to service_role;
