// Next.js native robots.txt generator. Served at /robots.txt.
//
// We allow only the public marketing surface (/, /consent/*,
// /kit/* public media kits, /offers, /login, /register) and explicitly
// disallow all authenticated areas + API routes — wasting crawl budget
// on the brand/influencer dashboards (which 401 / redirect anyway) hurts
// our index ranking for the pages that DO matter.

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/consent/",
          "/kit/",
          "/login",
          "/register",
          "/offers",
        ],
        disallow: [
          "/api/",
          "/brands/",
          "/influencer/",
          "/chats/",
          "/notifications/",
          "/profile/",
          "/playground",
          "/instagram-callback",
          "/instagram/",
        ],
      },
    ],
    sitemap: "https://rgossips.com/sitemap.xml",
  };
}
