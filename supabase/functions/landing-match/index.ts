// Public landing-page matcher. Turns a brand's free-text brief into structured
// filters via the LLM, then returns REAL matching creators by reusing the
// list-influencers scan (so privacy toggles + invite merge stay honoured).
//
// Unauthenticated (visitors have no session), so it enforces its own abuse cap:
// a per-session run limit + a hashed-IP hourly backstop, both via
// bump_landing_match (migration 054). Deploy PUBLIC:
//   npx supabase functions deploy landing-match --no-verify-jwt
//
// Body: { prompt, sessionId? }. Returns { influencers, total, summary, filters, remaining }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiGenerate } from "../_shared/ai.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Must mirror src/utils/categories.js exactly — the LLM picks from this list and
// list-influencers filters against the same stored category strings.
const CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Lifestyle",
  "Food & Beverage",
  "Health, Fitness & Wellness",
  "Travel & Hospitality",
  "Technology & Gadgets",
  "Parenting & Family",
  "Home & Decor",
  "Finance & Personal Finance",
  "Education & Career",
  "Gaming & Entertainment",
  "Automobile & Mobility",
  "Entrepreneurship & Business",
  "Sustainable & Eco-conscious Living",
  "Pet Care & Animals",
];
// Must mirror FOLLOWER_RANGES keys in list-influencers.
const FOLLOWER_BUCKETS = ["0 - 10k", "10k - 50k", "50k - 100k", "100k - 500k", "500k - 1M", "1M+"];

// Per-session run cap (the "per session limit" surfaced to the user) + a
// coarser hashed-IP hourly backstop so rotating the sessionId can't farm the LLM.
const SESSION_MAX = 5;
const SESSION_WINDOW = 86400; // 24h
const IP_MAX = 25;
const IP_WINDOW = 3600; // 1h

