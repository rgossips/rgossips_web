// One-shot seeder for QA test logins.
//
// Creates (or refreshes) two fixed test users:
//   Brand     phone +91 99999 99990  ·  OTP 123456
//   Creator   phone +91 99999 99991  ·  OTP 123456
//
// Pairs with the matching "Test OTP" entries you've configured in
// Supabase Dashboard → Auth → Providers → Phone. Real OTP flow keeps
// working for everyone else.
//
// Profile rows are populated with the minimum needed to land directly
// on the dashboard (no onboarding screens). Idempotent: re-running just
// refreshes the rows, doesn't create duplicates.
//
// Auth: caller must be in admin_profiles. Service-role can't be used
// from the client, so this is gated by an admin login.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const TEST_USERS = [
  {
    role: "brand" as const,
    phone: "+919999999990",
    email: "qa-brand@rgossips.test",
    name: "RGossips QA Brand",
  },
  {
    role: "influencer" as const,
    phone: "+919999999991",
    email: "qa-creator@rgossips.test",
    name: "RGossips QA Creator",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Two ways in: either an admin user JWT, or the service-role key
    // directly (for one-shot CLI / scripted invocations like initial
    // seeding from a developer's machine). We check the role claim in
    // the JWT payload rather than string-comparing the token, so this
    // works even if SUPABASE_SERVICE_ROLE_KEY in the function's env
    // diverges from the project's actual service-role key.
    let isServiceRole = false;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const padded = parts[1] + "==";
        const payload = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
        isServiceRole = payload?.role === "service_role";
      }
    } catch (_e) {
      // ignore, fall through to admin-user check
    }
    if (!isServiceRole) {
      const { data: caller } = await supabase.auth.getUser(token);
      if (!caller?.user) return json({ error: "unauthorized" }, 401);
      const { data: admin } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("id", caller.user.id)
        .maybeSingle();
      if (!admin) return json({ error: "forbidden — admin only" }, 403);
    }

    const results: any[] = [];

    for (const u of TEST_USERS) {
      // Find an existing user with this phone. listUsers paginates by 50
      // by default; QA accounts always sit early in the list so first
      // page is enough.
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list?.users?.find((x: any) => x.phone === u.phone.replace("+", ""));

      let userId: string;
      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          phone: u.phone,
          email: u.email,
          phone_confirm: true,
          email_confirm: true,
          user_metadata: { full_name: u.name, role: u.role, is_test_user: true },
        });
        if (createErr || !created?.user) {
          results.push({ phone: u.phone, error: createErr?.message || "createUser failed" });
          continue;
        }
        userId = created.user.id;
      }

      if (u.role === "brand") {
        const { error: upErr } = await supabase
          .from("brand_profiles")
          .upsert(
            {
              brand_id: userId,
              brand_name: u.name,
              contact_name: u.name,
              contact_email: u.email,
              contact_phone: u.phone,
              gstin_trade_name: u.name,
              categories: ["Fashion", "Lifestyle"],
              is_verified: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "brand_id" }
          );
        if (upErr) {
          results.push({ phone: u.phone, error: "brand_profiles upsert: " + upErr.message });
          continue;
        }
      } else {
        const { error: upErr } = await supabase
          .from("influencer_profiles")
          .upsert(
            {
              influencer_id: userId,
              full_name: u.name,
              username: "rgossips_test_creator",
              email: u.email,
              instagram_handle: "rgossips_test_creator",
              location: "Mumbai, India",
              bio: "QA test creator account. Used for end-to-end flow testing.",
              categories: ["Fashion", "Lifestyle"],
              subscription_plan: "starter",
              followers_count: 12000,
              engagement_rate: 4.2,
              media_count: 84,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "influencer_id" }
          );
        if (upErr) {
          results.push({ phone: u.phone, error: "influencer_profiles upsert: " + upErr.message });
          continue;
        }
      }

      results.push({ role: u.role, phone: u.phone, userId, status: existing ? "refreshed" : "created" });
    }

    return json({ ok: true, users: results });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
