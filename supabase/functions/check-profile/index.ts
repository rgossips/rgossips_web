import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ error: "Use POST method" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { userId, table } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Strip sensitive fields before returning to client.
    // Expose a derived `instagram_connected` boolean + expiry timestamp
    // so the dashboard gate / banner can render correctly without ever
    // seeing the raw token. Token + raw expiry stay server-side only.
    const sanitize = (data: Record<string, unknown> | null) => {
      if (!data) return data;
      const { instagram_access_token, instagram_token_expires_at, ...safe } = data;
      return {
        ...safe,
        instagram_connected: !!instagram_access_token,
        instagram_token_expires_at: instagram_token_expires_at || null,
      };
    };

    // If a specific table is requested, check only that one
    if (table) {
      if (table !== "influencer_profiles" && table !== "brand_profiles") {
        return new Response(
          JSON.stringify({ error: "Invalid table" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const idCol = table === "brand_profiles" ? "brand_id" : "influencer_id";
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("*")
        .eq(idCol, userId)
        .maybeSingle();

      if (error) {
        console.error("DB Error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          exists: !!data,
          profile: sanitize(data),
          role: data ? (table === "brand_profiles" ? "brand" : "influencer") : null,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // No table specified — check both
    const [infRes, brandRes] = await Promise.all([
      supabaseAdmin
        .from("influencer_profiles")
        .select("*")
        .eq("influencer_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("brand_profiles")
        .select("*")
        .eq("brand_id", userId)
        .maybeSingle(),
    ]);

    if (infRes.error && brandRes.error) {
      console.error("DB Errors:", infRes.error, brandRes.error);
      return new Response(
        JSON.stringify({ error: infRes.error.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (infRes.data) {
      return new Response(
        JSON.stringify({ exists: true, profile: sanitize(infRes.data), role: "influencer" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (brandRes.data) {
      return new Response(
        JSON.stringify({ exists: true, profile: sanitize(brandRes.data), role: "brand" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ exists: false, profile: null, role: null }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
