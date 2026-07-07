import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Pulls Instagram insights for every submission link on a single campaign
// application and caches the aggregate on `campaign_applications.metrics`.
//
// Body: { applicationId: string }
// Returns: { success: true, metrics } | { error: string, partial?: any }
//
// The function is service-role and does not authenticate the caller — it's
// only invoked from other edge functions (submit-deliverables, update-
// application-status) and from a future on-demand refresh path.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const IG_API = "https://graph.instagram.com/v22.0";

// Pull a permalink shortcode out of a URL. Instagram permalinks come in two
// flavours we care about:
//   https://www.instagram.com/p/<shortcode>/...     (post / carousel)
//   https://www.instagram.com/reel/<shortcode>/...  (reel)
function extractShortcode(url: string): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// Walk /me/media until we've collected enough rows to find every shortcode we
// care about, capped at MAX_PAGES so we don't loop forever for very large
// accounts. The brand's submitted reels are usually within the first page.
async function buildShortcodeMap(token: string, neededCodes: Set<string>) {
  const map = new Map<string, { id: string; permalink: string; media_product_type?: string }>();
  const MAX_PAGES = 8;
  let url:
    | string
    | null = `${IG_API}/me/media?fields=id,permalink,media_product_type&limit=100&access_token=${encodeURIComponent(token)}`;

  for (let page = 0; page < MAX_PAGES && url && map.size < neededCodes.size; page++) {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !Array.isArray(data?.data)) {
      throw new Error(data?.error?.message || `IG /me/media failed (${res.status})`);
    }
    for (const item of data.data) {
      const code = extractShortcode(item.permalink || "");
      if (code && neededCodes.has(code)) {
        map.set(code, {
          id: item.id,
          permalink: item.permalink,
          media_product_type: item.media_product_type,
        });
      }
    }
    url = data?.paging?.next || null;
  }
  return map;
}

