// One-off: migrate any influencer_profiles rows whose profile_photo_url is
// still pointing at the Instagram CDN (cdninstagram.com / fbcdn.net) into
// our influencer-photos bucket. Those CDN URLs expire after a day or two,
// which is why several creators rendered as empty avatars on /brands/search.
//
// Idempotent — re-running just refreshes the cached copy.

const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const BUCKET = "influencer-photos";

(async () => {
  try {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5 * 1024 * 1024 });
  } catch {}

  const { data: rows, error } = await sb
    .from("influencer_profiles")
    .select("influencer_id, full_name, username, instagram_handle, profile_photo_url")
    .or("profile_photo_url.ilike.%cdninstagram.com%,profile_photo_url.ilike.%fbcdn.net%");

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  console.log(`Found ${rows.length} influencer(s) with expiring Instagram CDN URLs.\n`);

  let success = 0, failed = 0;
  for (const r of rows) {
    const handle = r.instagram_handle || r.username || r.full_name || r.influencer_id;
    try {
      const imgRes = await fetch(r.profile_photo_url);
      if (!imgRes.ok) {
        console.log(`  ✗ ${handle} — source URL returned ${imgRes.status} (probably already expired)`);
        failed++;
        continue;
      }
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const filePath = `profiles/${r.influencer_id}.jpg`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(filePath, buf, { contentType, upsert: true });
      if (upErr) {
        console.log(`  ✗ ${handle} — upload error: ${upErr.message}`);
        failed++;
        continue;
      }
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(filePath);
      const newUrl = `${pub.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await sb
        .from("influencer_profiles")
        .update({ profile_photo_url: newUrl, updated_at: new Date().toISOString() })
        .eq("influencer_id", r.influencer_id);
      if (dbErr) {
        console.log(`  ✗ ${handle} — db error: ${dbErr.message}`);
        failed++;
        continue;
      }
      console.log(`  ✓ ${handle} — migrated to storage`);
      success++;
    } catch (e) {
      console.log(`  ✗ ${handle} — ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} migrated, ${failed} failed.`);
})();
