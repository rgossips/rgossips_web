// One-time backfill: enrich `influencer_invitations` rows with data scraped
// from Instagram via Apify. Updates profile picture (download → upload to
// Supabase storage so the URL doesn't expire), followers count, bio, etc.
//
// Usage:
//   APIFY_TOKEN=apify_xxx node scripts/enrich_invitations.js               # dry-run, prints planned changes
//   APIFY_TOKEN=apify_xxx node scripts/enrich_invitations.js --apply       # actually writes
//   APIFY_TOKEN=apify_xxx node scripts/enrich_invitations.js --username foo  # target one row (testing)
//
// Tip: run with --username on one invitation first to verify the Apify
// payload shape, then with --apply on the full set.

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
const ONLY_MISSING = args.includes("--only-missing");
const usernameIdx = args.indexOf("--username");
const ONLY_USERNAME = usernameIdx >= 0 ? args[usernameIdx + 1]?.replace(/^@/, "") : null;

const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = "influencer-photos";
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

async function uploadProfilePhoto(invitationId, photoUrl) {
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

// notes column packs both free text and a JSON metadata blob, joined by
// "\n---\n" — preserve the free text, merge new keys into the JSON.
function mergeNotes(existing, extras) {
  let text = "";
  let meta = {};
  if (existing) {
    const sep = existing.indexOf("\n---\n");
    if (sep >= 0) {
      text = existing.slice(0, sep);
      try { meta = JSON.parse(existing.slice(sep + 5)) || {}; } catch {}
    } else {
      try { meta = JSON.parse(existing) || {}; } catch { text = existing; }
    }
  }
  const merged = { ...meta, ...extras };
  return text ? `${text}\n---\n${JSON.stringify(merged)}` : JSON.stringify(merged);
}

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (writes DB)" : "DRY-RUN (no writes — pass --apply to commit)"}`);

  // Ensure bucket exists (no-op if already created)
  try {
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5 * 1024 * 1024 });
  } catch {}

  let query = sb
    .from("influencer_invitations")
    .select("id, full_name, instagram_username, profile_photo_url, notes")
    .eq("status", "pending");
  if (ONLY_USERNAME) query = query.ilike("instagram_username", ONLY_USERNAME);
  // --only-missing: skip rows that already have a `followers` key in their
  // notes JSON. Used to resume after a partial run without re-spending Apify
  // credits on rows we already updated.
  if (ONLY_MISSING) query = query.not("notes", "ilike", '%"followers"%');

  const { data: invitations, error } = await query;
  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  console.log(`Found ${invitations.length} pending invitation(s)\n`);
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
      const followers = Number(p.followersCount ?? p.followers ?? 0) || 0;
      const follows = Number(p.followsCount ?? p.follows ?? 0) || 0;
      const posts = Number(p.postsCount ?? p.mediaCount ?? 0) || 0;
      const bio = (p.biography || "").trim();
      const verified = !!p.verified;
      const businessCategory = p.businessCategoryName || "";

      const newNotes = mergeNotes(inv.notes, {
        followers,
        follows,
        posts,
        bio,
        verified,
        businessCategory,
      });

      const updates = { notes: newNotes };

      // Replace photo if Apify returned one — admin-uploaded photos live at
      // /photos/* in the same bucket, scraped ones at /invitations/*, so the
      // path itself signals provenance.
      if (photoSourceUrl) {
        if (APPLY) {
          const storedUrl = await uploadProfilePhoto(inv.id, photoSourceUrl);
          if (storedUrl) updates.profile_photo_url = storedUrl;
        } else {
          updates.profile_photo_url = "(would upload)";
        }
      }

      // Only overwrite full_name when the existing one is blank — admin may
      // have entered a preferred display name.
      if (p.fullName && (!inv.full_name || !inv.full_name.trim())) {
        updates.full_name = p.fullName;
      }

      const summary = `${followers.toLocaleString()} followers${verified ? " ✓" : ""}${updates.profile_photo_url ? " + photo" : ""}${updates.full_name ? ` + name="${updates.full_name}"` : ""}`;

      if (APPLY) {
        const { error: upErr } = await sb
          .from("influencer_invitations")
          .update(updates)
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

  console.log(`\nDone. ${success} ${APPLY ? "updated" : "would update"}, ${notFound} not found, ${failed} failed.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
