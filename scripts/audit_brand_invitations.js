const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const { data } = await sb.from("brand_invitations").select("id, brand_name, instagram_username, logo_url");
  console.log(`Total brand_invitations: ${data.length}`);
  const noLogo = data.filter((r) => !r.logo_url);
  const noLogoWithHandle = noLogo.filter((r) => r.instagram_username);
  const noLogoNoHandle = noLogo.filter((r) => !r.instagram_username);
  console.log(`  with logo: ${data.length - noLogo.length}`);
  console.log(`  empty logo + has instagram_username: ${noLogoWithHandle.length}  ← Apify target`);
  console.log(`  empty logo + no handle (can't enrich): ${noLogoNoHandle.length}`);
  if (noLogoWithHandle.length > 0) {
    console.log(`\nSample handles to scrape:`);
    noLogoWithHandle.slice(0, 5).forEach((r) => {
      console.log(`  @${r.instagram_username}  (${r.brand_name || r.id})`);
    });
  }
})();
