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
    const selectFields = "full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, followers_count, follows_count, media_count, categories, content_languages, services, bio, created_at, service_rates, location, address, email, tiktok_url, youtube_url, facebook_url, engagement_rate, avg_likes, avg_comments, total_impressions, total_reach, top_reels, instagram_access_token, audience_demographics, media_kit_template, status";

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

      if (accessToken && enrichedReels.length > 0) {
        try {
          const mediaRes = await fetch(
            `https://graph.instagram.com/v22.0/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,like_count,comments_count&limit=25&access_token=${encodeURIComponent(accessToken)}`
          );
          const mediaData = await mediaRes.json();
          const igMedia = mediaData?.data || [];

          if (igMedia.length > 0) {
            // Build a lookup by shortcode extracted from permalink
            const getShortcode = (url: string) => url?.match(/\/(p|reel)\/([^/?]+)/)?.[2] || "";
            const mediaByShortcode: Record<string, any> = {};
            for (const m of igMedia) {
              const sc = getShortcode(m.permalink || "");
              if (sc) mediaByShortcode[sc] = m;
            }

            enrichedReels = enrichedReels.map((reel: any) => {
              const sc = getShortcode(reel.permalink || "");
              const fresh = sc ? mediaByShortcode[sc] : null;
              if (fresh) {
                return {
                  ...reel,
                  mediaUrl: fresh.media_url || "",
                  thumbnailUrl: fresh.thumbnail_url || fresh.media_url || "",
                  mediaType: fresh.media_type || reel.mediaType || "IMAGE",
                  likes: fresh.like_count ?? reel.likes ?? 0,
                  comments: fresh.comments_count ?? reel.comments ?? 0,
                  caption: fresh.caption?.slice(0, 100) || reel.caption || "",
                };
              }
              return reel;
            });
          }
        } catch (e) {
          console.error("Failed to fetch Instagram media:", e);
          // Continue with stored reels without fresh URLs
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
