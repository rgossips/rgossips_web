const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const { data } = await sb
    .from("notifications")
    .select("type, body, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const byType = {};
  for (const n of data) {
    if (!byType[n.type]) {
      let link = null, hasText = false;
      try { const b = JSON.parse(n.body); link = b.link || null; hasText = !!b.text; } catch {}
      byType[n.type] = { link, hasText, rawSample: (n.body || "").slice(0, 80) };
    }
  }
  console.log("Notification types seen (most recent of each):\n");
  for (const [type, info] of Object.entries(byType)) {
    console.log(`  ${type}`);
    console.log(`     link: ${info.link || "(none)"}`);
    console.log(`     body: ${info.rawSample}`);
  }
})();