const RESULT_LIMIT = 6;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function extractJson(text: string): any {
  const t = String(text || "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("no_json");
  return JSON.parse(t.slice(first, last + 1));
}

const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rid = crypto.randomUUID().slice(0, 8);
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });

    const body = (await req.json().catch(() => ({}))) as { prompt?: string; sessionId?: string };
    const prompt = String(body?.prompt || "").trim().slice(0, 400);
    const sessionId = String(body?.sessionId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    if (prompt.length < 2) return json({ error: "empty_prompt" });

    // ── Rate limit ───────────────────────────────────────────────────
    // Authenticated callers (a logged-in brand using the brand-home matcher)
    // get a much higher, per-user cap — the 5/session guest limit is only to
    // stop anonymous abuse of the public landing prompt. functions.invoke
    // sends the user's access_token as Bearer when signed in; the publishable
    // key resolves to no user.
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    let authedUserId: string | null = null;
    if (token) {
      const { data: userRes } = await admin.auth.getUser(token);
      authedUserId = userRes?.user?.id || null;
    }

    let remaining = SESSION_MAX;
    if (authedUserId) {
      const BRAND_MAX = 100; // per rolling day, keyed by user id
      const { data: uRes } = await admin.rpc("bump_landing_match", {
        p_key: `u:${authedUserId}`,
        p_max: BRAND_MAX,
        p_window_secs: SESSION_WINDOW,
      });
      const u = Array.isArray(uRes) ? uRes[0] : uRes;
      if (!(u?.allowed ?? true)) return json({ error: "rate_limited", remaining: 0 });
      remaining = Math.max(0, u?.remaining ?? BRAND_MAX);
    } else {
      const ipRaw = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "0.0.0.0";
      const ipHash = await sha256Hex(ipRaw + "|landing-match");
      const sessKey = sessionId ? `s:${sessionId}` : `ip:${ipHash}`;

      const { data: sessRes } = await admin.rpc("bump_landing_match", {
        p_key: sessKey,
        p_max: SESSION_MAX,
        p_window_secs: SESSION_WINDOW,
      });
      const sess = Array.isArray(sessRes) ? sessRes[0] : sessRes;

      const { data: ipRes } = await admin.rpc("bump_landing_match", {
        p_key: `ip:${ipHash}`,
        p_max: IP_MAX,
        p_window_secs: IP_WINDOW,
      });
      const ip = Array.isArray(ipRes) ? ipRes[0] : ipRes;

      const sessAllowed = sess?.allowed ?? true;
      const ipAllowed = ip?.allowed ?? true;
      remaining = Math.max(0, Math.min(sess?.remaining ?? SESSION_MAX, SESSION_MAX));
      if (!sessAllowed || !ipAllowed) {
        return json({ error: "rate_limited", remaining: 0 });
      }
    }

    // ── LLM: brief → structured filters ──────────────────────────────
    const filters = { categories: [] as string[], locations: [] as string[], followerBuckets: [] as string[], query: "" };
    let summary = "";
    try {
      const system =
        "You convert a brand's free-text brief into structured influencer-search filters for an Indian creator marketplace. " +
        "Respond with ONLY minified JSON (no prose, no code fences) matching: " +
        '{"categories":string[],"locations":string[],"followerBuckets":string[],"query":string,"summary":string}. ' +
        `- categories: zero or more chosen EXACTLY from this list: ${CATEGORIES.join("; ")}. Pick the closest fits; use [] if none apply. ` +
        '- locations: Indian city names explicitly mentioned (e.g. "Mumbai"); [] if none. ' +
        `- followerBuckets: zero or more EXACTLY from: ${FOLLOWER_BUCKETS.join(", ")}. ` +
        'Infer from phrasing — "100K+" → ["100k - 500k","500k - 1M","1M+"], "micro creators" → ["10k - 50k","50k - 100k"], "nano" → ["0 - 10k"]; [] if unspecified. ' +
        "- query: 1-4 lowercase keywords (product / niche words) for free-text search; \"\" if nothing specific. " +
        "- summary: one upbeat sentence, max 15 words, describing the creators being found. " +
        "Never ask a question — there is no chat, your JSON is consumed directly.";
      const r = await aiGenerate(admin, {
        taskClass: "cheap",
        system,
        messages: [{ role: "user", content: prompt }],
        maxTokens: 300,
        temperature: 0.3,
      });
      const parsed = extractJson(r.text);
      filters.categories = asArray(parsed.categories).filter((c) => CATEGORIES.includes(c));
      filters.locations = asArray(parsed.locations).slice(0, 5);
      filters.followerBuckets = asArray(parsed.followerBuckets).filter((b) => FOLLOWER_BUCKETS.includes(b));
      filters.query = String(parsed.query || "").trim().slice(0, 80);
      summary = String(parsed.summary || "").trim().slice(0, 140);
    } catch (e) {
      // AI down / bad JSON → degrade to a raw keyword search so results still show.
      log.warn?.("landing_match.ai_parse_failed", { rid }, e as any);
      filters.query = prompt.slice(0, 80);
    }

    // ── Real creators via list-influencers (reuses privacy + invite merge) ──
    const callList = async (payload: Record<string, unknown>) => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/list-influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      return { rows: Array.isArray(d?.influencers) ? d.influencers : [], total: Number(d?.total || 0) };
    };

    const wireFilters = {
      categories: filters.categories,
      locations: filters.locations,
      followerBuckets: filters.followerBuckets,
    };
    let { rows, total } = await callList({ limit: RESULT_LIMIT, q: filters.query, filters: wireFilters, sort: "followers_desc" });

    // Progressive fallback so the brief never dead-ends on an empty grid:
    // drop the follower band, then the free-text query, then show top creators.
    if (rows.length === 0 && (filters.followerBuckets.length || filters.query)) {
      ({ rows, total } = await callList({
        limit: RESULT_LIMIT,
        q: filters.query,
        filters: { categories: filters.categories, locations: filters.locations },
        sort: "followers_desc",
      }));
    }
    if (rows.length === 0 && filters.categories.length) {
      ({ rows, total } = await callList({ limit: RESULT_LIMIT, filters: { categories: filters.categories }, sort: "followers_desc" }));
    }
    if (rows.length === 0) {
      ({ rows, total } = await callList({ limit: RESULT_LIMIT, sort: "followers_desc" }));
    }

    // Shape + heuristic fit score for the card (we have no real ER on this path).
    const wantCats = new Set(filters.categories);
    const wantLoc = filters.locations.map((s) => s.toLowerCase());
    const influencers = rows.map((r: any, i: number) => {
      const cats: string[] = Array.isArray(r.categories) ? r.categories : [];
      const catHit = cats.some((c) => wantCats.has(c));
      const city = String(r.city || "").toLowerCase();
      const locHit = wantLoc.length > 0 && city && wantLoc.some((l) => city.includes(l) || l.includes(city));
      let fit = 78;
      if (catHit) fit += 12;
      if (locHit) fit += 6;
      if ((r.followers_count || 0) >= 10_000) fit += 3;
      fit = Math.min(99, fit - i); // gentle ranking decay so the grid reads as ranked
      return {
        id: String(r.influencer_id || i),
        name: r.full_name || r.username || r.instagram_handle || "Creator",
        handle: r.instagram_handle || r.username || "",
        photo: r.profile_photo_url || "",
        followers: r.followers_count || 0,
        category: cats[0] || "",
        city: r.city || "",
        fit,
      };
    });

    log.info?.("landing_match", { rid, cats: filters.categories.length, loc: filters.locations.length, results: influencers.length });
    return json({ influencers, total, summary, filters, remaining });
  } catch (e) {
    log.error?.("landing_match.failed", { rid }, e as any);
    return json({ error: "match_failed" });
  }
});
