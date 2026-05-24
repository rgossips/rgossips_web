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
  if (u.includes("/brand-icons/")) return "supabase_storage";
  if (u.includes("/influencer-photos/")) return "supabase_storage";
  if (u.startsWith("https://lh3.googleusercontent.com")) return "google_lh3_drive";
  if (u.startsWith("http")) return "external_other";
  return "other";
};

(async () => {
  const { data: profiles } = await sb.from("brand_profiles").select("brand_id, brand_name, gstin_trade_name, logo_url");
  const { data: invs } = await sb.from("brand_invitations").select("id, brand_name, instagram_username, logo_url");

  console.log(`brand_profiles: ${profiles.length}`);
  const pb = {};
  for (const p of profiles) {
    const k = classify(p.logo_url);
    pb[k] = (pb[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(pb).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

  console.log(`\nbrand_invitations: ${invs.length}`);
  const ib = {};
  for (const r of invs) {
    const k = classify(r.logo_url);
    ib[k] = (ib[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(ib).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

  // Spot-check some URLs to see actual response codes
  const sample = [
    ...profiles.filter((p) => p.logo_url).slice(0, 3),
    ...invs.filter((r) => r.logo_url).slice(0, 5),
  ];
  console.log(`\nSpot-checking ${sample.length} URLs:`);
  for (const r of sample) {
    const u = r.logo_url;
    const label = r.gstin_trade_name || r.brand_name || r.instagram_username || r.id;
    try {
      const res = await fetch(u, { method: "HEAD" });
      console.log(`  ${res.status} ${label}: ${u.slice(0, 90)}…`);
    } catch (e) {
      console.log(`  ERR ${label}: ${e.message}`);
    }
  }
})();
