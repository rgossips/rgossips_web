export async function POST(request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return Response.json({ error: "code and redirectUri are required" }, { status: 400 });
    }

    const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

    if (!appId || !appSecret) {
      return Response.json({ error: "Instagram app credentials not configured" }, { status: 500 });
    }

    // Strip trailing #_ that Instagram sometimes appends
    const cleanCode = code.replace(/#_$/, "").replace(/#$/, "");

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: cleanCode,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      const errDetail = tokenData.error_message || tokenData.error?.message || "unknown";
      return Response.json({ error: "Token exchange failed: " + errDetail });
    }

    const shortToken = tokenData.access_token;
    const userId = String(tokenData.user_id);

    // Step 2: Exchange for long-lived token (60 days)
    let accessToken = shortToken;
    let expiresIn = 3600;

    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`
    );
    const longData = await longRes.json();

    if (longData.access_token) {
      accessToken = longData.access_token;
      expiresIn = longData.expires_in || 5184000;
    }

    // Debug: inspect what the token actually has access to
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appId + "|" + appSecret)}`
    );
    let debugInfo = null;
    try {
      debugInfo = await debugRes.json();
    } catch {}

    // Step 3: Fetch user profile
    const fields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const profileRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    );
    let profile = await profileRes.json();

    // Fallback with minimal fields
    if (profile.error) {
      const minFields = "username,name,profile_picture_url,followers_count,follows_count,media_count";
      const fallbackRes = await fetch(
        `https://graph.instagram.com/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`
      );
      profile = await fallbackRes.json();
    }

    if (profile.error) {
      return Response.json({
        error: "Failed to fetch profile: " + (profile.error.message || "Unknown error"),
        debugToken: accessToken,
        tokenDebug: debugInfo,
      });
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return Response.json({
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
    return Response.json(
      { error: "Server error: " + (err?.message || String(err)) },
      { status: 500 }
    );
  }
}
