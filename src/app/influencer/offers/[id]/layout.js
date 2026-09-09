// Server-side metadata for a shared campaign URL.
//
// Why this exists as a layout (vs in page.js): the page is "use client" —
// it needs hooks for the whole apply/deliverables/status UI, and a client
// page cannot export `generateMetadata`. A sibling server layout can, so it
// fetches the campaign at request time and injects Open Graph / Twitter Card
// tags into the SSR <head> while the client page keeps rendering. Same shape
// as src/app/kit/[id]/layout.js.
//
// Social crawlers (WhatsApp, Facebook, LinkedIn, X, Slack, iMessage) do not
// run JavaScript — the SSR HTML is the whole story they see. That is also why
// /influencer/offers/ had to become a public prefix in ProtectedRoute: while
// it was gated, the only HTML a crawler could reach was a loading spinner.
//
// A note on the CTA the brief asked for: no social platform renders a button
// inside a link preview — the card is image + title + description, and the
// whole card is one link. So "Apply now to this campaign" lives in the
// description text, which is the only place a crawler will show it.

const APP_URL = "https://rgossips.com";
const FALLBACK_TITLE = "Campaign · RGossips";
const FALLBACK_DESCRIPTION =
  "Browse paid and barter campaigns from verified Indian brands on RGossips.";

async function fetchCampaign(id) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      // `campaignId` narrows the response to one row. An older deployment of
      // the function ignores the unknown key and returns everything, which
      // the find() below still handles — so this degrades rather than breaks
      // if the function hasn't been redeployed yet.
      body: JSON.stringify({ campaignId: id }),
      // Re-fetch every 5 minutes so an edited brief or a swapped banner
      // reaches the OG cache reasonably quickly, without one edge-function
      // call per crawler hit.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = data?.campaigns || [];
    return rows.find((c) => String(c.id) === String(id)) || null;
  } catch (err) {
    console.error("campaign metadata fetch failed:", err?.message || err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const campaign = await fetchCampaign(id);
  const url = `${APP_URL}/influencer/offers/${id}`;

  if (!campaign) {
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        url,
        siteName: "RGossips",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
      },
      alternates: { canonical: url },
    };
  }

  const brand = campaign.brandName || "A brand";
  const title = `${campaign.title} · ${brand}`;

  // Facts first, CTA last — a preview is truncated from the end on some
  // platforms, so the payment and the deadline have to survive the cut.
  const facts = [
    campaign.budget && campaign.budget !== "On request" ? campaign.budget : null,
    campaign.deliverables || null,
    campaign.location || null,
    campaign.deadline && campaign.deadline !== "No deadline"
      ? `Apply by ${campaign.deadline}`
      : null,
  ].filter(Boolean);

  const description = [
    `${brand} is looking for creators.`,
    facts.length ? `${facts.join(" · ")}.` : null,
    "Apply now to this campaign on RGossips.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const image = campaign.bannerImage || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "RGossips",
      type: "article",
      locale: "en_IN",
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: campaign.title }]
        : undefined,
    },
    twitter: {
      // Campaign banners are cropped 3:1 on upload, so they carry a large
      // card well. Fall back to the small card when a campaign has no banner
      // rather than showing an empty image frame.
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default function CampaignDetailLayout({ children }) {
  return children;
}
