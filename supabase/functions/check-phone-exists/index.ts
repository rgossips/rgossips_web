// Sign-in pre-check: does this phone belong to a registered influencer or
// brand? Saves unknown numbers to the leads table for marketing follow-up.
//
// Body: { phone: string, role?: 'influencer' | 'brand' }
//   phone may come with or without + / spaces; we strip to digits and
//   ensure 91 prefix.
//
// Returns:
//   { exists: true,  role: 'influencer' | 'brand', match: boolean }
//   { exists: false } — and phone is upserted into `leads`
//
// `match` tells the client whether the registered role lines up with the
// role the user picked at sign-in (used to surface a clearer error).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = (await req.json()) || {};
    const rawPhone = (body.phone || "").toString();
    const role = body.role === "brand" ? "brand" : body.role === "influencer" ? "influencer" : null;

    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      return new Response(JSON.stringify({ error: "Enter a valid phone number" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    const phone = digits.startsWith("91") ? digits : `91${digits.slice(-10)}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Find the auth user by phone. Supabase Auth stores phone WITHOUT '+'.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
    });
    const usersJson = await usersRes.json();
    const existingUser = (usersJson?.users || []).find((u: any) =>
      [u.phone, `+${u.phone}`, u.phone?.slice(2)].includes(phone)
      || u.phone === phone
      || u.phone === phone.slice(2)
    );

    let foundRole: "influencer" | "brand" | null = null;
    if (existingUser?.id) {
      const [{ data: inf }, { data: br }] = await Promise.all([
        supabase.from("influencer_profiles").select("influencer_id").eq("influencer_id", existingUser.id).maybeSingle(),
        supabase.from("brand_profiles").select("brand_id").eq("brand_id", existingUser.id).maybeSingle(),
      ]);
      if (inf) foundRole = "influencer";
      else if (br) foundRole = "brand";
    }

    if (foundRole) {
      return new Response(
        JSON.stringify({
          exists: true,
          role: foundRole,
          match: role ? role === foundRole : true,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // 2) Unknown phone → record in leads (upsert bumps attempts + timestamp).
    try {
      const { data: prev } = await supabase
        .from("leads")
        .select("attempts")
        .eq("phone", phone)
        .maybeSingle();
      const nextAttempts = ((prev as any)?.attempts || 0) + 1;
      await supabase.from("leads").upsert(
        {
          phone,
          role_attempted: role,
          attempts: nextAttempts,
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      );
    } catch (e) {
      // Non-fatal — we still want to tell the user they aren't registered.
      console.error("Lead upsert failed:", e);
    }

    return new Response(JSON.stringify({ exists: false }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("check-phone-exists error:", err);
    return new Response(
      JSON.stringify({ error: (err as any)?.message || "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
