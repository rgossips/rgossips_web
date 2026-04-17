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

    // Step 2: Try to exchange for long-lived token (60 days)
    // This is a server-to-server call that requires the app secret
    let accessToken = shortToken;
    let expiresIn = 3600;

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
      }
    } catch {
      // Long-lived token exchange failed, use short-lived token
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Return token to client — profile will be fetched from browser
    // (Meta blocks Graph API calls from server environments like Deno Deploy)
    return jsonResponse({
      success: true,
      accessToken,
      tokenExpiresAt,
      userId,
    });
  } catch (err) {
    return jsonResponse({
      error: "Internal server error: " + (err?.message || String(err)),
    });
  }
});
