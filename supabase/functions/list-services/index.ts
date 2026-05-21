// Public services catalogue read. Returns every active service, ordered by
// display_order. Optional ?slug=foo or { slug } in body to fetch one.

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    let slug = url.searchParams.get("slug");
    if (!slug && req.method === "POST") {
      try {
        const body = await req.json();
        slug = body?.slug || null;
      } catch {
        /* no body — list all */
      }
    }

    if (slug) {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ service: data || null }), { status: 200, headers: jsonHeaders });
    }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ services: data || [] }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as any)?.message || "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
