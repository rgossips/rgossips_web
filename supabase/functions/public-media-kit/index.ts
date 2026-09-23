import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import { truncateText } from "../_shared/text.ts";
import { isElite, isPro } from "../_shared/plan.ts";
import { isCuratedReels, refreshReels } from "../_shared/ig-media.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serveWithLogging("public-media-kit", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { userId, username } = await req.json();

    if (!userId && !username) {
      return new Response(
        JSON.stringify({ error: "userId or username is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try influencer profile first
    const selectFields = "influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, followers_count, follows_count, media_count, categories, content_languages, services, bio, created_at, service_rates, location, address, email, tiktok_url, youtube_url, facebook_url, engagement_rate, avg_likes, avg_comments, total_impressions, total_reach, top_reels, instagram_access_token, audience_demographics, media_kit_template, status, subscription_plan, plan_expires_at, instagram_insights, instagram_refreshed_at, instagram_token_invalid_at";

    let influencer = null;

    if (username) {
      // Try username first
      const { data: byUsername, error: err1 } = await supabaseAdmin
        .from("influencer_profiles")
        .select(selectFields)
        .eq("username", username)
        .maybeSingle();

      console.log("Lookup by username:", username, "result:", !!byUsername, "error:", err1?.message);

      if (byUsername) {
        influencer = byUsername;
      } else {
        // Try instagram_handle
        const { data: byHandle, error: err2 } = await supabaseAdmin
          .from("influencer_profiles")
          .select(selectFields)
          .eq("instagram_handle", username)
          .maybeSingle();
        console.log("Lookup by instagram_handle:", username, "result:", !!byHandle, "error:", err2?.message);
        influencer = byHandle;
      }
    } else {
      const { data } = await supabaseAdmin
        .from("influencer_profiles")
        .select(selectFields)
        .eq("influencer_id", userId)
        .maybeSingle();
      influencer = data;
    }

    // A deactivated / pending-deletion creator shouldn't have a live
    // shareable media-kit page either. Pretend the kit doesn't exist.
    if (influencer) {
      const status = String((influencer as any).status || "").toLowerCase();
      if (status === "deactivated" || status === "pending_deletion") {
        return new Response(
          JSON.stringify({ error: "Profile not found" }),
          { status: 404, headers: jsonHeaders }
        );
      }
    }

    if (influencer) {
      // Fetch fresh media URLs from Instagram API if access token exists
      let enrichedReels = influencer.top_reels || [];
      const accessToken = influencer.instagram_access_token;

      // Instagram CDN links expire, so thumbnails are re-fetched per view.
      // Hand-picked reels are often months old: this used to read only the
      // latest 25 posts, so older picks rendered as blank tiles. Pages back
      // until every reel is found (up to 500 posts, stopping early).
      if (accessToken && enrichedReels.length > 0) {
        // Old hand-picked lists are recognised by their placeholder ids, which
        // this replaces with real ones — so carry the curated flag explicitly
        // or refresh-instagram would stop recognising the list and overwrite it.
        const wasCurated = isCuratedReels(enrichedReels);
        const refreshed = await refreshReels(accessToken, enrichedReels);
        enrichedReels = wasCurated
          ? refreshed.reels.map((r: any) => ({ ...r, curated: true }))
          : refreshed.reels;
        // First sight of these reels: persist their Instagram ids so every
        // later view fetches them directly instead of paging history.
        // Best effort — a failed write only costs the next view some time.
        if (refreshed.changed) {
          const { error: saveErr } = await supabaseAdmin
            .from("influencer_profiles")
            .update({ top_reels: enrichedReels })
            .eq("influencer_id", influencer.influencer_id);
          if (saveErr) console.warn("public-media-kit: could not persist reel ids:", saveErr.message);
        }
      }

      const profile = {
        fullName: influencer.full_name,
        username: influencer.username,
        instagramHandle: influencer.instagram_handle,
        profilePhotoUrl: influencer.profile_photo_url,
        customProfilePhotoUrl: influencer.custom_profile_photo_url,
        followersCount: influencer.followers_count,
        followsCount: influencer.follows_count,
        mediaCount: influencer.media_count,
        categories: influencer.categories,
        contentLanguages: influencer.content_languages,
        services: influencer.services,
        bio: influencer.bio,
        createdAt: influencer.created_at,
        serviceRates: influencer.service_rates,
        location: influencer.location,
        address: influencer.address,
        email: influencer.email,
        topReels: enrichedReels,
        tiktokUrl: influencer.tiktok_url,
        youtubeUrl: influencer.youtube_url,
        facebookUrl: influencer.facebook_url,
        engagementRate: influencer.engagement_rate,
        avgLikes: influencer.avg_likes,
        avgComments: influencer.avg_comments,
        totalImpressions: influencer.total_impressions,
        totalReach: influencer.total_reach,
        audienceDemographics: influencer.audience_demographics,
        // Snake_case duplicated so the React dispatcher (which reads either)
        // gets the saved template id on the public page.
        media_kit_template: influencer.media_kit_template || "classic",
        // Elite verified badge. The boolean only — plan and expiry stay here.
        isElite: isElite(influencer),
        // Pro badge. Same contract as isElite.
        isPro: isPro(influencer),
        // 30-day account totals + when they were fetched, so the kit can show
        // its date range and flag data that has gone stale.
        instagramInsights: influencer.instagram_insights || null,
        analyticsUpdatedAt: influencer.instagram_refreshed_at || null,
        instagramTokenInvalid: !!influencer.instagram_token_invalid_at,
      };
      return new Response(
        JSON.stringify({ profile, role: "influencer" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Try brand profile
    const { data: brand, error: brandError } = await supabaseAdmin
      .from("brand_profiles")
      .select(
        "brand_name, contact_name, logo_url, instagram_username, gstin_trade_name, categories, created_at"
      )
      .eq("brand_id", userId)
      .maybeSingle();

    if (brand) {
      return new Response(
        JSON.stringify({
          profile: {
            full_name: brand.gstin_trade_name || brand.brand_name || brand.contact_name,
            profile_photo_url: brand.logo_url,
            instagram_handle: brand.instagram_username,
            categories: brand.categories,
          },
          role: "brand",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      { status: 404, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
