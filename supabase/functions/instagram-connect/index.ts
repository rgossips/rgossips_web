const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ error: "Use POST method with { code, redirectUri } body" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const debug: string[] = [];

  try {
    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "code and redirectUri are required" }),
        { status: 200, headers: jsonHeaders }
      );
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

    const tokenText = await tokenRes.text();
    debug.push(`token response status: ${tokenRes.status}`);
    debug.push(`token response: ${tokenText.substring(0, 500)}`);

    let tokenData: any;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid token response from Instagram", debug }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (!tokenData.access_token) {
      const errDetail = tokenData.error_message || tokenData.error?.message || "";
      if (errDetail.includes("code has been used") || errDetail.includes("expired") || errDetail.includes("authorization code")) {
        return new Response(
          JSON.stringify({ error: "Instagram authorization expired. Please try connecting again.", debug }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to connect Instagram. Please try again.", debug }),
        { status: 200, headers: jsonHeaders }
      );
    }

    debug.push(`short-lived token obtained, user_id: ${tokenData.user_id}`);

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
        INSTAGRAM_APP_SECRET
      )}&access_token=${encodeURIComponent(tokenData.access_token)}`
    );

    const longText = await longRes.text();
    debug.push(`long-lived token response status: ${longRes.status}`);
    debug.push(`long-lived token response: ${longText.substring(0, 500)}`);

    let longData: any;
    try {
      longData = JSON.parse(longText);
    } catch {
      longData = {};
    }
    const accessToken = longData.access_token || tokenData.access_token;
    debug.push(`using ${longData.access_token ? "long-lived" : "short-lived"} token`);

    // Step 3: Fetch user profile
    // Try multiple API versions and field combinations
    let profile: any = null;
    const attempts = [
      { url: "https://graph.instagram.com/v22.0/me", fields: "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count" },
      { url: "https://graph.instagram.com/v22.0/me", fields: "username,name,account_type,profile_picture_url,followers_count,follows_count,media_count" },
      { url: "https://graph.instagram.com/v20.0/me", fields: "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count" },
      { url: "https://graph.instagram.com/v20.0/me", fields: "username,name,account_type,profile_picture_url,followers_count,follows_count,media_count" },
      { url: "https://graph.instagram.com/me", fields: "username,name,profile_picture_url,followers_count,follows_count,media_count" },
    ];

    for (const attempt of attempts) {
      const profileUrl = `${attempt.url}?fields=${attempt.fields}&access_token=${encodeURIComponent(accessToken)}`;
      debug.push(`trying: ${attempt.url} with fields: ${attempt.fields}`);

      const profileRes = await fetch(profileUrl);
      const profileText = await profileRes.text();
      debug.push(`response ${profileRes.status}: ${profileText.substring(0, 300)}`);

      try {
        profile = JSON.parse(profileText);
      } catch {
        debug.push("failed to parse response");
        continue;
      }

      if (!profile.error) {
        debug.push("SUCCESS - profile fetched");
        break;
      }

      debug.push(`error: ${profile.error?.message || JSON.stringify(profile.error)}`);
    }

    if (!profile || profile.error) {
      const errMsg = profile?.error?.message || "Unknown error";
      return new Response(
        JSON.stringify({
          error: "Failed to fetch Instagram profile: " + errMsg,
          debug,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Calculate token expiry (long-lived tokens last 60 days)
    const expiresIn = longData.expires_in || 5184000;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + (err?.message || String(err)),
        debug,
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
