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
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const table = (formData.get("table") as string) || "influencer_profiles";

    if (!userId || !file) {
      return new Response(
        JSON.stringify({ error: "userId and file are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }
    if (table !== "influencer_profiles" && table !== "brand_profiles") {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 400, headers: jsonHeaders }
      );
    }
    // Size + type guard — the campaign-image uploader already caps at
    // 10MB; this one had NO limit, so a 100MB upload would be accepted
    // and stream straight into storage. 5MB matches the bucket's
    // fileSizeLimit set at creation time.
    const MAX_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Image too large — maximum size is 3MB. Please compress or crop it and try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (file.type && !file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Only image files are allowed." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fileName = `${userId}/profile-${Date.now()}.jpg`;

    // Upload to storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("profile-photos")
      .upload(fileName, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed: " + uploadError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("profile-photos")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update profile — different column per table
    const updatePayload =
      table === "brand_profiles"
        ? { logo_url: publicUrl, updated_at: new Date().toISOString() }
        : { custom_profile_photo_url: publicUrl, updated_at: new Date().toISOString() };
    const idCol = table === "brand_profiles" ? "brand_id" : "influencer_id";

    const { error: dbError } = await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq(idCol, userId);

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile: " + dbError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
