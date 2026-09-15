// Homepage spotlight — one of the three Elite discovery perks.
//
// Every homepage creator carousel used to show only what an admin typed into
// public.featured_creators, so buying Elite put nobody on the homepage. Now
// live Elite creators lead the carousel and the admin's picks follow.
//
// The Elite list comes from list-influencers ({ eliteOnly: true }) rather
// than a direct table read: influencer_profiles is not anon-readable, and
// list-influencers already honours the Public Profile toggle and blocks, so a
// creator who went private is not spotlighted just for paying.

export function formatFollowers(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

/** Live Elite creators, best first. Never throws — the carousel still has the curated list. */
export async function fetchEliteSpotlight(supabase, limit = 12) {
  try {
    const { data, error } = await supabase.functions.invoke("list-influencers", {
      body: { eliteOnly: true, limit },
    });
    if (error || !Array.isArray(data?.influencers)) return [];
    return data.influencers.filter((r) => r.is_elite);
  } catch {
    return [];
  }
}

/** A list-influencers row in the shape the homepage carousels render. */
export function spotlightCard(r) {
  const handle = r.instagram_handle || r.username || "";
  return {
    name: handle || r.full_name || "",
    verified: true,
    elite: true,
    image: r.profile_photo_url || "",
    followers: formatFollowers(r.followers_count),
    posts: "",
    following: "",
    bio: r.full_name || "",
    link: handle ? `https://www.instagram.com/${handle}/` : "",
  };
}

/** Elite first, then the curated list, without showing anyone twice. */
export function mergeSpotlight(eliteRows, curated) {
  const elite = eliteRows.map(spotlightCard).filter((c) => c.name);
  const seen = new Set(elite.map((c) => c.name.toLowerCase()));
  return [...elite, ...curated.filter((c) => !seen.has(String(c.name || "").toLowerCase()))];
}
