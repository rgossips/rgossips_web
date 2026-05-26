// One-off backfill: pulls profile pictures (and a few extras) from
// Apify for every brand_invitations row that has an instagram_username
// but no logo_url. Mirrors scripts/enrich_invitations.js but targets
// brands instead of influencers.
//
//   APIFY_TOKEN=apify_xxx node scripts/enrich_brand_invitations.js           # dry-run
//   APIFY_TOKEN=apify_xxx node scripts/enrich_brand_invitations.js --apply   # write
//   --username foo                                                            # single handle for testing
//   --no-logo                                                                 # only process rows still missing a logo
//
// Tip: --username on one row first to verify the Apify response shape,
// then --apply on the full set.

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const APIFY_TOKEN = process.env.APIFY_TOKEN || env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  console.error("Missing APIFY_TOKEN — set it in .env.local or pass APIFY_TOKEN=… node …");
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const NO_LOGO_ONLY = args.includes("--no-logo");
const usernameIdx = args.indexOf("--username");
const ONLY_USERNAME = usernameIdx >= 0 ? args[usernameIdx + 1]?.replace(/^@/, "") : null;

const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Brand logos live in their own bucket separate from influencer photos.
const BUCKET = "brand-icons";
const BATCH_SIZE = 50;
const ACTOR = "apify~instagram-profile-scraper";

async function scrapeBatch(usernames) {
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify ${res.status}: ${body.slice(0, 300)}`);
  }
  return await res.json();
}

async function uploadLogo(invitationId, photoUrl) {
  if (!photoUrl) return null;
  try {
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filePath = `invitations/${invitationId}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(filePath, buf, { contentType, upsert: true });
    if (error) {
      console.error(`    upload error: ${error.message}`);
      return null;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (e) {
    console.error(`    upload exception: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (writes DB)" : "DRY-RUN (no writes — pass --apply to commit)"}`);

  try {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5 * 1024 * 1024 });
  } catch {}

  let query = sb
    .from("brand_invitations")
    .select("id, brand_name, instagram_username, logo_url")
    .not("instagram_username", "is", null)
    .neq("instagram_username", "");
  if (ONLY_USERNAME) query = query.ilike("instagram_username", ONLY_USERNAME);
  if (NO_LOGO_ONLY) query = query.or("logo_url.is.null,logo_url.eq.");

  const { data: invitations, error } = await query;
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  console.log(`Found ${invitations.length} brand invitation(s) to process\n`);
  if (invitations.length === 0) return;

  let success = 0, notFound = 0, failed = 0;

  for (let i = 0; i < invitations.length; i += BATCH_SIZE) {
    const batch = invitations.slice(i, i + BATCH_SIZE);
    const usernames = batch.map((b) => b.instagram_username);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: scraping ${usernames.length} profile(s)…`);

    let scraped;
    try {
      scraped = await scrapeBatch(usernames);
    } catch (e) {
      console.error(`  batch error: ${e.message} — skipping`);
      failed += batch.length;
      continue;
    }

    const byUsername = new Map();
    for (const p of scraped) {
      if (p?.username) byUsername.set(String(p.username).toLowerCase(), p);
    }

    for (const inv of batch) {
      const key = inv.instagram_username.toLowerCase();
      const p = byUsername.get(key);
      if (!p) {
        console.log(`  • @${inv.instagram_username} — not in result, skipped`);
        notFound++;
        continue;
      }

      const photoSourceUrl = p.profilePicUrlHD || p.profilePicUrl || "";
      const verified = !!p.verified;
      const followers = Number(p.followersCount ?? p.followers ?? 0) || 0;

      const summary = `${followers ? followers.toLocaleString() + " followers" : "—"}${verified ? " ✓" : ""}${photoSourceUrl ? " + photo" : " (no photo)"}`;

      if (APPLY) {
        if (!photoSourceUrl) {
          console.log(`  · @${inv.instagram_username} — Apify returned no photo, skipping`);
          notFound++;
          continue;
        }
        const storedUrl = await uploadLogo(inv.id, photoSourceUrl);
        if (!storedUrl) {
          console.error(`  ✗ @${inv.instagram_username} — upload failed`);
          failed++;
          continue;
        }
        const { error: upErr } = await sb
          .from("brand_invitations")
          .update({ logo_url: storedUrl })
          .eq("id", inv.id);
        if (upErr) {
          console.error(`  ✗ @${inv.instagram_username}: ${upErr.message}`);
          failed++;
        } else {
          console.log(`  ✓ @${inv.instagram_username} — ${summary}`);
          success++;
        }
      } else {
        console.log(`  ~ @${inv.instagram_username} — ${summary}`);
        success++;
      }
    }
  }

  console.log(`\nDone. ${success} ${APPLY ? "updated" : "would update"}, ${notFound} not found / no photo, ${failed} failed.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
