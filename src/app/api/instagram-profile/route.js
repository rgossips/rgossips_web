export async function POST(request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return Response.json({ error: "accessToken is required" }, { status: 400 });
    }

    const fields =
      "user_id,username,name,account_type,profile_picture_url,biography,followers_count,follows_count,media_count";

    // Try multiple API versions
    const urls = [
      `https://graph.instagram.com/v22.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.instagram.com/v20.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
      `https://graph.instagram.com/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.error && data.username) {
          return Response.json({ success: true, profile: data });
        }
      } catch {
        continue;
      }
    }

    return Response.json({
      error:
        "Failed to fetch Instagram profile. Make sure your account is a Professional (Business or Creator) account.",
    });
  } catch (err) {
    return Response.json(
      { error: "Server error: " + (err?.message || String(err)) },
      { status: 500 }
    );
  }
}
