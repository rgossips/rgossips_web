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

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", JSON.stringify(tokenData));

      const errDetail = tokenData.error_message || tokenData.error?.message || "";
      console.error("Token exchange error detail:", errDetail, "Full response:", JSON.stringify(tokenData));
      if (errDetail.includes("code has been used") || errDetail.includes("expired") || errDetail.includes("authorization code")) {
        return new Response(
          JSON.stringify({ error: "Instagram authorization expired. Please try connecting again." }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to connect Instagram. Please try again.",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
        INSTAGRAM_APP_SECRET
      )}&access_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token || tokenData.access_token;

    // Step 3: Fetch user profile — try with full fields first, then minimal
    let profile: any = null;
    const fullFields = "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";
    const minimalFields = "username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";

    for (const fields of [fullFields, minimalFields]) {
      const profileRes = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
      );
      profile = await profileRes.json();
      if (!profile.error) break;
      console.error(`Profile fetch with fields [${fields}] failed:`, JSON.stringify(profile.error));
    }

    if (profile.error) {
      console.error("All profile fetch attempts failed:", JSON.stringify(profile.error));

      const errMsg = profile.error.message || "";
      const errCode = profile.error.code;

      if (errMsg.includes("does not exist")) {
        return new Response(
          JSON.stringify({
            error: "Could not access this Instagram profile. This usually means: (1) The account is not a Professional account — switch to Business or Creator in Instagram Settings, (2) You're logged into a different Instagram account in your browser, or (3) The account was recently switched and Instagram needs a few hours to update. Please log out of Instagram in your browser, log back in with your Professional account, and try again.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // Token expired or invalid
      if (errCode === 190 || errMsg.includes("expired") || errMsg.includes("Invalid")) {
        return new Response(
          JSON.stringify({
            error: "Instagram session expired. Please try connecting again.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to fetch Instagram profile. Please try again. (" + errMsg + ")",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Calculate token expiry (long-lived tokens last 60 days)
    const expiresIn = longData.expires_in || 5184000; // default 60 days in seconds
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
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + (err?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
