const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return jsonResponse({ error: "Use POST method with { code, redirectUri } body" });
  }

  const debug: string[] = [];

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return jsonResponse({ error: "code and redirectUri are required" });
    }

    const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    const cleanCode = code.replace(/#_$/, "").replace(/#$/, "");
    debug.push(`redirectUri: ${redirectUri}`);

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code: cleanCode,
        }),
      }
    );

    let tokenData: any;
    try {
      const tokenText = await tokenRes.text();
      debug.push(`token status: ${tokenRes.status}`);
      tokenData = JSON.parse(tokenText);
    } catch {
      return jsonResponse({ error: "Invalid token response from Instagram", debug });
    }

    if (!tokenData.access_token) {
      const errDetail = tokenData.error_message || tokenData.error?.message || "unknown";
      return jsonResponse({ error: "Failed to get Instagram token: " + errDetail, debug });
    }

    // Parse user_id as string to avoid JS number precision issues
    const userId = String(tokenData.user_id);
    const shortToken = tokenData.access_token;
    debug.push(`short-lived token OK, user_id: ${userId}`);

    // Step 2: Try long-lived token exchange
    let accessToken = shortToken;
    let expiresIn = 3600;

    // Try via graph.facebook.com first, then graph.instagram.com
    const longLivedUrls = [
      `https://graph.facebook.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(INSTAGRAM_APP_SECRET)}&access_token=${encodeURIComponent(shortToken)}`,
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(INSTAGRAM_APP_SECRET)}&access_token=${encodeURIComponent(shortToken)}`,
    ];

    for (const llUrl of longLivedUrls) {
      try {
        const domain = new URL(llUrl).hostname;
        debug.push(`long-lived GET via ${domain}`);
        const res = await fetch(llUrl);
        const text = await res.text();
        debug.push(`${domain} status: ${res.status}, body: ${text.substring(0, 200)}`);
        const data = JSON.parse(text);
        if (data.access_token) {
          accessToken = data.access_token;
          expiresIn = data.expires_in || 5184000;
          debug.push(`long-lived token OK via ${domain}`);
          break;
        }
      } catch (e) {
        debug.push(`error: ${e?.message}`);
      }
    }

    // Step 3: Fetch user profile — try every combination of domain, endpoint, version
    let profile: any = null;
    const fullFields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const minFields = "username,name,profile_picture_url,followers_count,follows_count,media_count";

    const profileAttempts = [
      // graph.facebook.com attempts
      `https://graph.facebook.com/v22.0/me?fields=${fullFields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.facebook.com/v22.0/${userId}?fields=${fullFields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.facebook.com/v20.0/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.facebook.com/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`,
      // graph.facebook.com no fields (default)
      `https://graph.facebook.com/v22.0/me?access_token=${encodeURIComponent(accessToken)}`,
      // graph.instagram.com attempts
      `https://graph.instagram.com/v22.0/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.instagram.com/me?access_token=${encodeURIComponent(accessToken)}`,
    ];

    for (const url of profileAttempts) {
      try {
        const short = url.replace(/access_token=[^&]+/, "access_token=***").substring(0, 120);
        debug.push(`try: ${short}`);
        const res = await fetch(url);
        const text = await res.text();
        debug.push(`status: ${res.status}, body: ${text.substring(0, 300)}`);
        const parsed = JSON.parse(text);
        if (!parsed.error && (parsed.username || parsed.id)) {
          profile = parsed;
          debug.push("SUCCESS");
          break;
        }
        debug.push(`failed: ${parsed.error?.message || "no data"}`);
      } catch (e) {
        debug.push(`error: ${e?.message}`);
      }
    }

    if (!profile) {
      return jsonResponse({
        error: "Failed to fetch Instagram profile after all attempts.",
        debug,
      });
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return jsonResponse({
      success: true,
      profile: {
        username: profile.username || "",
        name: profile.name || "",
        profilePictureUrl: profile.profile_picture_url || "",
        biography: profile.biography || "",
        followersCount: profile.followers_count || 0,
        followsCount: profile.follows_count || 0,
        mediaCount: profile.media_count || 0,
        accountType: profile.account_type || "",
        igUserId: profile.user_id || userId || "",
      },
      accessToken,
      tokenExpiresAt,
    });
  } catch (err) {
    return jsonResponse({
      error: "Internal server error: " + (err?.message || String(err)),
      debug,
    });
  }
});
