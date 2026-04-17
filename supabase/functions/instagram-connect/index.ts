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

    // Strip trailing #_ that Instagram sometimes appends
    const cleanCode = code.replace(/#_$/, "").replace(/#$/, "");
    debug.push(`code length: ${cleanCode.length}, redirectUri: ${redirectUri}`);

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
      debug.push(`token status: ${tokenRes.status}, body: ${tokenText.substring(0, 300)}`);
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      return jsonResponse({ error: "Invalid token response from Instagram", debug });
    }

    if (!tokenData.access_token) {
      const errDetail = tokenData.error_message || tokenData.error?.message || "unknown";
      debug.push(`token error: ${errDetail}`);
      return jsonResponse({ error: "Failed to get Instagram token: " + errDetail, debug });
    }

    debug.push(`short-lived token OK, user_id: ${tokenData.user_id}`);

    // Step 2: Exchange for long-lived token (60 days)
    let longData: any = {};
    try {
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
          INSTAGRAM_APP_SECRET
        )}&access_token=${encodeURIComponent(tokenData.access_token)}`
      );
      const longText = await longRes.text();
      debug.push(`long-lived status: ${longRes.status}, body: ${longText.substring(0, 300)}`);
      longData = JSON.parse(longText);
    } catch (e) {
      debug.push(`long-lived token exchange failed: ${e?.message}`);
    }

    const accessToken = longData.access_token || tokenData.access_token;
    debug.push(`using ${longData.access_token ? "long-lived" : "short-lived"} token`);

    // Step 3: Fetch user profile — single attempt with v22.0
    const profileFields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const profileUrl = `https://graph.instagram.com/v22.0/me?fields=${profileFields}&access_token=${encodeURIComponent(accessToken)}`;
    debug.push(`fetching profile: v22.0 with full fields`);

    const profileRes = await fetch(profileUrl);
    let profile: any;
    try {
      const profileText = await profileRes.text();
      debug.push(`profile status: ${profileRes.status}, body: ${profileText.substring(0, 500)}`);
      profile = JSON.parse(profileText);
    } catch (e) {
      return jsonResponse({ error: "Invalid profile response from Instagram", debug });
    }

    // If v22.0 fails, try one fallback with minimal fields
    if (profile.error) {
      debug.push(`v22.0 failed: ${profile.error.message || JSON.stringify(profile.error)}`);
      const fallbackFields = "username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";
      const fallbackUrl = `https://graph.instagram.com/v20.0/me?fields=${fallbackFields}&access_token=${encodeURIComponent(accessToken)}`;
      debug.push(`trying fallback: v20.0`);

      const fallbackRes = await fetch(fallbackUrl);
      try {
        const fallbackText = await fallbackRes.text();
        debug.push(`fallback status: ${fallbackRes.status}, body: ${fallbackText.substring(0, 500)}`);
        profile = JSON.parse(fallbackText);
      } catch (e) {
        return jsonResponse({ error: "Invalid fallback profile response", debug });
      }
    }

    if (profile.error) {
      const errMsg = profile.error.message || "Unknown error";

      if (errMsg.includes("does not exist")) {
        return jsonResponse({
          error: "Could not access this Instagram profile. Make sure your account is a Professional account (Business or Creator) in Instagram Settings.",
          debug,
        });
      }

      return jsonResponse({ error: "Failed to fetch Instagram profile: " + errMsg, debug });
    }

    // Calculate token expiry (long-lived tokens last 60 days)
    const expiresIn = longData.expires_in || 5184000;
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
        igUserId: profile.user_id || "",
      },
      accessToken: accessToken,
      tokenExpiresAt,
    });
  } catch (err) {
    // Always return CORS headers even on crash
    return jsonResponse({
      error: "Internal server error: " + (err?.message || String(err)),
      debug,
    });
  }
});
