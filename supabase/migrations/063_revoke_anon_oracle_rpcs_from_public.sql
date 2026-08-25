-- Completes 062. The revokes there did not take effect, and the reason is worth
-- writing down because it is the MIRROR IMAGE of the lesson 062's own header
-- cited from migration 060.
--
--   060's lesson: `REVOKE ... FROM PUBLIC` does not remove anon's grant,
--                 because Supabase grants to anon DIRECTLY.
--   062's mistake: `REVOKE ... FROM anon` does not remove PUBLIC's grant,
--                 and anon INHERITS whatever PUBLIC holds.
--
-- Both are true at once. A function is only closed to anon when the grant is
-- gone from both PUBLIC and anon by name — which is exactly what migration 060
-- did (three revoke lines: public, anon, authenticated) and what 062 did not.
-- 062 applied cleanly and changed nothing observable; the TR-05 grant audit
-- still reported all eight RPCs answering 200 afterwards, which is how this was
-- caught rather than assumed.
--
-- Scope is unchanged from 062, including the deliberate exclusion of
-- public.is_app_admin() — no arguments, answers only about the caller, and
-- called from inside the ash_admin_read RLS policy where an anon revoke would
-- turn an empty result into a hard permission error. See 062's header for the
-- full reasoning and the caller audit.
--
-- Rollback: grant execute on function public.<name>(<args>) to anon;

revoke execute on function public.is_admin(uuid) from public;
revoke execute on function public.is_super_admin(uuid) from public;
revoke execute on function public.is_influencer(uuid) from public;
revoke execute on function public.is_brand(uuid) from public;
revoke execute on function public.check_phone_exists(text) from public;
revoke execute on function public.check_brand_invitation(text) from public;
revoke execute on function public.get_my_referral_rank() from public;

-- Belt and braces: re-run the anon revokes so this migration is complete on its
-- own if 062 is ever rolled back independently.
revoke execute on function public.is_admin(uuid) from anon;
revoke execute on function public.is_super_admin(uuid) from anon;
revoke execute on function public.is_influencer(uuid) from anon;
revoke execute on function public.is_brand(uuid) from anon;
revoke execute on function public.check_phone_exists(text) from anon;
revoke execute on function public.check_brand_invitation(text) from anon;
revoke execute on function public.get_my_referral_rank() from anon;

-- Restore the paths the product actually uses. These must come AFTER the PUBLIC
-- revoke, or the revoke strips them again.
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_super_admin(uuid) to authenticated, service_role;
grant execute on function public.is_influencer(uuid) to authenticated, service_role;
grant execute on function public.is_brand(uuid) to authenticated, service_role;
grant execute on function public.check_phone_exists(text) to service_role;
grant execute on function public.check_brand_invitation(text) to service_role;
grant execute on function public.get_my_referral_rank() to authenticated, service_role;
