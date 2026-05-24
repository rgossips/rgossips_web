// Hard-deletes brand accounts whose 30-day grace period has elapsed.
//
// A brand sits in `status='pending_deletion'` from the moment the user
// taps Delete in their profile. They have 30 days to email support and
// get restored. Past that window this script:
//
//   1. Finds matching brand_profiles rows
//   2. Deletes every related campaign (which cascades through applications,
//      submissions and messages via the FKs in 002_brand_campaigns.sql)
//   3. Deletes the brand_profiles row
//   4. Deletes the auth.users row (releases the phone number for re-signup)
//   5. Tries to remove the logo file from storage
//
// Safe to run repeatedly. Dry-run by default — pass --apply to actually
// destroy data.
//
//   node scripts/purge_deleted_brands.js              # preview
//   node scripts/purge_deleted_brands.js --apply      # really delete
//
// Wire this up as a daily cron (Supabase Scheduled Functions or any
// external scheduler) once you're comfortable with the output.

const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const APPLY = process.argv.includes("--apply");
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const GRACE_DAYS = 30;

(async () => {
  console.log(`Mode: ${APPLY ? "APPLY (destructive)" : "DRY-RUN (use --apply to delete)"}`);

  const cutoff = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("brand_profiles")
    .select("brand_id, brand_name, gstin_trade_name, deleted_at, deletion_reason, logo_url")
    .eq("status", "pending_deletion")
    .lte("deleted_at", cutoff);

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }
  console.log(`Found ${rows.length} brand(s) past their ${GRACE_DAYS}-day grace window.\n`);
  if (rows.length === 0) return;

  let success = 0, failed = 0;

  for (const b of rows) {
    const label = b.gstin_trade_name || b.brand_name || b.brand_id;
    console.log(`\n• ${label} (deleted_at=${b.deleted_at})`);

    if (!APPLY) {
      // Count what would be removed so the dry-run is useful.
      const { count: campaignCount } = await sb
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", b.brand_id);
      console.log(`  would delete: ${campaignCount ?? 0} campaign(s) + this brand + auth.users + logo`);
      success++;
      continue;
    }

    try {
      // Campaigns first (CASCADE handles applications/submissions/messages
      // because those FKs are set up that way in migration 002).
      const { error: campErr } = await sb.from("campaigns").delete().eq("brand_id", b.brand_id);
      if (campErr) throw new Error(`campaigns: ${campErr.message}`);

      // brand_profiles row
      const { error: bpErr } = await sb.from("brand_profiles").delete().eq("brand_id", b.brand_id);
      if (bpErr) throw new Error(`brand_profiles: ${bpErr.message}`);

      // auth.users (frees the phone number)
      const { error: authErr } = await sb.auth.admin.deleteUser(b.brand_id);
      if (authErr) {
        // Non-fatal — log and continue. The profile is already gone so the
        // phone is effectively a stranded auth row.
        console.log(`  ✗ auth.users.deleteUser failed: ${authErr.message}`);
      }

      // Best-effort logo cleanup
      if (b.logo_url && b.logo_url.includes("/brand-icons/")) {
        const m = b.logo_url.match(/brand-icons\/(.+?)(?:\?|$)/);
        if (m) {
          await sb.storage.from("brand-icons").remove([m[1]]).catch(() => {});
        }
      }

      console.log(`  ✓ purged`);
      success++;
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} ${APPLY ? "purged" : "would purge"}, ${failed} failed.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
