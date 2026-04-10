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
    const { userId, reelLinks } = await req.json();

    if (!userId || !reelLinks?.length) {
      return new Response(
        JSON.stringify({ error: "userId and reelLinks are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's Instagram access token
    const { data: profile } = await supabaseAdmin
      .from("influencer_profiles")
      .select("instagram_access_token")
      .eq("influencer_id", userId)
      .single();

    if (!profile?.instagram_access_token) {
      // No token — return reels without thumbnails
      const reels = reelLinks.map((url: string, i: number) => ({
        id: `reel_${i}`,
        permalink: url,
        thumbnail: "",
        mediaUrl: "",
        mediaType: "VIDEO",
        likes: 0,
        comments: 0,
        caption: "",
      }));
      return new Response(
        JSON.stringify({ reels }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const accessToken = profile.instagram_access_token;

    // Extract shortcodes from links
    const getShortcode = (url: string) =>
      url.match(/\/(p|reel|reels)\/([^/?&#]+)/)?.[2] || "";

    // Fetch user's recent media (up to 50) with thumbnails
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=id,media_type,thumbnail_url,media_url,permalink,caption,like_count,comments_count&limit=50&access_token=${encodeURIComponent(accessToken)}`
    );
    const mediaData = await mediaRes.json();
    const allMedia = mediaData?.data || [];

    // Build lookup by shortcode
    const mediaByShortcode: Record<string, any> = {};
    for (const m of allMedia) {
      const sc = getShortcode(m.permalink || "");
      if (sc) mediaByShortcode[sc] = m;
    }

    // Match each reel link to media data
    const reels = reelLinks.map((url: string, i: number) => {
      const sc = getShortcode(url);
      const match = sc ? mediaByShortcode[sc] : null;

      return {
        id: match?.id || `reel_${i}`,
        permalink: url,
        thumbnail: match?.thumbnail_url || match?.media_url || "",
        mediaUrl: match?.media_url || "",
        mediaType: match?.media_type || "VIDEO",
        likes: match?.like_count || 0,
        comments: match?.comments_count || 0,
        caption: (match?.caption || "").slice(0, 100),
      };
    });

    return new Response(
      JSON.stringify({ reels }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
