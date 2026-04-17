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
    debug.push(`code length: ${cleanCode.length}, redirectUri: ${redirectUri}`);

    // Step 1: Exchange code for short-lived token (POST — works)
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

    const userId = tokenData.user_id;
    debug.push(`short-lived token OK, user_id: ${userId}`);

    // Step 2: Exchange for long-lived token (60 days)
    // Try POST first (new API), then GET (legacy)
    let accessToken = tokenData.access_token;
    let expiresIn = 3600; // short-lived default

    // Attempt POST for long-lived token exchange
    try {
      const longRes = await fetch(
        "https://graph.instagram.com/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "ig_exchange_token",
            client_secret: INSTAGRAM_APP_SECRET,
            access_token: tokenData.access_token,
          }),
        }
      );
      const longText = await longRes.text();
      debug.push(`long-lived POST status: ${longRes.status}, body: ${longText.substring(0, 300)}`);
      const longData = JSON.parse(longText);
      if (longData.access_token) {
        accessToken = longData.access_token;
        expiresIn = longData.expires_in || 5184000;
        debug.push("long-lived token OK via POST");
      } else {
        debug.push(`long-lived POST failed: ${longData.error?.message || "no token"}`);
        // Try GET as fallback
        const longGetRes = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(INSTAGRAM_APP_SECRET)}&access_token=${encodeURIComponent(tokenData.access_token)}`
        );
        const longGetText = await longGetRes.text();
        debug.push(`long-lived GET status: ${longGetRes.status}, body: ${longGetText.substring(0, 300)}`);
        const longGetData = JSON.parse(longGetText);
        if (longGetData.access_token) {
          accessToken = longGetData.access_token;
          expiresIn = longGetData.expires_in || 5184000;
          debug.push("long-lived token OK via GET");
        } else {
          debug.push("long-lived token failed, using short-lived token");
        }
      }
    } catch (e) {
      debug.push(`long-lived token exchange error: ${e?.message}`);
    }

    // Step 3: Fetch user profile
    // Try multiple approaches: POST, GET with user_id, GET with /me, with auth header
    let profile: any = null;
    const profileFields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const minimalFields = "username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";

    const profileAttempts = [
      // Attempt 1: POST to /me (new API may require POST)
      async () => {
        debug.push("attempt 1: POST /v22.0/me");
        const res = await fetch("https://graph.instagram.com/v22.0/me", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ fields: profileFields, access_token: accessToken }),
        });
        return res;
      },
      // Attempt 2: GET with user_id instead of /me
      async () => {
        debug.push(`attempt 2: GET /v22.0/${userId} with full fields`);
        const res = await fetch(
          `https://graph.instagram.com/v22.0/${userId}?fields=${profileFields}&access_token=${encodeURIComponent(accessToken)}`
        );
        return res;
      },
      // Attempt 3: GET /me with auth header instead of query param
      async () => {
        debug.push("attempt 3: GET /v22.0/me with Authorization header");
        const res = await fetch(
          `https://graph.instagram.com/v22.0/me?fields=${profileFields}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return res;
      },
      // Attempt 4: POST to user_id endpoint
      async () => {
        debug.push(`attempt 4: POST /v22.0/${userId}`);
        const res = await fetch(`https://graph.instagram.com/v22.0/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ fields: minimalFields, access_token: accessToken }),
        });
        return res;
      },
      // Attempt 5: GET /me with minimal fields, no version
      async () => {
        debug.push("attempt 5: GET /me no version, minimal fields");
        const res = await fetch(
          `https://graph.instagram.com/me?fields=${minimalFields}&access_token=${encodeURIComponent(accessToken)}`
        );
        return res;
      },
    ];

    for (const attempt of profileAttempts) {
      try {
        const res = await attempt();
        const text = await res.text();
        debug.push(`status: ${res.status}, body: ${text.substring(0, 400)}`);
        const parsed = JSON.parse(text);
        if (!parsed.error && parsed.username) {
          profile = parsed;
          debug.push("SUCCESS");
          break;
        }
        debug.push(`failed: ${parsed.error?.message || "no username in response"}`);
      } catch (e) {
        debug.push(`error: ${e?.message}`);
      }
    }

    if (!profile) {
      return jsonResponse({
        error: "Failed to fetch Instagram profile after all attempts. Check debug for details.",
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
        igUserId: profile.user_id || String(userId) || "",
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
