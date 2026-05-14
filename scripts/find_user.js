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

const needle = (process.argv[2] || "").replace(/^@/, "");
const fuzzy = `%${needle.replace(/_/g, "\\_")}%`;
const loose = `%${needle.replace(/_/g, "")}%`;

(async () => {
  console.log(`Searching for "${needle}"…\n`);

  // influencer_profiles — instagram_handle, username, full_name
  for (const col of ["instagram_handle", "username", "full_name"]) {
    const { data } = await sb
      .from("influencer_profiles")
      .select("influencer_id, full_name, username, instagram_handle, created_at")
      .ilike(col, `%${needle}%`);
    if (data?.length) console.log(`influencer_profiles.${col} matches:`, data);
  }

  // brand_profiles
  for (const col of ["instagram_username", "brand_name", "username"]) {
    const { data, error } = await sb
      .from("brand_profiles")
      .select("brand_id, brand_name, instagram_username, created_at")
      .ilike(col, `%${needle}%`);
    if (error && !/column .* does not exist/i.test(error.message))
      console.log(`brand_profiles.${col} err:`, error.message);
    if (data?.length) console.log(`brand_profiles.${col} matches:`, data);
  }

  // invitations
  for (const t of ["influencer_invitations", "brand_invitations"]) {
    const { data, error } = await sb
      .from(t)
      .select("*")
      .ilike("instagram_username", `%${needle}%`);
    if (error) console.log(`${t} err:`, error.message);
    if (data?.length) console.log(`${t} matches:`, data);
  }

  // auth.users — list and grep client side (admin API doesn't take a search)
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) console.log("auth list err:", listErr.message);
  const want = needle.toLowerCase();
  const wantLoose = needle.toLowerCase().replace(/_/g, "");
  const matches = (list?.users || []).filter((u) => {
    const blob = JSON.stringify({
      email: u.email,
      phone: u.phone,
      meta: u.user_metadata,
      app: u.app_metadata,
    }).toLowerCase();
    return blob.includes(want) || blob.includes(wantLoose);
  });
  if (matches.length) {
    console.log("auth.users matches:", matches.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      meta: u.user_metadata,
    })));
  } else {
    console.log("auth.users: no match");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
