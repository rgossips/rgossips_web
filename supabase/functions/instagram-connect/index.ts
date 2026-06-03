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

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return jsonResponse({ error: "code and redirectUri are required" });
    }

    const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
    const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;

    // Strip trailing #_ that Instagram sometimes appends
    const cleanCode = code.replace(/#_$/, "").replace(/#$/, "");

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
      tokenData = await tokenRes.json();
    } catch {
      return jsonResponse({ error: "Invalid token response from Instagram" });
    }

    if (!tokenData.access_token) {
      const errDetail = tokenData.error_message || tokenData.error?.message || "unknown";
      if (errDetail.includes("code has been used") || errDetail.includes("expired") || errDetail.includes("authorization code")) {
        return jsonResponse({ error: "Instagram authorization expired. Please try connecting again." });
      }
      return jsonResponse({ error: "Failed to get Instagram token: " + errDetail });
    }

    const shortToken = tokenData.access_token;
    const userId = String(tokenData.user_id);

    // Step 2: Exchange for long-lived token (60 days). Previously we
    // silently fell back to the short token on failure, which left rows
    // with a 1-hour token that expired before refresh-instagram ever ran.
    let accessToken = shortToken;
    let expiresIn = 3600;
    let longTokenError: string | null = null;

    try {
      const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
          INSTAGRAM_APP_SECRET
        )}&access_token=${encodeURIComponent(shortToken)}`
      );
      const longData = await longRes.json();
      if (longData.access_token) {
        accessToken = longData.access_token;
        expiresIn = longData.expires_in || 5184000;
      } else {
        longTokenError = longData?.error?.message || longData?.error?.error_user_msg || "Long-lived token exchange failed";
        console.error("ig_exchange_token failed:", JSON.stringify(longData));
      }
    } catch (e) {
      longTokenError = (e as any)?.message || String(e);
      console.error("ig_exchange_token threw:", longTokenError);
    }

    // Step 3: Probe the token with a single-field /me call. Instagram's
    // response varies with the fields list — a heavy list returns the
    // misleading "Unsupported request - method type: get", while a single
    // field returns the actual underlying error (e.g. "session expired").
    const probeRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=id&access_token=${encodeURIComponent(accessToken)}`
    );
    const probe = await probeRes.json();
    if (probe.error) {
      const msg = probe.error.message || "";
      let userFacing: string;
      if (/session has expired/i.test(msg)) {
        userFacing =
          "Instagram token expired before we could read your profile. This usually means the long-lived token exchange failed — try connecting Instagram again. If it keeps happening, double-check that the production INSTAGRAM_APP_SECRET matches the live Meta app.";
      } else if (/Unsupported request/i.test(msg) || probe.error.code === 100) {
        userFacing =
          "Instagram refused the request. Common causes: (1) the connected account is still Personal — switch it to Creator/Business in the Instagram app, (2) the Instagram account is brand new and hasn't been switched to Creator/Business long enough for Meta to provision API access (give it 24–48 hours), or (3) the live Meta app's Use Case → Instagram API isn't fully activated yet.";
      } else {
        userFacing = "Instagram API rejected the request: " + msg;
      }
      return jsonResponse({
        error: userFacing,
        igError: probe.error,
        longTokenError,
      });
    }

    // Step 4: Fetch the full profile. Probe passed so this should succeed,
    // but we fall back to a minimal field set if the larger one returns an
    // error (some accounts don't expose every field).
    const fields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    let profileRes = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    );
    let profile: any = await profileRes.json();

    if (profile.error) {
      const minFields = "username,name,profile_picture_url,followers_count,follows_count,media_count";
      const fallbackRes = await fetch(
        `https://graph.instagram.com/v22.0/me?fields=${minFields}&access_token=${encodeURIComponent(accessToken)}`
      );
      profile = await fallbackRes.json();
    }

    if (profile.error) {
      return jsonResponse({
        error: "Failed to fetch profile: " + (profile.error.message || "Unknown error"),
        igError: profile.error,
        longTokenError,
      });
    }

    // Refuse to return a half-connected state: a row with a token but no
    // username is what caused the original "Instagram not connected" bug
    // on the very next sign-in.
    if (!profile.username) {
      return jsonResponse({
        error: "Instagram returned a token but no username — we can't save a half-connected profile. Try connecting Instagram again, or contact support if the issue persists.",
      });
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return jsonResponse({
      success: true,
      accessToken,
      tokenExpiresAt,
      userId,
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
    });
  } catch (err) {
    return jsonResponse({
      error: "Internal server error: " + (err?.message || String(err)),
    });
  }
});
