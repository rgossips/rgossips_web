import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return new Response(
        JSON.stringify({ error: "file is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }
    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Only images are allowed" }),
        { status: 400, headers: jsonHeaders }
      );
    }
    if (file.size > 3 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File must be under 3MB" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Ensure bucket exists (idempotent — ignore error if it already exists)
    try {
      await supabaseAdmin.storage.createBucket("campaign-images", {
        public: true,
        fileSizeLimit: 3 * 1024 * 1024,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
      });
    } catch {}

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${timestamp}_${rand}.${ext}`;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from("campaign-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Upload failed: " + uploadError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("campaign-images")
      .getPublicUrl(path);

    return new Response(
      JSON.stringify({ success: true, url: urlData.publicUrl }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + ((err as any)?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
