import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
      .select("instagram_access_token, instagram_token_expires_at, instagram_refreshed_at")
      .eq("influencer_id", userId)
      .maybeSingle();

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
      // Token might be expired/revoked
      console.error("Instagram API error:", igProfile.error);
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

    // Account-level insights — use the dedup'd `days_28` window instead of
    // summing daily values (which double-counts users seen on multiple days).
    // Pull `views` (Instagram's new headline metric, replaces impressions),
    // unique `reach`, `total_interactions`, and `accounts_engaged`.
    try {
      const insightsRes = await fetch(
        `https://graph.instagram.com/v22.0/me/insights?metric=reach,views,total_interactions,accounts_engaged&period=days_28&metric_type=total_value&access_token=${encodeURIComponent(accessToken)}`
      );
      const insights = await insightsRes.json();
      if (debug) debugCaptures.insights_days_28 = insights;
      if (insights?.data) {
        for (const metric of insights.data) {
          const value = metric?.total_value?.value ?? 0;
          if (metric.name === "reach") totalReach = value;
          else if (metric.name === "views") totalImpressions = value;
          else if (metric.name === "total_interactions") totalInteractions = value;
          else if (metric.name === "accounts_engaged") accountsEngaged = value;
        }
      } else if (insights?.error) {
        console.error("Insights error:", insights.error);
      }

      // Fallback: if the new `views` metric isn't available yet for this
      // account/region, use reach as the impression proxy.
      if (!totalImpressions) totalImpressions = totalReach;
    } catch (e) {
      console.error("Failed to fetch account insights:", e);
    }

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
    const topReels = mediaPosts
      .map((p: any) => ({
        id: p.id,
        mediaType: p.media_type,
        thumbnail: p.thumbnail_url || p.media_url || "",
        permalink: p.permalink || "",
        caption: (p.caption || "").slice(0, 100),
        likes: Number(p.like_count) || 0,
        comments: Number(p.comments_count) || 0,
        timestamp: p.timestamp,
      }))
      .sort((a: any, b: any) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, 6);

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

      const totalGender = genderM + genderF + genderU;
      const genderBreakdownResult = {
        male: totalGender > 0 ? parseFloat(((genderM / totalGender) * 100).toFixed(1)) : 0,
        female: totalGender > 0 ? parseFloat(((genderF / totalGender) * 100).toFixed(1)) : 0,
        other: totalGender > 0 ? parseFloat(((genderU / totalGender) * 100).toFixed(1)) : 0,
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
        .map((c: any) => ({ name: c.dimension_values[0], value: c.value }));
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
        await supabaseAdmin.storage.createBucket(bucket, {
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
      total_interactions: totalInteractions,
      accounts_engaged: accountsEngaged,
      updated_at: new Date().toISOString(),
    };

    // Add demographics if fetched successfully
    if (Object.keys(audienceDemographics).length > 0) {
      updateData.audience_demographics = audienceDemographics;
    }

    let { error: updateError } = await supabaseAdmin
      .from("influencer_profiles")
      .update(updateData)
      .eq("influencer_id", userId);

    // Retry without the new metrics columns if they haven't been added yet
    // (avoids breaking when migration 003 hasn't run yet).
    if (updateError && /total_interactions|accounts_engaged/i.test(updateError.message)) {
      console.warn("Retrying without new metrics columns:", updateError.message);
      const fallback = { ...updateData };
      delete (fallback as any).total_interactions;
      delete (fallback as any).accounts_engaged;
      const retry = await supabaseAdmin
        .from("influencer_profiles")
        .update(fallback)
        .eq("influencer_id", userId);
      updateError = retry.error;
    }

    if (updateError) {
      console.error("DB update error:", updateError);
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
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
