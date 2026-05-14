const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const needle = (process.argv[2] || "").replace(/[^\d]/g, "");
if (!needle) { console.error("Usage: node scripts/find_by_phone.js <number>"); process.exit(1); }

(async () => {
  const variants = new Set([needle, "91" + needle, needle.replace(/^91/, "")]);
  console.log("Searching auth.users for phone variants:", [...variants]);

  let page = 1, hits = [];
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) { console.error("listUsers err:", error.message); break; }
    const users = data?.users || [];
    for (const u of users) {
      const p = (u.phone || "").replace(/[^\d]/g, "");
      if (variants.has(p) || p.endsWith(needle)) hits.push(u);
    }
    if (users.length < 1000) break;
    page++;
  }

  console.log(`\nFound ${hits.length} match(es):`);
  for (const u of hits) {
    console.log({
      id: u.id, email: u.email, phone: u.phone, created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      meta: u.user_metadata,
    });
  }

  // also probe profile tables by id
  for (const u of hits) {
    const { data: bp } = await sb.from("brand_profiles").select("brand_id, brand_name, instagram_username").eq("brand_id", u.id).maybeSingle();
    const { data: ip } = await sb.from("influencer_profiles").select("influencer_id, full_name, username, instagram_handle").eq("influencer_id", u.id).maybeSingle();
    console.log("  brand_profiles:", bp || "—");
    console.log("  influencer_profiles:", ip || "—");
  }
})().catch((e) => { console.error(e); process.exit(1); });
