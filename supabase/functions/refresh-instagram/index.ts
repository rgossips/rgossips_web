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
    const { userId } = await req.json();

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

    // Throttle: skip if refreshed within the last hour
    if (profile.instagram_refreshed_at) {
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
      `https://graph.instagram.com/v21.0/me?fields=username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`
    );
    const igProfile = await profileRes.json();

    if (igProfile.error) {
      // Token might be expired/revoked
      console.error("Instagram API error:", igProfile.error);
      return new Response(
        JSON.stringify({ error: "Instagram token expired. Please reconnect Instagram.", igError: igProfile.error.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 3: Fetch recent media for engagement calculation
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=id,media_type,like_count,comments_count,timestamp,thumbnail_url,media_url,permalink,caption&limit=25&access_token=${encodeURIComponent(accessToken)}`
    );
    const mediaData = await mediaRes.json();

    let engagementRate = 0;
    let avgLikes = 0;
    let avgComments = 0;
    let totalImpressions = 0;
    let totalReach = 0;

    const mediaPosts = mediaData?.data || [];

    if (mediaPosts.length > 0 && igProfile.followers_count > 0) {
      let totalLikes = 0;
      let totalComments = 0;

      // Fetch insights for each media item
      const insightPromises = mediaPosts.map(async (media: { id: string }) => {
        try {
          const insightRes = await fetch(
            `https://graph.instagram.com/v21.0/${media.id}/insights?metric=impressions,reach&access_token=${encodeURIComponent(accessToken)}`
          );
          const insightData = await insightRes.json();
          if (insightData?.data) {
            for (const metric of insightData.data) {
              if (metric.name === "impressions") totalImpressions += metric.values?.[0]?.value || 0;
              if (metric.name === "reach") totalReach += metric.values?.[0]?.value || 0;
            }
          }
        } catch {
          // Insights may not be available for all media types
        }
      });

      await Promise.all(insightPromises);

      for (const post of mediaPosts) {
        totalLikes += post.like_count || 0;
        totalComments += post.comments_count || 0;
      }

      avgLikes = Math.round(totalLikes / mediaPosts.length);
      avgComments = Math.round(totalComments / mediaPosts.length);
      engagementRate = parseFloat(
        (((totalLikes + totalComments) / mediaPosts.length / igProfile.followers_count) * 100).toFixed(2)
      );
    }

    // Build top reels: sort by engagement (likes + comments), take top 6
    const topReels = mediaPosts
      .map((p: any) => ({
        id: p.id,
        mediaType: p.media_type,
        thumbnail: p.thumbnail_url || p.media_url || "",
        permalink: p.permalink || "",
        caption: (p.caption || "").slice(0, 100),
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
        timestamp: p.timestamp,
      }))
      .sort((a: any, b: any) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, 6);

    // Step 4: Fetch audience demographics (requires Business/Creator account)
    let audienceDemographics: Record<string, unknown> = {};
    try {
      // Audience city
      const cityRes = await fetch(
        `https://graph.instagram.com/v21.0/me/insights?metric=follower_demographics&metric_type=total_value&breakdown=city&access_token=${encodeURIComponent(accessToken)}`
      );
      const cityData = await cityRes.json();
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
        `https://graph.instagram.com/v21.0/me/insights?metric=follower_demographics&metric_type=total_value&breakdown=age,gender&access_token=${encodeURIComponent(accessToken)}`
      );
      const ageGenderData = await ageGenderRes.json();
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
        `https://graph.instagram.com/v21.0/me/insights?metric=follower_demographics&metric_type=total_value&breakdown=country&access_token=${encodeURIComponent(accessToken)}`
      );
      const countryData = await countryRes.json();
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

    // Step 5: Update DB with fresh data
    const updateData: Record<string, unknown> = {
      top_reels: topReels,
      username: igProfile.username || "",
      instagram_handle: igProfile.username || "",
      followers_count: igProfile.followers_count || 0,
      follows_count: igProfile.follows_count || 0,
      media_count: igProfile.media_count || 0,
      profile_photo_url: igProfile.profile_picture_url || "",
      instagram_access_token: accessToken,
      instagram_token_expires_at: tokenExpiresAt,
      instagram_refreshed_at: new Date().toISOString(),
      engagement_rate: engagementRate,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      total_impressions: totalImpressions,
      total_reach: totalReach,
      updated_at: new Date().toISOString(),
    };

    // Add demographics if fetched successfully
    if (Object.keys(audienceDemographics).length > 0) {
      updateData.audience_demographics = audienceDemographics;
    }

    const { error: updateError } = await supabaseAdmin
      .from("influencer_profiles")
      .update(updateData)
      .eq("influencer_id", userId);

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
        },
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
