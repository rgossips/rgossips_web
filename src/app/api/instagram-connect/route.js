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

    // Step 2: Exchange for long-lived token (60 days). Previously we
    // silently fell back to the short token on failure — that's how rows
    // ended up with a 1-hour token that expired before refresh-instagram
    // ever ran. We now surface the failure so the user can retry instead
    // of landing in a half-connected state.
    let accessToken = shortToken;
    let expiresIn = 3600;
    let longTokenError = null;

    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`
    );
    const longData = await longRes.json();

    if (longData.access_token) {
      accessToken = longData.access_token;
      expiresIn = longData.expires_in || 5184000;
    } else {
      longTokenError = longData?.error?.message || longData?.error?.error_user_msg || "Long-lived token exchange failed";
      console.error("ig_exchange_token failed:", JSON.stringify(longData));
    }

    // Step 3: Probe the token with a single-field /me call. This is the
    // most useful diagnostic — Instagram's response varies wildly with
    // the fields list (a heavy list returns the misleading
    // "Unsupported request - method type: get", a single field returns
    // the actual underlying error like "session has expired").
    const probeRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=id&access_token=${encodeURIComponent(accessToken)}`
    );
    const probe = await probeRes.json();
    if (probe.error) {
      const msg = probe.error.message || "";
      let userFacing;
      if (/session has expired/i.test(msg)) {
        userFacing =
          "Instagram token expired before we could read your profile. This usually means the long-lived token exchange failed — try connecting Instagram again. If it keeps happening, double-check that the production INSTAGRAM_APP_SECRET matches the live Meta app.";
      } else if (/Unsupported request/i.test(msg) || probe.error.code === 100) {
        userFacing =
          "Instagram refused the request. Common causes: (1) the connected account is still Personal — switch it to Creator/Business in the Instagram app, (2) the Instagram account is brand new and hasn't been switched to Creator/Business long enough for Meta to provision API access (give it 24–48 hours), or (3) the live Meta app's Use Case → Instagram API isn't fully activated yet.";
      } else {
        userFacing = "Instagram API rejected the request: " + msg;
      }
      return Response.json({
        error: userFacing,
        igError: probe.error,
        longTokenError,
      });
    }

    // Step 4: Fetch user profile (probe passed, so this should succeed)
    const fields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const profileRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    );
    let profile = await profileRes.json();

    // Fallback with minimal fields
    if (profile.error) {
      const minFields = "username,name,profile_picture_url,followers_count,follows_count,media_count";
      const fallbackRes = await fetch(
        `https://graph.instagram.com/v22.0/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`
      );
      profile = await fallbackRes.json();
    }

    if (profile.error) {
      return Response.json({
        error: "Failed to fetch profile: " + (profile.error.message || "Unknown error"),
        igError: profile.error,
        longTokenError,
      });
    }

    // Refuse to save a half-connected state. A row with a token but no
    // username caused the original "Instagram not connected" sign-in bug
    // — better to fail loudly here than land the user in that state.
    if (!profile.username) {
      return Response.json({
        error: "Instagram returned a token but no username — we can't save a half-connected profile. Try connecting Instagram again, or contact support if the issue persists.",
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
