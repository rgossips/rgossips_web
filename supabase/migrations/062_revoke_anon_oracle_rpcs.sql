-- F-18 / F-19: revoke the anon-executable role and enumeration oracles.
--
-- Found by the TR-05/A-32 grant audit (__integration__/tr05-security-definer.test.js),
-- which probes each read-only RPC with the publishable key and reads the verdict
-- off the response: 42501 means revoked, 200 means anyone with the browser
-- bundle's key can call it. Eight answered 200.
--
-- ── What is actually a leak, and what is not ────────────────────────────────
--
-- The four functions below take an ARBITRARY uuid. That is what makes them
-- oracles: anon supplies someone else's id and learns a fact about them.
--   is_admin(uuid), is_super_admin(uuid), is_influencer(uuid), is_brand(uuid)
--
-- check_phone_exists(text) and check_brand_invitation(text) are the same shape
-- against a different identifier: hand them a phone number or an Instagram
-- handle and they answer whether it is registered. Account enumeration and
-- membership disclosure, and the strategy's A-25 explicitly requires
-- "identical response for registered and unregistered numbers".
--
-- get_my_referral_rank() takes no arguments and is scoped to auth.uid(), so it
-- returns [] to anon and leaks nothing. Revoked anyway — it has no anonymous
-- use case, both callers (web /influencer/refer, mobile ReferScreen) hold a
-- user session, and shrinking the anon-reachable surface is free here.
--
-- ── What is deliberately NOT revoked ────────────────────────────────────────
--
-- public.is_app_admin() stays granted to anon, for two reasons:
--
--   1. It takes no arguments and answers only about the CALLER. For anon it is
--      always false. There is no oracle: you cannot ask it about anyone else.
--
--   2. It is called from inside an RLS policy — ash_admin_read on
--      application_status_history (migration 028:62), which has no TO clause and
--      therefore applies to every role including anon. Function permissions are
--      checked when a policy expression is evaluated, so revoking EXECUTE from
--      anon would turn an anon SELECT on that table from an empty result into a
--      hard "permission denied for function is_app_admin". That trades a
--      non-leak for a behaviour change on a table anon can already not read.
--
-- Recording this rather than revoking everything that answered 200: a blanket
-- revoke would have looked more thorough and been strictly worse.
--
-- ── Callers checked before writing this ─────────────────────────────────────
--
--   get_my_referral_rank  -> src/app/influencer/refer/page.js:94 and mobile
--                            ReferScreen.tsx:126, both as an authenticated user
--   check_phone_exists    -> supabase/functions/check-uniqueness/index.ts:37,
--                            on the service role
--   is_admin/is_super_admin/is_influencer/is_brand
--                         -> no callers in web, mobile or admin
--
-- Nothing calls these with the publishable key, so nothing loses access.
-- IMPORTANT for F-19: this revokes the RPC, NOT the check-phone-exists edge
-- function. Signup needs that pre-auth check to route between sign-in and
-- sign-up, and the function can carry a rate limit where the PostgREST endpoint
-- cannot. Removing the capability would break signup; removing the unrated path
-- to it is the fix.
--
-- Revoke names anon EXPLICITLY. REVOKE ... FROM PUBLIC does not remove it —
-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE on new public-schema
-- functions to anon directly. Migrations 059/060 and 061 all turned on this.
--
-- Rollback: grant execute on function public.<name>(<args>) to anon;

revoke execute on function public.is_admin(uuid) from anon;
revoke execute on function public.is_super_admin(uuid) from anon;
revoke execute on function public.is_influencer(uuid) from anon;
revoke execute on function public.is_brand(uuid) from anon;

revoke execute on function public.check_phone_exists(text) from anon;
revoke execute on function public.check_brand_invitation(text) from anon;

revoke execute on function public.get_my_referral_rank() from anon;

-- Keep the paths the product actually uses.
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_super_admin(uuid) to authenticated, service_role;
grant execute on function public.is_influencer(uuid) to authenticated, service_role;
grant execute on function public.is_brand(uuid) to authenticated, service_role;
grant execute on function public.check_phone_exists(text) to service_role;
grant execute on function public.check_brand_invitation(text) to service_role;
grant execute on function public.get_my_referral_rank() to authenticated, service_role;
