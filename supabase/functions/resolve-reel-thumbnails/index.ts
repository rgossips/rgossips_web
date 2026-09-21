import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";
import { truncateText } from "../_shared/text.ts";
import {
  EDITOR_BUDGET,
  TOP_REELS_POST_LIMIT,
  findMediaByShortcode,
  reelShortcode,
} from "../_shared/ig-media.ts";

// Resolve the links a creator pastes into the media-kit "Top reels" editor.
//
// Product rule: top reels come from the creator's LATEST 50 posts only
// (TOP_REELS_POST_LIMIT), so brands always see recent, up-to-date work.
// Instagram's API only exposes the connected account's own media and has no
// look-up-by-link endpoint, so links are matched against that window — every
// save, including links saved before, so an edit can't keep stale picks.
//
// Response: { reels, unresolved: string[], details: [{url, reason}],
//             reason?, account, scanned, limit, searchedAll }
// Per-link `reason`:
//   not_a_post   — not a post/reel link (profile, story, highlight, share link)
//   too_old      — not among the latest 50 posts (older, or not on this
//                  account at all — Instagram gives no way to tell apart)
//   not_found    — the account has fewer than 50 posts and this isn't one of
//                  them: someone else's post, deleted, or archived
//   not_reached  — the lookup timed out before reading all 50
// Whole-request `reason`: no_token | token_invalid | lookup_failed.

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
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

  try {
    const { userId, reelLinks } = await req.json();

    if (!userId || !Array.isArray(reelLinks) || !reelLinks.length) {
      return json({ error: "userId and reelLinks are required" });
    }
    const links: string[] = reelLinks.map((l: unknown) => String(l || "").trim()).filter(Boolean);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabaseAdmin
      .from("influencer_profiles")
      .select("instagram_access_token, instagram_token_invalid_at, instagram_handle, username")
      .eq("influencer_id", userId)
      .maybeSingle();

    const account = profile?.instagram_handle || profile?.username || null;
    const placeholder = (url: string, i: number) => ({
      id: `reel_${i}`,
      permalink: url,
      thumbnail: "",
      mediaUrl: "",
      mediaType: "VIDEO",
      likes: 0,
      comments: 0,
      caption: "",
      curated: true,
    });
    const allUnresolved = (reason: string) =>
      json({
        reels: links.map(placeholder),
        unresolved: links,
        details: links.map((url) => ({ url, reason })),
        reason,
        account,
      });

    if (!profile?.instagram_access_token) return allUnresolved("no_token");
    if (profile.instagram_token_invalid_at) return allUnresolved("token_invalid");
    const accessToken = profile.instagram_access_token;

    const matched: Record<string, any> = {};
    const toSearch = links.map(reelShortcode).filter(Boolean);
    const lookup = await findMediaByShortcode(accessToken, toSearch, EDITOR_BUDGET);
    Object.assign(matched, lookup.byShortcode);
    if (lookup.tokenRejected) return allUnresolved("token_invalid");

    const reels = links.map((url, i) => {
      const m = matched[reelShortcode(url)];
      if (!m) return placeholder(url, i);
      return {
        id: m.id,
        permalink: url,
        thumbnail: m.thumbnail_url || m.media_url || "",
        mediaUrl: m.media_url || "",
        mediaType: m.media_type || "VIDEO",
        likes: m.like_count || 0,
        comments: m.comments_count || 0,
        caption: truncateText(m.caption, 100),
        // Picked by the creator in the media-kit editor: refresh-instagram
        // keeps a curated list instead of replacing it (see _shared/ig-media).
        curated: true,
      };
    });

    // The editor refuses to save any of these — they would render as blank
    // "❤ 0" tiles for brands — and shows the per-link reason.
    const details = links
      .filter((url) => !matched[reelShortcode(url)])
      .map((url) => ({
        url,
        reason: !reelShortcode(url)
          ? "not_a_post"
          : lookup.limitReached
            ? "too_old"
            : lookup.searchedAll
              ? "not_found"
              : "not_reached",
      }));

    return json({
      reels,
      unresolved: details.map((d) => d.url),
      details,
      account: lookup.username || account,
      scanned: lookup.scanned,
      limit: TOP_REELS_POST_LIMIT,
      searchedAll: lookup.searchedAll,
    });
  } catch (err) {
    console.error("resolve-reel-thumbnails failed:", (err as Error)?.message || err);
    return json({ error: "lookup_failed", reason: "lookup_failed" });
  }
});
