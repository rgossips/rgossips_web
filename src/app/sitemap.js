// Next.js native sitemap. Replaces the stale public/sitemap.xml.
// Served at /sitemap.xml automatically.
//
// Only public, indexable routes belong here — anything behind auth
// (dashboards under /brands, /influencer, /chats, etc.) is excluded
// both here AND in robots.js so Google doesn't waste crawl budget on
// pages it'll never see.

const BASE = "https://rgossips.com";

export default function sitemap() {
  const now = new Date();

  return [
    {
      url: `${BASE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Legal / policy pages — important for trust signals + Google
    // E-E-A-T (Experience, Expertise, Authoritativeness, Trust).
    {
      url: `${BASE}/consent/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/consent/refund`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${BASE}/consent/brand`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE}/consent/influencer`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
