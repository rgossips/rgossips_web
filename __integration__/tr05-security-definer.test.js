/**
 * TR-05 / A-32 — SECURITY DEFINER function EXECUTE audit
 *
 * These functions bypass RLS by design, so the grant IS the boundary. The
 * strategy: "assert EXECUTE is revoked where intended, that the search path is
 * pinned, and that only fields intended to be public are returned."
 *
 * THE DIFFERENTIAL, which is the whole technique. Calling an RPC with the
 * publishable key gives an unambiguous verdict:
 *     revoked  -> HTTP 401 with code 42501 "permission denied for function"
 *     open     -> HTTP 200 with a result
 * A third outcome, HTTP 404 / PGRST202, means the ARGUMENTS did not match a
 * signature — it says nothing about the grant. Every probe below therefore
 * sends a correct signature, or the result would be meaningless. (This is how
 * migration 059's open grant on blocked_user_ids was missed on first reading
 * and then caught: with no argument it 404s, with p_user it answered 200.)
 *
 * SAFETY: only READ-ONLY functions are probed. The mutating ones —
 * bump_ai_usage, bump_landing_match, consume_otp_attempt, expire_reward_credits,
 * expire_pending_referrals, claim_brand_invitation, migrate_invitation_campaigns,
 * prune_otp_send_log, generate_service_order_number — are NEVER called, because
 * if a grant were open the call itself would mutate the live project. Their
 * posture is audited statically by qa/checks/rpc-grants.mjs instead.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { rpc, requireEnv, isPermissionDenied } from "./safety.js";

const NIL = "00000000-0000-0000-0000-000000000000";

/**
 * Read-only RPCs that MUST be revoked from anon, with the correct signature so
 * the probe is conclusive. These are the regression guards — each one passing
 * proves a boundary still holds.
 */
const MUST_BE_REVOKED = {
  // Reads the whole user_blocks table (SECURITY DEFINER) for an arbitrary uuid.
  // Locked down by migration 060 after this exact probe found it open.
  blocked_user_ids: { p_user: NIL },
  // Referral graph: who referred whom.
  get_my_referrer: {},
  // Aggregate referral economics across all users.
  get_referral_admin_stats: {},
  // Capped at 100 rows but still cross-user; revoked by migrations 041 + 043.
  get_referral_leaderboard: { top_n: 1 },
  // AI spend per user — cost and usage data.
  ai_usage_by_user: { p_from: "2026-01-01", p_to: "2026-01-02", p_limit: 1 },
  ai_usage_rollup: { p_from: "2026-01-01", p_to: "2026-01-02" },
};

/**
 * Read-only RPCs anon CAN currently execute. Each is a registered finding; the
 * red assertion lives in __findings__/f18-anon-executable-rpcs.test.js.
 * Listed here so this suite documents the real boundary without double-failing.
 */
const KNOWN_OPEN = {
  is_admin: "F-18 — role oracle for an arbitrary uuid",
  is_super_admin: "F-18 — role oracle for an arbitrary uuid",
  is_influencer: "F-18 — role oracle for an arbitrary uuid",
  is_brand: "F-18 — role oracle for an arbitrary uuid",
  is_app_admin: "F-18 — role oracle",
  get_my_referral_rank: "F-18 — auth.uid()-scoped, returns [] to anon; revoke anyway",
  check_phone_exists: "F-19 — phone-number enumeration oracle",
  check_brand_invitation: "F-19 — Instagram-handle enumeration oracle",
};

beforeAll(() => requireEnv());

describe("TR-05 / A-32 — functions that must stay revoked from anon", () => {
  it.each(Object.entries(MUST_BE_REVOKED))(
    "%s is revoked (42501, not 200)",
    async (name, args) => {
      const r = await rpc(name, args);

      // Guard against a meaningless probe: a 404/PGRST202 means the signature
      // drifted, so this assertion is no longer testing the grant at all.
      expect(r.body?.code).not.toBe("PGRST202");
      expect({ [name]: isPermissionDenied(r) ? "revoked" : `OPEN (${r.status})` }).toEqual({
        [name]: "revoked",
      });
    },
  );
});

describe("TR-05 / A-32 — the audit itself stays honest", () => {
  it("every probed signature still resolves (no silent PGRST202 drift)", async () => {
    const drifted = [];
    for (const [name, args] of Object.entries(MUST_BE_REVOKED)) {
      const r = await rpc(name, args);
      if (r.body?.code === "PGRST202") drifted.push(name);
    }
    // A drifted signature turns a security assertion into a no-op that still
    // shows green. Fail loudly instead.
    expect({ drifted }).toEqual({ drifted: [] });
  }, 60000);

  it("the known-open list is still accurate (nothing silently closed)", async () => {
    // If one of these gets fixed, this test tells us to close the finding
    // rather than leaving a stale red test in __findings__.
    const nowClosed = [];
    for (const name of Object.keys(KNOWN_OPEN)) {
      const args =
        name.startsWith("is_") && name !== "is_app_admin"
          ? { uid: NIL }
          : name === "check_phone_exists"
            ? { phone_number: "+19999999999" }
            : name === "check_brand_invitation"
              ? { ig_username: "__nonexistent__" }
              : {};
      const r = await rpc(name, args);
      if (isPermissionDenied(r)) nowClosed.push(name);
    }
    expect({ nowClosed }).toEqual({ nowClosed: [] });
  }, 60000);
});
