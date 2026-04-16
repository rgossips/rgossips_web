export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const mode = url.searchParams.get("mode") || "signup";
  const role = url.searchParams.get("role") || "influencer";
  const popup = url.searchParams.get("popup") === "1";

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
  const redirectUri = `${origin}/instagram-callback`;
  const scope =
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";

  const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;

  // Return an HTML page that uses JavaScript to redirect.
  // JS-initiated navigations do NOT trigger Universal Links / deep links
  // on mobile, so Instagram opens in the browser instead of the app.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Redirecting to Instagram...</title>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #0F0F1A;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(236, 72, 153, 0.3);
      border-top-color: #ec4899;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Opening Instagram...</p>
  </div>
  <script>
    // Small delay ensures the page renders first, then JS redirect
    // prevents mobile OS from intercepting with deep link / Universal Link
    setTimeout(function() {
      window.location.replace(${JSON.stringify(authUrl)});
    }, 100);
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
