// Server-side metadata for the public media kit URL.
//
// Why this exists as a layout (vs in page.js): the page is "use client"
// because it needs hooks (useParams, useEffect, etc.) to render the
// interactive media-kit UI. Next.js only runs `generateMetadata` on the
// server, and client pages can't export it. Adding a sibling layout
// lets us call the public-media-kit edge function at request time on
// the server, inject Open Graph / Twitter Card tags into the HTML
// <head>, and let the client page continue handling rendering.
//
// Social crawlers (WhatsApp, Facebook, Twitter, LinkedIn, Slack, etc.)
// only read the SSR HTML — they don't run JS. So this is the surface
// they see when someone shares a /kit/<handle> link.

const FALLBACK_TITLE = "Media Kit · RGossips";
const FALLBACK_DESCRIPTION = "Discover top creators on RGossips";
const APP_URL = "https://rgossips.com";

async function fetchPublicProfile(handle) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/public-media-kit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ username: handle }),
      // Re-fetch every 5 minutes so changes to profile photo / bio
      // propagate to the OG cache reasonably quickly without hammering
      // the edge function on every share.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile || null;
  } catch (err) {
    console.error("kit metadata fetch failed:", err?.message || err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const profile = await fetchPublicProfile(id);
  const url = `${APP_URL}/kit/${id}`;

  if (!profile) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        url,
        siteName: "RGossips",
        type: "profile",
      },
      twitter: {
        card: "summary",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
    };
  }

  const displayName =
    profile.fullName || profile.username || profile.instagramHandle || id;
  const handle = profile.instagramHandle || profile.username || id;
  const title = `${displayName} · Media Kit`;
  const followersLabel = profile.followersCount
    ? `${formatFollowers(profile.followersCount)} followers`
    : null;
  const categoriesLabel = Array.isArray(profile.categories) && profile.categories.length > 0
    ? profile.categories.slice(0, 3).join(", ")
    : null;
  // Description preference: bio → followers + category mix → handle.
  const description =
    profile.bio ||
    [followersLabel, categoriesLabel].filter(Boolean).join(" · ") ||
    `@${handle} on RGossips`;

  const image =
    profile.customProfilePhotoUrl ||
    profile.profilePhotoUrl ||
    null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "RGossips",
      // 'profile' is the OG type for a person's page — WhatsApp/iMessage
      // render this as a rich card with the image, title, and description.
      type: "profile",
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: displayName,
            },
          ]
        : undefined,
    },
    twitter: {
      // `summary_large_image` shows the photo as a big card on Twitter;
      // `summary` falls back to a small thumbnail when no image is set.
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}

function formatFollowers(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(v);
}

export default function KitLayout({ children }) {
  return children;
}
