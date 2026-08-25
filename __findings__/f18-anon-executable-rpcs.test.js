/**
 * F-18 — Role-check RPCs are executable by anon  [NEW, found by TR-05 / A-32]
 * F-19 — Phone and handle enumeration oracles     [NEW, found by TR-05 / A-32]
 *
 * Severity: F-18 S3, F-19 S3 leaning S2 (membership disclosure is personal data
 * under the DPDP Act, and the strategy makes A-25 "identical response for
 * registered and unregistered numbers" an explicit requirement).
 *
 * Verified live 2026-08-20 with the publishable key, using correct argument
 * signatures so each result reflects the GRANT and not an argument miss:
 *
 *   is_admin{uid}         -> 200 false      is_super_admin{uid} -> 200 false
 *   is_influencer{uid}    -> 200 false      is_brand{uid}       -> 200 false
 *   is_app_admin{}        -> 200 false      get_my_referral_rank{} -> 200 []
 *   check_phone_exists{phone_number} -> 200 false
 *   check_brand_invitation{ig_username} -> 200 {"found": false}
 *
 * For contrast, correctly revoked functions in the same probe answered
 * 401/42501: get_my_referrer, get_referral_admin_stats, get_referral_leaderboard,
 * blocked_user_ids, ai_usage_by_user, ai_usage_rollup.
 *
 * WHY IT MATTERS
 *   F-18: the is_* family accepts an ARBITRARY uuid, so anon can ask "is this
 *   user an admin?" about anyone. It is a role oracle, and it is the kind of
 *   primitive that turns a leaked uuid into a targeting list.
 *   F-19: check_phone_exists answers whether any given phone number is
 *   registered. That is account enumeration and membership disclosure.
 *
 * THE PRODUCT TENSION, stated honestly: signup genuinely needs a pre-auth
 * "is this number known?" check to route between sign-in and sign-up, and the
 * `check-phone-exists` EDGE FUNCTION exists for exactly that. What is hard to
 * justify is the raw RPC being additionally reachable, unrated and unlogged.
 * The edge function can carry a rate limit; the PostgREST endpoint carries none.
 * So the fix is to revoke the RPC from anon and leave the product path alone —
 * not to remove the capability.
 *
 * FIX: revoke execute on each from anon (by name — see migration 060's lesson
 * that revoking from PUBLIC leaves Supabase's direct anon grant intact).
 *
 * EXPECTED TO FAIL until then.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { rpc, requireEnv, isPermissionDenied } from "../__integration__/safety.js";

const NIL = "00000000-0000-0000-0000-000000000000";

beforeAll(() => requireEnv());

describe("F-18 — role-check RPCs must be revoked from anon", () => {
  // CLOSED by migration 062 — these are now regression guards.
  //
  // is_app_admin() is deliberately absent. It takes no arguments and answers
  // only about the caller, so for anon it is always false: there is no oracle,
  // because you cannot ask it about anyone else. It is also called from inside
  // the ash_admin_read RLS policy (migration 028:62), which has no TO clause and
  // so applies to anon — revoking EXECUTE there would turn an anon SELECT on
  // application_status_history from an empty result into a hard "permission
  // denied for function". Grouping it with the real oracles was over-scoping on
  // my part; see 062's header for the full reasoning.
  const ROLE_ORACLES = {
    is_admin: { uid: NIL },
    is_super_admin: { uid: NIL },
    is_influencer: { uid: NIL },
    is_brand: { uid: NIL },
    get_my_referral_rank: {},
  };

  it.each(Object.entries(ROLE_ORACLES))("%s is not executable by anon", async (name, args) => {
    const r = await rpc(name, args);
    expect({ [name]: isPermissionDenied(r) ? "revoked" : `executable (${r.status})` }).toEqual({
      [name]: "revoked",
    });
  });

  it("an arbitrary user id cannot be tested for admin status", async () => {
    // The oracle property: anon supplies someone else's id and learns a fact
    // about their privileges.
    const r = await rpc("is_admin", { uid: "8d965b83-4e30-4f41-8f11-376f36248d9f" });
    expect(isPermissionDenied(r)).toBe(true);
  });
});

describe("F-19 — enumeration oracles must not be reachable via PostgREST", () => {
  it("check_phone_exists is not executable by anon", async () => {
    const r = await rpc("check_phone_exists", { phone_number: "+19999999999" });
    expect({ check_phone_exists: isPermissionDenied(r) ? "revoked" : "executable" }).toEqual({
      check_phone_exists: "revoked",
    });
  });

  it("check_brand_invitation is not executable by anon", async () => {
    const r = await rpc("check_brand_invitation", { ig_username: "__nonexistent__" });
    expect({ check_brand_invitation: isPermissionDenied(r) ? "revoked" : "executable" }).toEqual({
      check_brand_invitation: "revoked",
    });
  });
});
