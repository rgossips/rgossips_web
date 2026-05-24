// One-off audit: bucket every influencer + invitation photo URL by source
// so we can see why some images don't load on /brands/search.
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const classify = (u) => {
  if (!u) return "empty";
  if (u.includes("cdninstagram.com") || u.includes("fbcdn.net")) return "instagram_cdn_expiring";
  if (u.includes("/influencer-photos/")) return "supabase_storage";
  if (u.includes("/brand-icons/")) return "supabase_storage";
  if (u.startsWith("http")) return "external_other";
  return "other";
};

async function pageAll(table, select, extra = {}) {
  const out = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    let q = sb.from(table).select(select).range(from, from + PAGE - 1);
    if (extra.eq) {
      for (const [col, val] of Object.entries(extra.eq)) q = q.eq(col, val);
    }
    const { data, error } = await q;
    if (error) { console.error(`${table}:`, error.message); break; }
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

(async () => {
  console.log("Auditing profile_photo_url across influencers + invitations…\n");

  // Active registered influencers
  const profiles = await pageAll(
    "influencer_profiles",
    "influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url",
    { eq: { status: "active" } }
  );

  const profileBuckets = {};
  let withCustom = 0;
  for (const p of profiles) {
    const url = p.custom_profile_photo_url || p.profile_photo_url;
    const k = classify(url);
    profileBuckets[k] = (profileBuckets[k] || 0) + 1;
    if (p.custom_profile_photo_url) withCustom++;
  }
  console.log(`influencer_profiles (active): ${profiles.length}`);
  console.log(`  with custom photo: ${withCustom}`);
  for (const [k, v] of Object.entries(profileBuckets).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // Pending invitations
  const invites = await pageAll(
    "influencer_invitations",
    "id, instagram_username, profile_photo_url",
    { eq: { status: "pending" } }
  );
  const inviteBuckets = {};
  for (const r of invites) {
    const k = classify(r.profile_photo_url);
    inviteBuckets[k] = (inviteBuckets[k] || 0) + 1;
  }
  console.log(`\ninfluencer_invitations (pending): ${invites.length}`);
  for (const [k, v] of Object.entries(inviteBuckets).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // Sample a few storage URLs to actually verify they 200
  const supabasePhotos = profiles
    .map((p) => p.custom_profile_photo_url || p.profile_photo_url)
    .concat(invites.map((r) => r.profile_photo_url))
    .filter((u) => u && u.includes("/influencer-photos/"));

  const sample = supabasePhotos.slice(0, 6);
  console.log(`\nSpot-checking ${sample.length} storage URLs…`);
  for (const u of sample) {
    try {
      const res = await fetch(u, { method: "HEAD" });
      console.log(`  ${res.status} ${u.slice(0, 90)}${u.length > 90 ? "…" : ""}`);
    } catch (e) {
      console.log(`  ERR ${e.message}`);
    }
  }

  // Spot-check IG CDN URLs to confirm they 403
  const igPhotos = profiles
    .map((p) => p.profile_photo_url)
    .filter((u) => u && (u.includes("cdninstagram.com") || u.includes("fbcdn.net")));
  const igSample = igPhotos.slice(0, 6);
  if (igSample.length > 0) {
    console.log(`\nSpot-checking ${igSample.length} Instagram CDN URLs…`);
    for (const u of igSample) {
      try {
        const res = await fetch(u, { method: "HEAD" });
        console.log(`  ${res.status} ${u.slice(0, 90)}…`);
      } catch (e) {
        console.log(`  ERR ${e.message}`);
      }
    }
  }
})();
