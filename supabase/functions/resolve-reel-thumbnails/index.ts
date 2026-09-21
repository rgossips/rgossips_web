import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import { truncateText } from "../_shared/text.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serveWithLogging("resolve-reel-thumbnails", async (req) => {
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
        JSON.stringify({ reels, unresolved: reelLinks, reason: "no_token" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const accessToken = profile.instagram_access_token;

    // Extract shortcodes from links
    const getShortcode = (url: string) =>
      url.match(/\/(p|reel|reels)\/([^/?&#]+)/)?.[2] || "";

    // Instagram's API only exposes media owned by the connected account, so a
    // link can be matched only if it is one of the creator's OWN posts. Page
    // back through their media (up to MAX_PAGES × 100) until every wanted
    // shortcode is found — it used to read only the latest 50, so an older
    // reel of their own failed the same way someone else's reel does.
    const MAX_PAGES = 5;
    const wanted = new Set(reelLinks.map(getShortcode).filter(Boolean));
    const mediaByShortcode: Record<string, any> = {};
    let username = "";
    let next: string | null =
      `https://graph.instagram.com/v22.0/me/media?fields=id,media_type,thumbnail_url,media_url,permalink,caption,like_count,comments_count,username&limit=100&access_token=${encodeURIComponent(accessToken)}`;
    for (let page = 0; page < MAX_PAGES && next; page++) {
      const mediaData = await (await fetch(next)).json();
      if (mediaData?.error) break;
      for (const m of mediaData?.data || []) {
        username = username || m.username || "";
        const sc = getShortcode(m.permalink || "");
        if (sc) mediaByShortcode[sc] = m;
      }
      if ([...wanted].every((sc) => mediaByShortcode[sc])) break;
      next = mediaData?.paging?.next || null;
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
        caption: truncateText(match?.caption, 100),
      };
    });

    // Links we could not match: not on this creator's Instagram (someone
    // else's reel), deleted, or older than MAX_PAGES. The editor refuses to
    // save these — they would render as blank "❤ 0" tiles for brands.
    const unresolved = reelLinks.filter((url: string) => {
      const sc = getShortcode(url);
      return !sc || !mediaByShortcode[sc];
    });

    return new Response(
      JSON.stringify({ reels, unresolved, account: username || null }),
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
