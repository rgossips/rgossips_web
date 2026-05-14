/**
 * Delete a user (auth + all influencer data) by instagram_handle.
 *
 *   node scripts/delete_user.js <handle>           # dry run
 *   node scripts/delete_user.js <handle> --commit  # actually delete
 */

const fs = require("fs");
const path = require("path");

// Load .env.local manually
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const handle = (process.argv[2] || "").replace(/^@/, "");
const COMMIT = process.argv.includes("--commit");
if (!handle) {
  console.error("Usage: node scripts/delete_user.js <handle> [--commit]");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  console.log(`\n=== Lookup for handle "${handle}" ===\n`);

  // 1. influencer_profiles
  const { data: prof, error: profErr } = await sb
    .from("influencer_profiles")
    .select("influencer_id, full_name, username, instagram_handle, created_at")
    .ilike("instagram_handle", handle)
    .maybeSingle();
  if (profErr) {
    console.error("influencer_profiles lookup error:", profErr.message);
    process.exit(1);
  }
  if (!prof) {
    console.log("No influencer_profiles row for that handle. Trying invitations…");
  } else {
    console.log("influencer_profiles:", prof);
  }

  const userId = prof?.influencer_id;

  // 2. influencer_invitations (pending or claimed)
  const { data: invs } = await sb
    .from("influencer_invitations")
    .select("id, instagram_username, status, claimed_by")
    .ilike("instagram_username", handle);
  console.log("influencer_invitations:", invs || []);

  if (!userId) {
    console.log("\nNo auth user resolved — only invitations would be removed.");
  } else {
    // 3. counts of related rows
    const counts = {};
    const tables = [
      ["campaign_applications", "influencer_id"],
      ["notifications", "user_id"],
      ["conversations", "influencer_id"],
    ];
    for (const [t, col] of tables) {
      const { count } = await sb.from(t).select("*", { count: "exact", head: true }).eq(col, userId);
      counts[t] = count ?? 0;
    }
    // messages by sender
    {
      const { count } = await sb
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", userId);
      counts["messages (sent)"] = count ?? 0;
    }
    console.log("\nRelated row counts:", counts);

    // auth user
    const { data: authUser, error: authErr } = await sb.auth.admin.getUserById(userId);
    if (authErr) console.log("auth.admin.getUserById error:", authErr.message);
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

  if (userId) {
    // conversation ids first (so we can null/clear messages)
    const { data: convs } = await sb
      .from("conversations")
      .select("conversation_id")
      .eq("influencer_id", userId);
    const convIds = (convs || []).map((c) => c.conversation_id);

    if (convIds.length) {
      const { error } = await sb.from("messages").delete().in("conversation_id", convIds);
      console.log(`messages by conversation: ${error ? "ERR " + error.message : "ok"}`);
    }

    {
      const { error } = await sb.from("messages").delete().eq("sender_id", userId);
      console.log(`messages by sender: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("conversations").delete().eq("influencer_id", userId);
      console.log(`conversations: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("notifications").delete().eq("user_id", userId);
      console.log(`notifications: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("campaign_applications").delete().eq("influencer_id", userId);
      console.log(`campaign_applications: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.from("influencer_profiles").delete().eq("influencer_id", userId);
      console.log(`influencer_profiles: ${error ? "ERR " + error.message : "ok"}`);
    }
    {
      const { error } = await sb.auth.admin.deleteUser(userId);
      console.log(`auth.users: ${error ? "ERR " + error.message : "ok"}`);
    }
  }

  if (invs && invs.length) {
    const { error } = await sb
      .from("influencer_invitations")
      .delete()
      .ilike("instagram_username", handle);
    console.log(`influencer_invitations: ${error ? "ERR " + error.message : "ok"}`);
  }

  console.log("\nDone.");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