async function fetchMediaInsights(mediaId: string, mediaType: string | undefined, token: string) {
  // Different metric sets depending on media type — feed vs reels expose
  // overlapping but not identical fields in v22.
  const isReel = (mediaType || "").toUpperCase() === "REELS";
  const metrics = isReel
    ? "reach,likes,comments,saved,shares,total_interactions"
    : "reach,saved,likes,comments";

  const url = `${IG_API}/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data?.data)) {
    throw new Error(data?.error?.message || `IG insights failed (${res.status})`);
  }
  const out: Record<string, number> = {};
  for (const m of data.data) {
    const name = m?.name as string;
    const value = Number(m?.values?.[0]?.value || 0);
    if (name) out[name] = value;
  }
  return out;
}

// Fallback for like_count / comments_count when a metric is missing from
// /insights (feed posts don't always return likes/comments via insights).
async function fetchMediaPublicCounts(mediaId: string, token: string) {
  const url = `${IG_API}/${mediaId}?fields=like_count,comments_count&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) return { like_count: 0, comments_count: 0 };
  return {
    like_count: Number(data?.like_count || 0),
    comments_count: Number(data?.comments_count || 0),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { applicationId, force } = await req.json();

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "applicationId is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: app, error: appErr } = await supabaseAdmin
      .from("campaign_applications")
      .select("id, status, campaign_id, influencer_id, submission_links, metrics, metrics_refreshed_at")
      .eq("id", applicationId)
      .single();

    if (appErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Cooldown: each call fans out to the Instagram Graph API (up to 8
    // pages of /me/media + per-link /insights), so repeated calls can
    // exhaust the external rate limit. Serve the cached metrics if we
    // refreshed within COOLDOWN_MS, unless the caller passes force:true
    // (used right after a genuine deliverable submit). This is the only
    // throttle on an endpoint that doesn't authenticate the caller.
    const COOLDOWN_MS = 60 * 1000;
    if (!force && app.metrics_refreshed_at) {
      const age = Date.now() - new Date(app.metrics_refreshed_at).getTime();
      if (age >= 0 && age < COOLDOWN_MS) {
        return new Response(
          JSON.stringify({
            success: true,
            metrics: app.metrics ?? null,
            cached: true,
            cooldown_ms_remaining: COOLDOWN_MS - age,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    const links = Array.isArray(app.submission_links) ? app.submission_links : [];
    const liveLinks = links
      .map((l: any) => ({ url: l?.url || "", label: l?.label || "", type: l?.type || "" }))
      .filter((l) => l.url && l.url.includes("instagram.com"));

    if (liveLinks.length === 0) {
      // Nothing to measure — clear any stale metrics so the UI shows "—".
      await supabaseAdmin
        .from("campaign_applications")
        .update({ metrics: null, metrics_refreshed_at: new Date().toISOString() })
        .eq("id", applicationId);
      return new Response(
        JSON.stringify({ success: true, metrics: null, reason: "no_instagram_links" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Influencer's IG token
    const { data: influencer } = await supabaseAdmin
      .from("influencer_profiles")
      .select("instagram_access_token, instagram_handle")
      .eq("influencer_id", app.influencer_id)
      .single();

    const token = influencer?.instagram_access_token;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Influencer has no Instagram token" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Match each link to the influencer's media via shortcode → id
    const shortcodes = new Set(
      liveLinks.map((l) => extractShortcode(l.url)).filter((s): s is string => !!s)
    );

    if (shortcodes.size === 0) {
      return new Response(
        JSON.stringify({ error: "No instagram permalinks could be parsed" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const mediaMap = await buildShortcodeMap(token, shortcodes);

    const perLink: any[] = [];
    const errors: string[] = [];
    let totals = {
      reach: 0,
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      interactions: 0,
    };

    for (const link of liveLinks) {
      const code = extractShortcode(link.url);
      if (!code) {
        errors.push(`could not parse: ${link.url}`);
        continue;
      }
      const match = mediaMap.get(code);
      if (!match) {
        errors.push(`unmatched permalink (not in /me/media): ${link.url}`);
        continue;
      }

      try {
        const insights = await fetchMediaInsights(match.id, match.media_product_type, token);
        let likes = Number(insights.likes || 0);
        let comments = Number(insights.comments || 0);
        if (likes === 0 && comments === 0) {
          // Feed posts often omit likes/comments from /insights — fall back to
          // the public counters on the media object.
          const counts = await fetchMediaPublicCounts(match.id, token);
          likes = counts.like_count;
          comments = counts.comments_count;
        }

        const reach = Number(insights.reach || 0);
        const saves = Number(insights.saved || 0);
        const shares = Number(insights.shares || 0);
        const interactions =
          Number(insights.total_interactions || 0) || likes + comments + saves + shares;

        const entry = {
          url: link.url,
          label: link.label,
          type: link.type,
          media_id: match.id,
          media_product_type: match.media_product_type || "FEED",
          reach,
          likes,
          comments,
          saves,
          shares,
          interactions,
        };
        perLink.push(entry);
        totals.reach += reach;
        totals.likes += likes;
        totals.comments += comments;
        totals.saves += saves;
        totals.shares += shares;
        totals.interactions += interactions;
      } catch (e) {
        errors.push(`insights failed for ${link.url}: ${(e as any)?.message || e}`);
      }
    }

    const engagement =
      totals.reach > 0
        ? Math.round(((totals.interactions / totals.reach) * 100) * 100) / 100
        : 0;

    const metrics = {
      ...totals,
      engagement,
      perLink,
      errors: errors.length ? errors : undefined,
    };

    const { error: updErr } = await supabaseAdmin
      .from("campaign_applications")
      .update({
        metrics,
        metrics_refreshed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updErr) {
      console.error("Failed to write metrics:", updErr);
      return new Response(
        JSON.stringify({ error: "Failed to save metrics: " + updErr.message, partial: metrics }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, metrics }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", (err as any)?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + ((err as any)?.message || String(err)) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
