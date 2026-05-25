// One-off: walk every campaign_application with submission_links and fetch
// the og:image meta tag for each live URL, storing it back into the link's
// `thumbnail` field. Once the influencer profile starts rendering tiles,
// existing rows need this backfill — going forward submit-deliverables
// fills it on the way in.
//
// Idempotent: if a link already has thumbnail, we skip the fetch for it.
//
//   node scripts/backfill_submission_thumbnails.js              # dry-run
//   node scripts/backfill_submission_thumbnails.js --apply      # write
//
// `--app <id>` to scope to a single application during testing.

const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const appIdx = args.indexOf("--app");
const ONE_APP_ID = appIdx >= 0 ? args[appIdx + 1] : null;

async function extractOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1].replace(/&amp;/g, "&") : null;
  } catch {
    return null;
  }
}

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (writes DB)" : "DRY-RUN (use --apply)"}`);

  let q = sb
    .from("campaign_applications")
    .select("id, status, submission_links")
    .in("status", ["live_submitted", "completed"]);
  if (ONE_APP_ID) q = q.eq("id", ONE_APP_ID);

  const { data: apps, error } = await q;
  if (error) { console.error("Fetch failed:", error.message); process.exit(1); }
  console.log(`Found ${apps.length} application(s) with live submissions.\n`);

  let scanned = 0, fetched = 0, missed = 0, written = 0;

  for (const app of apps) {
    const links = Array.isArray(app.submission_links) ? app.submission_links : [];
    if (links.length === 0) continue;

    const updated = [];
    let changed = false;
    for (const l of links) {
      scanned++;
      if (!l?.url) { updated.push(l); continue; }
      if (l.thumbnail) { updated.push(l); continue; } // already filled

      const thumb = await extractOgImage(l.url);
      if (thumb) {
        fetched++;
        updated.push({ ...l, thumbnail: thumb });
        changed = true;
        console.log(`  ✓ ${l.url.slice(0, 80)} → got thumbnail`);
      } else {
        missed++;
        updated.push(l);
        console.log(`  · ${l.url.slice(0, 80)} → no og:image`);
      }
    }

    if (changed && APPLY) {
      const { error: upErr } = await sb
        .from("campaign_applications")
        .update({ submission_links: updated })
        .eq("id", app.id);
      if (upErr) {
        console.log(`  ✗ ${app.id}: ${upErr.message}`);
      } else {
        written++;
      }
    }
  }

  console.log(`\nScanned ${scanned} link(s) — ${fetched} new thumbnails, ${missed} couldn't extract.`);
  if (APPLY) console.log(`Wrote ${written} application row(s).`);
})().catch((e) => { console.error(e); process.exit(1); });
