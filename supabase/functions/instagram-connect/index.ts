const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      return new Response(
        JSON.stringify({
          error:
            "Token exchange failed: " +
            (tokenData.error_message || JSON.stringify(tokenData)),
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

    // Step 3: Fetch user profile
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count&access_token=${encodeURIComponent(
        accessToken
      )}`
    );
    const profile = await profileRes.json();

    if (profile.error) {
      console.error("Profile fetch error:", JSON.stringify(profile.error));
      return new Response(
        JSON.stringify({
          error: "Failed to fetch profile: " + profile.error.message,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

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
