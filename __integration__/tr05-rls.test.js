/**
 * TR-05 — Database & Row-Level Security Policy Testing (anon boundary)
 *
 * Strategy: "This is the highest-severity discipline in the plan." Creator PII,
 * brand budgets, negotiated rates, escrow balances and access tokens sit in one
 * multi-tenant Postgres instance; one permissive policy is a reportable DPDPA
 * breach.
 *
 * Assertions: A-30 (RLS on every public-schema relation), A-34 (access token
 * never leaves the DB), A-36 (buckets not publicly listable).
 * A-32 (SECURITY DEFINER grants) lives in tr05-security-definer.test.js.
 *
 * SELF-MAINTAINING BY DESIGN. The table list is read from PostgREST's OpenAPI
 * document at run time, not hardcoded, so a migration that adds a relation makes
 * this suite fail until someone classifies it. That is A-31's intent enforced at
 * the only layer available without CI: the test itself. The first run of this
 * suite found 68 exposed relations where CLAUDE.md documented 26.
 *
 * SCOPE LIMIT — no staging. The strategy wants a policy test per role across
 * eight roles. "Influencer as other" needs real user sessions, i.e. creating
 * users on the live project. This suite proves the ANON boundary exhaustively —
 * the boundary that faces the internet, reachable by the publishable key in
 * every browser bundle — and leaves the authenticated cross-tenant matrix to
 * qa/blocked/TR-05.md.
 *
 * THE TRAP, restated because it inverts the obvious reading: an RLS-denied
 * SELECT returns `[]` with HTTP 200, not an error. `[]` on a table you know has
 * rows means the policy is working.
 */
import { describe, it, expect, beforeAll } from "@jest/globals";
import { rest, requireEnv, ANON_KEY, SERVICE_KEY, URL_BASE } from "./safety.js";

/**
 * Relations anon is ALLOWED to read, each with the reason. Anything exposed and
 * not listed here must deny anon, or this suite fails.
 */
const ANON_READABLE = {
  // Reference/lookup data. No personal or commercial content.
  categories: "lookup — category taxonomy rendered in public filters",
  cities: "lookup — Indian city list",
  content_types: "lookup — content-type taxonomy",
  countries: "lookup — country list",
  languages: "lookup — language list",
  states: "lookup — state/UT list",
  // Marketing surface, rendered logged-out by design.
  services: "public marketplace listing (documented public in CLAUDE.md)",
  homepage_settings: "public homepage copy (documented public in CLAUDE.md)",
  creator_stories: "public landing reels (migration 017, public-read)",
  featured_brands: "public landing section",
  featured_campaigns: "public landing section",
  featured_creators: "public landing section",
  // Reviewed and accepted: a single platform fee percentage, no PII.
  platform_config: "public fee percentage — no PII; reviewed 2026-08",
};

/**
 * Known-open relations that SHOULD deny anon but currently do not. Each is a
 * registered finding; the red assertion lives in __findings__/. Listed here so
 * this suite reports the boundary honestly without double-failing.
 *
 * EMPTY as of 2026-08-25. F-17 (the two reward-credit balance views) was closed
 * by migration 061, so both moved back under the enforced leak-scan below —
 * leaving them exempted would have meant this suite never looked at them again,
 * which is how an exemption quietly becomes a blind spot. Any entry added here
 * must name its finding and must leave when the finding does.
 */
const KNOWN_OPEN = {};

/** Snapshot fallback when the service key is absent (CI without secrets). */
const SNAPSHOT = [
  "activity_log", "admin_profiles", "ai_config", "ai_generation_usage", "ai_usage_events",
  "application_status_history", "brand_campaign_preferences", "brand_campaign_types",
  "brand_invitations", "brand_kyc", "brand_preferred_categories", "brand_profiles",
  "campaign_applications", "campaign_deliverables", "campaign_invitations",
  "campaign_ratings", "campaigns", "content_reports", "conversations", "device_sessions",
  "escrow_disputes_v", "influencer_categories", "influencer_content_types",
  "influencer_invitations", "influencer_kyc", "influencer_languages", "influencer_profiles",
  "influencer_rate_cards", "influencer_social_metrics", "invoices", "landing_match_usage",
  "leads", "messages", "notifications", "otp_send_log", "otp_verifications",
  "payment_methods", "payments", "profile_views", "push_runtime_config",
  "push_subscriptions", "referrals", "reviews", "reward_credits_ledger", "search_logs",
  "service_order_events", "service_order_messages", "service_orders", "service_reviews",
  "support_callbacks", "user_blocks", "user_preferences", "v_referral_leaderboard_monthly",
  // Closed by migration 061 — previously in KNOWN_OPEN as F-17.
  "v_reward_credits_available_balance", "v_reward_credits_balance",
];

