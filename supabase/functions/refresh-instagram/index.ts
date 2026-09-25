import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import { truncateText, wellFormed } from "../_shared/text.ts";
import { ensureBucket } from "../_shared/storage.ts";
import { log } from "../_shared/log.ts";
import { isCuratedReels, refreshReels } from "../_shared/ig-media.ts";

// Instagram accepts at most a 30-day since/until range; its own report uses 30.
const INSIGHTS_DAYS = 30;

// ISO-3166 code → English name for the kit ("IN" → "India"). Falls back to
// the code if the runtime has no Intl.DisplayNames.
const regionNames = (() => {
  try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; }
})();
const countryName = (code: string) => {
  try { return (code && regionNames?.of(code)) || code; } catch { return code; }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// The creator switched off the insights permission on Instagram's consent
// screen (or connected before it was requested). Code 10 is Graph's
// "Application does not have permission for this action". Nothing but a
// reconnect fixes it, so it is recorded on the profile rather than retried and
// logged on every refresh — see migration 073.
const isInsightsPermissionError = (e: { code?: unknown; message?: string } | undefined) =>
  Number(e?.code) === 10 || /does not have permission/i.test(e?.message || "");

serveWithLogging("refresh-instagram", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { userId, force, debug } = await req.json();
    // When debug=true we capture every raw Meta response and return them
    // verbatim in the function's response body so we can compare what the
    // Graph API hands us against what the IG app displays.
    const debugCaptures: Record<string, unknown> = {};

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    // Fetch stored token from DB
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("influencer_profiles")
      .select("instagram_access_token, instagram_token_expires_at, instagram_refreshed_at, top_reels, instagram_token_invalid_at")
      .eq("influencer_id", userId)
      .maybeSingle();
    // Already known to be dead? Then a repeat rejection is not news — the flag
    // is what the banner and the admin badge read. Without this, every app
    // open by the same creator wrote another token_rejected row.
    const tokenInvalidSince: string | null = profile?.instagram_token_invalid_at ?? null;

    if (dbError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (!profile.instagram_access_token) {
      return new Response(
        JSON.stringify({ error: "No Instagram token stored. Please reconnect Instagram." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Throttle: skip if refreshed within the last hour, unless force=true
    if (!force && profile.instagram_refreshed_at) {
      const lastRefresh = new Date(profile.instagram_refreshed_at).getTime();
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - lastRefresh < oneHour) {
        return new Response(
          JSON.stringify({ success: true, skipped: true, message: "Recently refreshed" }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    // Read separately and tolerantly: before migration 073 the column does not
    // exist, and naming it in the select above would fail the whole refresh.
    const { data: deniedRow } = await supabaseAdmin
      .from("influencer_profiles")
      .select("instagram_insights_denied_at")
      .eq("influencer_id", userId)
      .maybeSingle();
    const insightsDeniedSince: string | null = deniedRow?.instagram_insights_denied_at ?? null;

    let accessToken = profile.instagram_access_token;
    let tokenExpiresAt = profile.instagram_token_expires_at;

    // Step 1: Refresh token if it expires within 7 days
    if (tokenExpiresAt) {
      const expiryDate = new Date(tokenExpiresAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (expiryDate - Date.now() < sevenDays) {
        try {
          const refreshRes = await fetch(
            `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`
          );
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            accessToken = refreshData.access_token;
            const expiresIn = refreshData.expires_in || 5184000;
            tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
          }
        } catch (e) {
          console.error("Token refresh failed:", e?.message);
        }
      }
    }

    // Step 2: Fetch fresh profile data
    const profileRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`
    );
    const igProfile = await profileRes.json();
    if (debug) debugCaptures.profile = igProfile;

    if (igProfile.error) {
      // Token might be expired/revoked. Code 190 = the token itself is dead
      // (password change, revoked access, expiry): record it so the kit can
      // say its analytics are out of date. Not cleared here, and the token is
      // left in place — the Instagram-required gate would otherwise lock the
      // creator out of the whole dashboard.
      const deadToken = Number(igProfile.error?.code) === 190;
      if (deadToken) {
        await supabaseAdmin
          .from("influencer_profiles")
          .update({ instagram_token_invalid_at: new Date().toISOString() })
          .eq("influencer_id", userId)
          .is("instagram_token_invalid_at", null);
      }
      // Log the first rejection only. The creator's app retries on every open,
      // and a second row says nothing the flag (set above, cleared by the next
      // good refresh) doesn't already say. Any OTHER error still logs each
      // time — those are not a known, already-recorded state.
      if (!deadToken || !tokenInvalidSince) {
        log.persistWarn("instagram.refresh.token_rejected", { fn: "refresh-instagram", userId, igCode: igProfile.error?.code }, igProfile.error?.message);
      }
      return new Response(
        JSON.stringify({ error: "Instagram token expired. Please reconnect Instagram.", igError: igProfile.error.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 3: Fetch recent media for engagement calculation
    // Bumped limit from 25 → 100 so the "top reels" ranking sees a wider
    // window and more closely matches Instagram's in-app "Top posts" view.
    const mediaRes = await fetch(
      `https://graph.instagram.com/v22.0/me/media?fields=id,media_type,like_count,comments_count,timestamp,thumbnail_url,media_url,permalink,caption&limit=100&access_token=${encodeURIComponent(accessToken)}`
    );
    const mediaData = await mediaRes.json();

    let engagementRate = 0;
    let avgLikes = 0;
    let avgComments = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let totalInteractions = 0;
    let accountsEngaged = 0;

    const mediaPosts = mediaData?.data || [];

    if (mediaPosts.length > 0 && igProfile.followers_count > 0) {
      let totalLikes = 0;
      let totalComments = 0;

      for (const post of mediaPosts) {
        // Coerce null/undefined to 0 (Instagram returns null for some
        // fresh posts before metrics propagate)
        const likes = Number(post.like_count) || 0;
        const comments = Number(post.comments_count) || 0;
        totalLikes += likes;
        totalComments += comments;
      }

      avgLikes = Math.round(totalLikes / mediaPosts.length);
      avgComments = Math.round(totalComments / mediaPosts.length);
      engagementRate = parseFloat(
        (((totalLikes + totalComments) / mediaPosts.length / igProfile.followers_count) * 100).toFixed(2)
      );
    }

    // Account-level insights over an EXPLICIT 30-day window.
    //
    // Do not go back to `period=days_28&metric_type=total_value` without a
    // since/until: Instagram answers that with roughly the last 1–3 days, not
    // 28. It did so silently for every creator — @thecozyshot read 1,051
    // reach against a real 12,671 (views 4,180 vs 237,856). With since/until,
    // `period=day&metric_type=total_value` returns ONE de-duplicated total for
    // the whole window (reach is unique accounts, not a sum of days). 30 days
    // is the longest range the API accepts and what Instagram's own report
    // uses. Verified against the live API on 2026-09-16.
    const insightsUntil = Math.floor(Date.now() / 1000);
    const insightsSince = insightsUntil - INSIGHTS_DAYS * 86_400;
    const windowQs = `period=day&metric_type=total_value&since=${insightsSince}&until=${insightsUntil}`;
    const insights30: Record<string, number> = {};
    let insightsOk = false;
    let insightsDenied = false;
    try {
      // Split into two calls: one unsupported metric fails a whole request,
      // and `reposts` is newer than the rest.
      const MAIN_METRICS = "views,reach,total_interactions,accounts_engaged,likes,comments,shares,saves";
      for (const metrics of [MAIN_METRICS, "reposts"]) {
        const res = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=${metrics}&${windowQs}&access_token=${encodeURIComponent(accessToken)}`
        );
        const body = await res.json();
        if (debug) debugCaptures[`insights_30d_${metrics.split(",")[0]}`] = body;
        if (body?.error) {
          if (metrics === MAIN_METRICS && isInsightsPermissionError(body.error)) {
            // No insights permission at all: `reposts` and the breakdown
            // below need the same one, so stop here. Logged once, on the
            // refresh that first finds it — not on every refresh after.
            insightsDenied = true;
            if (!insightsDeniedSince) {
              log.persistWarn("instagram.refresh.insights_not_granted", { fn: "refresh-instagram", userId }, body.error?.message);
            }
            break;
          }
          log.persistWarn("instagram.refresh.insights_failed", { fn: "refresh-instagram", userId, metrics }, body.error?.message);
          continue;
        }
        for (const m of body?.data || []) {
          insights30[m.name] = Number(m?.total_value?.value) || 0;
          insightsOk = true;
        }
      }

      // Reel views specifically — Instagram's report leads with this, and the
      // account `views` total also counts stories, carousels and posts.
      if (!insightsDenied) {
        const byProduct = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=views&breakdown=media_product_type&${windowQs}&access_token=${encodeURIComponent(accessToken)}`
        ).then((r) => r.json());
        if (debug) debugCaptures.insights_30d_views_by_product = byProduct;
        for (const r of byProduct?.data?.[0]?.total_value?.breakdowns?.[0]?.results || []) {
          if (r?.dimension_values?.[0] === "REEL") insights30.reelViews = Number(r.value) || 0;
        }
      }
    } catch (e) {
      log.error("instagram.refresh.insights_unexpected", { fn: "refresh-instagram", userId }, e);
    }

    totalReach = insights30.reach || 0;
    totalImpressions = insights30.views || 0;
    totalInteractions = insights30.total_interactions || 0;
    accountsEngaged = insights30.accounts_engaged || 0;
    // If `views` isn't available for this account/region, reach is the
    // closest stand-in (kept from the previous behaviour).
    if (!totalImpressions) totalImpressions = totalReach;

    const instagramInsights = insightsOk
      ? {
          since: new Date(insightsSince * 1000).toISOString(),
          until: new Date(insightsUntil * 1000).toISOString(),
          days: INSIGHTS_DAYS,
          views: insights30.views ?? null,
          reelViews: insights30.reelViews ?? null,
          reach: insights30.reach ?? null,
          likes: insights30.likes ?? null,
          comments: insights30.comments ?? null,
          shares: insights30.shares ?? null,
          saves: insights30.saves ?? null,
          reposts: insights30.reposts ?? null,
          interactions: insights30.total_interactions ?? null,
          accountsEngaged: insights30.accounts_engaged ?? null,
        }
      : null;

    // Debug-only: alternate metric shapes to compare against what the IG
    // app displays. We try `period=day` (daily values across the window),
    // a single-metric reach call to rule out multi-metric quirks, and the
    // profile_views/website_clicks slice. None of these write to the DB.
    if (debug) {
      try {
        const r = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=reach&period=days_28&metric_type=total_value&access_token=${encodeURIComponent(accessToken)}`
        );
        debugCaptures.reach_only_days_28 = await r.json();
      } catch (e) { debugCaptures.reach_only_days_28 = { fetch_error: String((e as any)?.message || e) }; }

      try {
        const r = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=reach&period=day&access_token=${encodeURIComponent(accessToken)}`
        );
        debugCaptures.reach_daily = await r.json();
      } catch (e) { debugCaptures.reach_daily = { fetch_error: String((e as any)?.message || e) }; }

      try {
        const r = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=views&period=days_28&metric_type=total_value&access_token=${encodeURIComponent(accessToken)}`
        );
        debugCaptures.views_only_days_28 = await r.json();
      } catch (e) { debugCaptures.views_only_days_28 = { fetch_error: String((e as any)?.message || e) }; }

      try {
        const r = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=profile_views,website_clicks&period=days_28&metric_type=total_value&access_token=${encodeURIComponent(accessToken)}`
        );
        debugCaptures.profile_metrics_days_28 = await r.json();
      } catch (e) { debugCaptures.profile_metrics_days_28 = { fetch_error: String((e as any)?.message || e) }; }

      // OPTION-1 DRY RUN: explicit 28-day window with period=day, then sum
      // the per-day values ourselves. Stored values are NOT updated — this
      // is purely for comparison against the IG app numbers.
      try {
        const untilSec = Math.floor(Date.now() / 1000);
        const sinceSec = untilSec - 28 * 24 * 60 * 60;
        const r = await fetch(
          `https://graph.instagram.com/v22.0/me/insights?metric=reach,views,total_interactions,accounts_engaged&period=day&since=${sinceSec}&until=${untilSec}&access_token=${encodeURIComponent(accessToken)}`
        );
        const raw = await r.json();
        const sums: Record<string, number> = {};
        const dayCounts: Record<string, number> = {};
        const series: Record<string, Array<{ end_time: string; value: number }>> = {};
        for (const m of (raw?.data || [])) {
          const name: string = m?.name;
          const values: Array<{ value: number; end_time: string }> = m?.values || [];
          series[name] = values.map((v) => ({ end_time: v.end_time, value: Number(v.value) || 0 }));
          sums[name] = values.reduce((s, v) => s + (Number(v.value) || 0), 0);
          dayCounts[name] = values.length;
        }
        debugCaptures.option1_summed_28d = {
          window: {
            since: new Date(sinceSec * 1000).toISOString(),
            until: new Date(untilSec * 1000).toISOString(),
            sinceSec,
            untilSec,
          },
          sums,
          dayCounts,
          series,
          raw,
        };
      } catch (e) {
        debugCaptures.option1_summed_28d = { fetch_error: String((e as any)?.message || e) };
      }

      // API VERSION PROBE — does the silent days_28 → day downgrade happen
      // on every Graph API version? Try a few. For each, log what `period`
      // Meta echoes back and what `total_value` it returns.
      try {
        const versions = ['v18.0', 'v19.0', 'v20.0', 'v21.0', 'v22.0', 'v23.0'];
        const versionProbe: Record<string, any> = {};
        for (const v of versions) {
          try {
            const r = await fetch(
              `https://graph.instagram.com/${v}/me/insights?metric=reach,views,total_interactions,accounts_engaged&period=days_28&metric_type=total_value&access_token=${encodeURIComponent(accessToken)}`
            );
            const raw = await r.json();
            const summary = (raw?.data || []).map((m: any) => ({
              name: m?.name,
              period_echoed: m?.period,
              total_value: m?.total_value?.value ?? null,
              has_values_array: Array.isArray(m?.values),
              values_count: m?.values?.length ?? 0,
            }));
            versionProbe[v] = {
              status: r.status,
              ok: r.ok,
              error: raw?.error ?? null,
              metric_count: (raw?.data || []).length,
              summary,
            };
          } catch (e) {
            versionProbe[v] = { fetch_error: String((e as any)?.message || e) };
          }
        }
        debugCaptures.version_probe_days_28 = versionProbe;
      } catch (e) {
        debugCaptures.version_probe_days_28 = { fetch_error: String((e as any)?.message || e) };
      }

      // EXTRA PROBE — three independent variables to see if any of them
      // escapes the silent days_28 → day downgrade:
      //   1. graph.facebook.com vs graph.instagram.com
      //   2. /me vs explicit /<ig-user-id>
      //   3. metric_type=total_value vs time_series
      // We hit every combination of these and report what Meta echoes
      // back so we can see which (if any) returns the real 28-day value.
      try {
        const hosts = ['graph.instagram.com', 'graph.facebook.com'];
        const targets = ['me', '17841453381496033'];
        const metricTypes = ['total_value', 'time_series'];
        const matrix: Record<string, any> = {};
        for (const host of hosts) {
          for (const target of targets) {
            for (const mt of metricTypes) {
              const key = `${host} | /${target} | mt=${mt}`;
              try {
                const r = await fetch(
                  `https://${host}/v22.0/${target}/insights?metric=reach,views,total_interactions,accounts_engaged&period=days_28${mt === 'total_value' ? '&metric_type=total_value' : ''}&access_token=${encodeURIComponent(accessToken)}`
                );
                const raw = await r.json();
                matrix[key] = {
                  status: r.status,
                  ok: r.ok,
                  error: raw?.error ?? null,
                  summary: (raw?.data || []).map((m: any) => ({
                    name: m?.name,
                    period_echoed: m?.period,
                    total_value: m?.total_value?.value ?? null,
                    values_count: m?.values?.length ?? 0,
                    values_sum: Array.isArray(m?.values)
                      ? m.values.reduce(
                          (s: number, v: any) => s + (Number(v?.value) || 0),
                          0,
                        )
                      : null,
                  })),
                };
              } catch (e) {
                matrix[key] = { fetch_error: String((e as any)?.message || e) };
              }
            }
          }
        }
        debugCaptures.host_target_metrictype_probe = matrix;
      } catch (e) {
        debugCaptures.host_target_metrictype_probe = { fetch_error: String((e as any)?.message || e) };
      }

      // OPTION-1 ISOLATED: per-metric calls with same 28-day window.
      // Grouped queries dropped 3 of 4 metrics; isolating them may
      // surface the missing values. Each result has its own series + sum.
      try {
        const untilSec = Math.floor(Date.now() / 1000);
        const sinceSec = untilSec - 28 * 24 * 60 * 60;
        const isolatedResults: Record<string, any> = {};
        for (const metric of ['reach', 'views', 'total_interactions', 'accounts_engaged']) {
          try {
            const r = await fetch(
              `https://graph.instagram.com/v22.0/me/insights?metric=${metric}&period=day&since=${sinceSec}&until=${untilSec}&access_token=${encodeURIComponent(accessToken)}`
            );
            const raw = await r.json();
            const entry = raw?.data?.[0];
            const values: Array<{ value: number; end_time: string }> = entry?.values || [];
            isolatedResults[metric] = {
              status: r.status,
              ok: r.ok,
              returned_period: entry?.period ?? null,
              day_count: values.length,
              sum: values.reduce((s, v) => s + (Number(v.value) || 0), 0),
              series: values.map((v) => ({ end_time: v.end_time, value: Number(v.value) || 0 })),
              error: raw?.error ?? null,
              // Keep first 3 values raw so we can inspect schema if the
              // aggregation logic is misreading something.
              raw_first_3: values.slice(0, 3),
            };
          } catch (e) {
            isolatedResults[metric] = { fetch_error: String((e as any)?.message || e) };
          }
        }
        debugCaptures.option1_isolated_28d = {
          window: {
            since: new Date(sinceSec * 1000).toISOString(),
            until: new Date(untilSec * 1000).toISOString(),
          },
          results: isolatedResults,
        };
      } catch (e) {
        debugCaptures.option1_isolated_28d = { fetch_error: String((e as any)?.message || e) };
      }
    }

    // Build top reels: sort by engagement (likes + comments), take top 6
    // Now ranking across up to 100 recent posts (was 25) — much more likely
    // to surface a creator's actual best-performing content.
    const autoTopReels = mediaPosts
      .map((p: any) => ({
        id: p.id,
        mediaType: p.media_type,
        thumbnail: p.thumbnail_url || p.media_url || "",
        permalink: p.permalink || "",
        // truncateText, never .slice: splitting an emoji here made
        // PostgREST reject the WHOLE profile update as "Empty or invalid
        // json", so @thecozyshot never had analytics saved.
        caption: truncateText(p.caption, 100),
        likes: Number(p.like_count) || 0,
        comments: Number(p.comments_count) || 0,
        timestamp: p.timestamp,
      }))
      .sort((a: any, b: any) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, 6);

    // A creator who picked their own top reels in the media-kit editor keeps
    // them. This used to overwrite the list with the automatic "most liked
    // recent posts" on EVERY refresh — i.e. every login — silently throwing
    // away the creator's choice. Curated entries are only refreshed (fresh
    // thumbnail, likes, comments); the order and selection stay theirs.
    let topReels: any[] = autoTopReels;
    const storedReels = Array.isArray(profile.top_reels) ? profile.top_reels : [];
    if (isCuratedReels(storedReels)) {
      const { reels } = await refreshReels(accessToken, storedReels);
      topReels = reels.map((r: any) => ({ ...r, curated: true }));
    }

    // Step 4: Fetch audience demographics (requires Business/Creator account)
    let audienceDemographics: Record<string, unknown> = {};
    try {
      // Audience city
      const cityRes = await fetch(
        `https://graph.instagram.com/v22.0/me/insights?metric=follower_demographics&period=days_28&metric_type=total_value&breakdown=city&access_token=${encodeURIComponent(accessToken)}`
      );
      const cityData = await cityRes.json();
      if (debug) debugCaptures.demographics_city = cityData;
      const cityBreakdown = cityData?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
      const topCities = cityBreakdown
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 6)
        .map((c: any) => ({ name: c.dimension_values[0], value: c.value }));

      // Calculate percentages
      const totalCityFollowers = cityBreakdown.reduce((s: number, c: any) => s + c.value, 0);
      const topCitiesWithPct = topCities.map((c: any) => ({
        ...c,
        pct: totalCityFollowers > 0 ? parseFloat(((c.value / totalCityFollowers) * 100).toFixed(1)) : 0,
      }));

      // Audience age + gender
      const ageGenderRes = await fetch(
        `https://graph.instagram.com/v22.0/me/insights?metric=follower_demographics&period=days_28&metric_type=total_value&breakdown=age,gender&access_token=${encodeURIComponent(accessToken)}`
      );
      const ageGenderData = await ageGenderRes.json();
      if (debug) debugCaptures.demographics_age_gender = ageGenderData;
      const ageGenderBreakdown = ageGenderData?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];

      // Aggregate by age
      const ageMap: Record<string, number> = {};
      let genderM = 0, genderF = 0, genderU = 0;
      for (const item of ageGenderBreakdown) {
        const age = item.dimension_values[0]; // e.g. "25-34"
        const gender = item.dimension_values[1]; // "M", "F", "U"
        const val = item.value || 0;
        ageMap[age] = (ageMap[age] || 0) + val;
        if (gender === "M") genderM += val;
        else if (gender === "F") genderF += val;
        else genderU += val;
      }

      // Split over KNOWN gender only, the way Instagram reports it. "U"
      // (unknown) is often most of the audience — 74% for one creator — and
      // showing it as "Other" made every kit disagree with Instagram.
      // unknownPct is kept for anyone who wants to disclose it.
      const knownGender = genderM + genderF;
      const totalGender = knownGender + genderU;
      const genderBreakdownResult = {
        male: knownGender > 0 ? parseFloat(((genderM / knownGender) * 100).toFixed(1)) : 0,
        female: knownGender > 0 ? parseFloat(((genderF / knownGender) * 100).toFixed(1)) : 0,
        other: 0,
        unknownPct: totalGender > 0 ? parseFloat(((genderU / totalGender) * 100).toFixed(1)) : 0,
      };

      // Age ranges with percentages
      const totalAge = Object.values(ageMap).reduce((s, v) => s + v, 0);
      const ageRanges = Object.entries(ageMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([age, val]) => ({
          range: age,
          pct: totalAge > 0 ? parseFloat(((val / totalAge) * 100).toFixed(1)) : 0,
        }));

      // Audience country
      const countryRes = await fetch(
        `https://graph.instagram.com/v22.0/me/insights?metric=follower_demographics&period=days_28&metric_type=total_value&breakdown=country&access_token=${encodeURIComponent(accessToken)}`
      );
      const countryData = await countryRes.json();
      if (debug) debugCaptures.demographics_country = countryData;
      const countryBreakdown = countryData?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
      const topCountries = countryBreakdown
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5)
        .map((c: any) => ({ name: countryName(c.dimension_values[0]), code: c.dimension_values[0], value: c.value }));
      const totalCountryFollowers = countryBreakdown.reduce((s: number, c: any) => s + c.value, 0);
      const topCountriesWithPct = topCountries.map((c: any) => ({
        ...c,
        pct: totalCountryFollowers > 0 ? parseFloat(((c.value / totalCountryFollowers) * 100).toFixed(1)) : 0,
      }));

      audienceDemographics = {
        topCities: topCitiesWithPct,
        topCountries: topCountriesWithPct,
        ageRanges,
        gender: genderBreakdownResult,
      };

      console.log("Audience demographics fetched:", JSON.stringify(audienceDemographics).slice(0, 200));
    } catch (e) {
      console.error("Failed to fetch audience demographics:", e?.message || e);
      // Non-blocking — continue without demographics
    }

    // Migrate the IG-CDN profile picture into Supabase storage so the URL
    // doesn't expire after 24-48 hours like the raw cdninstagram.com /
    // fbcdn.net URLs do. create-profile already does this on signup;
    // doing it here keeps the cached copy in sync with the live picture.
    let storedProfilePictureUrl = igProfile.profile_picture_url || "";
    const igCdnUrl = igProfile.profile_picture_url;
    if (igCdnUrl && (igCdnUrl.includes("cdninstagram.com") || igCdnUrl.includes("fbcdn.net"))) {
      try {
        const bucket = "influencer-photos";
        await ensureBucket(supabaseAdmin, bucket, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
        });

        const imgRes = await fetch(igCdnUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const buffer = new Uint8Array(await imgRes.arrayBuffer());
          const path = `profiles/${userId}.jpg`;
          const { error: uploadErr } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, buffer, { contentType, upsert: true });
          if (!uploadErr) {
            const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
            // Cache-bust so the browser picks up the new copy.
            storedProfilePictureUrl = `${data.publicUrl}?t=${Date.now()}`;
          }
        }
      } catch (e) {
        console.error("Profile picture migration failed:", e);
        // Keep the IG CDN URL as a fallback — better a short-lived image than none.
      }
    }

    // Step 5: Update DB with fresh data
    const updateData: Record<string, unknown> = {
      top_reels: topReels,
      username: igProfile.username || "",
      instagram_handle: igProfile.username || "",
      followers_count: igProfile.followers_count || 0,
      follows_count: igProfile.follows_count || 0,
      media_count: igProfile.media_count || 0,
      profile_photo_url: storedProfilePictureUrl,
      instagram_access_token: accessToken,
      instagram_token_expires_at: tokenExpiresAt,
      instagram_refreshed_at: new Date().toISOString(),
      engagement_rate: engagementRate,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      total_impressions: totalImpressions,
      total_reach: totalReach,
      // total_interactions / accounts_engaged are NOT columns on
      // influencer_profiles and never were — their migration never ran. Every
      // refresh used to send them, eat two 400s, and let the retry loop below
      // drop them one at a time. The numbers live in instagram_insights
      // (migration 071) as `interactions` and `accountsEngaged`, and the
      // response still reports them from the variables above.
      // A successful refresh means the token works again.
      instagram_token_invalid_at: null,
      updated_at: new Date().toISOString(),
    };

    // Keep the last good window rather than blanking it on a failed call.
    if (instagramInsights) updateData.instagram_insights = instagramInsights;

    // Insights permission state (migration 073). Getting insights clears it —
    // that is how a reconnect with insights switched on takes the banner away.
    // Keep the original timestamp while it stays denied. If the column does not
    // exist yet, the save loop below drops it.
    if (insightsOk) updateData.instagram_insights_denied_at = null;
    else if (insightsDenied) updateData.instagram_insights_denied_at = insightsDeniedSince || new Date().toISOString();

    // Add demographics if fetched successfully
    if (Object.keys(audienceDemographics).length > 0) {
      updateData.audience_demographics = audienceDemographics;
    }

    // Save, dropping only columns this database does not have.
    //
    // `total_interactions` and `accounts_engaged` were written here for
    // months but never existed (their migration never ran), so every save
    // failed once and was retried without them. The old retry dropped a
    // fixed list of columns, which silently discarded new ones too
    // (instagram_insights never saved). Now: drop exactly the column
    // PostgREST names, and try again. Bounded, so a real error still lands.
    const payload: Record<string, unknown> = { ...updateData };
    const droppedColumns: string[] = [];
    let updateError: { message: string } | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error } = await supabaseAdmin
        .from("influencer_profiles")
        // Everything in here came from Instagram. wellFormed means a bad
        // character costs one U+FFFD, not the creator's analytics.
        .update(wellFormed(payload))
        .eq("influencer_id", userId);
      updateError = error;
      const missing = error?.message?.match(/Could not find the '(\w+)' column/)?.[1];
      if (!missing || !(missing in payload)) break;
      delete payload[missing];
      droppedColumns.push(missing);
    }
    if (droppedColumns.length) {
      console.warn("refresh-instagram: columns not in schema, skipped:", droppedColumns.join(", "));
    }
    if (debug) debugCaptures.save_dropped_columns = droppedColumns;

    if (updateError) {
      // Persisted, not just console: this failure was silent for days —
      // the client discards refresh errors, so error_logs is the only place
      // it can be seen.
      log.error("instagram.refresh.save_failed", { fn: "refresh-instagram", userId }, updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile: " + updateError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          followersCount: igProfile.followers_count,
          followsCount: igProfile.follows_count,
          mediaCount: igProfile.media_count,
          engagementRate,
          avgLikes,
          avgComments,
          totalImpressions,
          totalReach,
          totalInteractions,
          accountsEngaged,
        },
        ...(debug ? { debug: debugCaptures } : {}),
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    log.error("instagram.refresh.unexpected", { fn: "refresh-instagram" }, err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
