/**
 * Delete a brand (auth + brand data) by instagram_username.
 *
 *   node scripts/delete_brand.js <handle>           # dry run
 *   node scripts/delete_brand.js <handle> --commit  # actually delete
 */

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

const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const handle = (process.argv[2] || "").replace(/^@/, "");
const COMMIT = process.argv.includes("--commit");
if (!handle) {
  console.error("Usage: node scripts/delete_brand.js <handle> [--commit]");
  process.exit(1);
}

(async () => {
  console.log(`\n=== Lookup for brand handle "${handle}" ===\n`);

  const { data: brand, error: bErr } = await sb
    .from("brand_profiles")
    .select("brand_id, brand_name, instagram_username, created_at")
    .ilike("instagram_username", handle)
    .maybeSingle();
  if (bErr) {
    console.error("brand_profiles err:", bErr.message);
    process.exit(1);
  }
  if (!brand) {
    console.log("No brand_profiles row.");
  } else {
    console.log("brand_profiles:", brand);
  }

  const { data: invites } = await sb
    .from("brand_invitations")
    .select("*")
    .ilike("instagram_username", handle);
  console.log("brand_invitations:", invites || []);

  const brandId = brand?.brand_id;
  let campaignIds = [];

  if (brandId) {
    const { data: camps } = await sb
      .from("campaigns")
      .select("campaign_id, title")
      .eq("brand_id", brandId);
    campaignIds = (camps || []).map((c) => c.campaign_id);
    console.log("campaigns:", camps || []);

    let appCount = 0;
    if (campaignIds.length) {
      const { count } = await sb
        .from("campaign_applications")
        .select("*", { count: "exact", head: true })
        .in("campaign_id", campaignIds);
      appCount = count ?? 0;
    }
    const { count: convCount } = await sb
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brandId);
    const { count: notifCount } = await sb
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", brandId);

    console.log("\nRelated counts:", {
      campaigns: campaignIds.length,
      campaign_applications: appCount,
      conversations: convCount ?? 0,
      notifications: notifCount ?? 0,
    });

    const { data: authUser, error: authErr } = await sb.auth.admin.getUserById(brandId);
    if (authErr) console.log("auth err:", authErr.message);
    else
      console.log("auth.users:", {
        id: authUser?.user?.id,
        email: authUser?.user?.email,
        phone: authUser?.user?.phone,
        created_at: authUser?.user?.created_at,
      });
  }

  if (!COMMIT) {
    console.log("\n(dry run — pass --commit to actually delete)\n");
    return;
  }

  console.log("\n=== DELETING ===\n");

  if (brandId) {
    // conversations belonging to this brand → delete messages first
    const { data: convs } = await sb
      .from("conversations")
      .select("conversation_id")
      .eq("brand_id", brandId);
    const convIds = (convs || []).map((c) => c.conversation_id);
    if (convIds.length) {
      const { error } = await sb.from("messages").delete().in("conversation_id", convIds);
      console.log(`messages by conversation: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("messages").delete().eq("sender_id", brandId);
      console.log(`messages by sender: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("conversations").delete().eq("brand_id", brandId);
      console.log(`conversations: ${error ? "ERR " + error.message : "ok"}`);
    }
    if (campaignIds.length) {
      const { error } = await sb
        .from("campaign_applications")
        .delete()
        .in("campaign_id", campaignIds);
      console.log(`campaign_applications: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("campaigns").delete().eq("brand_id", brandId);
      console.log(`campaigns: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("notifications").delete().eq("user_id", brandId);
      console.log(`notifications: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("brand_profiles").delete().eq("brand_id", brandId);
      console.log(`brand_profiles: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.auth.admin.deleteUser(brandId);
      console.log(`auth.users: ${error ? "ERR " + error.message : "ok"}`);
    }
  }

  if (invites && invites.length) {
    const { error } = await sb
      .from("brand_invitations")
      .delete()
      .ilike("instagram_username", handle);
    console.log(`brand_invitations: ${error ? "ERR " + error.message : "ok"}`);
  }

  console.log("\nDone.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