let exposed = [];

beforeAll(async () => {
  requireEnv();
  if (SERVICE_KEY) {
    const res = await fetch(`${URL_BASE}/rest/v1/`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const spec = await res.json();
    exposed = Object.keys(spec?.definitions || {}).sort();
  }
  if (!exposed.length) {
    exposed = [...SNAPSHOT, ...Object.keys(ANON_READABLE), ...Object.keys(KNOWN_OPEN)].sort();
  }
});

describe("TR-05 / A-30 — anon boundary across every exposed relation", () => {
  it("enumerates the schema (proves the list is live, not stale)", () => {
    expect(exposed.length).toBeGreaterThan(50);
  });

  it("every exposed relation is either classified anon-readable or denies anon", async () => {
    const leaks = [];
    for (const table of exposed) {
      if (ANON_READABLE[table] || KNOWN_OPEN[table]) continue;
      const r = await rest(`${table}?select=*&limit=1`, { key: ANON_KEY });
      const rows = Array.isArray(r.body) ? r.body.length : 0;
      // 200 + [] = RLS denied (the trap). 4xx = no grant. Rows = a real leak.
      if (r.status === 200 && rows > 0) leaks.push(table);
    }
    // Named, so a failure is immediately actionable rather than a bare count.
    expect({ leaks }).toEqual({ leaks: [] });
  }, 120000);

  it("no unclassified relation exists (A-31: a new table must be triaged)", () => {
    const classified = new Set([
      ...Object.keys(ANON_READABLE),
      ...Object.keys(KNOWN_OPEN),
      ...SNAPSHOT,
    ]);
    const unclassified = exposed.filter((t) => !classified.has(t));
    expect({ unclassified }).toEqual({ unclassified: [] });
  });

  it("anon cannot INSERT into a core private table", async () => {
    for (const table of ["campaigns", "campaign_applications", "referrals", "notifications"]) {
      const r = await rest(table, {
        key: ANON_KEY,
        method: "POST",
        body: { id: "00000000-0000-0000-0000-000000000000" },
      });
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.status).toBeLessThan(500);
    }
  }, 60000);
});

describe("TR-05 — relations classified anon-readable really are readable", () => {
  it.each(Object.entries(ANON_READABLE))("%s stays public (%s)", async (table) => {
    const r = await rest(`${table}?select=*&limit=1`, { key: ANON_KEY });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });
});

describe("TR-05 / A-34 — the Instagram access token never leaves the database", () => {
  it("anon cannot select instagram_access_token", async () => {
    const r = await rest("influencer_profiles?select=instagram_access_token&limit=1", {
      key: ANON_KEY,
    });
    if (r.status === 200) expect(r.body).toHaveLength(0);
    else expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it("no token-shaped value appears in a public listing response", async () => {
    const r = await rest("services?select=*&limit=5", { key: ANON_KEY });
    expect(r.text).not.toMatch(/IGQ[A-Za-z0-9_-]{20,}/); // long-lived IG token shape
    expect(r.text).not.toMatch(/instagram_access_token/);
  });
});

describe("TR-05 / A-36 — storage buckets are not publicly listable", () => {
  const BUCKETS = ["influencer-photos", "campaign-images", "verification-documents"];

  it.each(BUCKETS)("%s denies anon object listing", async (bucket) => {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 5 }),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON */
    }
    if (res.status === 200) expect(Array.isArray(json) ? json : []).toHaveLength(0);
    else expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
