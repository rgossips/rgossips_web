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

    if (!userId || !file) {
      return new Response(
        JSON.stringify({ error: "userId and file are required" }),
        { status: 400, headers: jsonHeaders }
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

    // Update profile
    const { error: dbError } = await supabaseAdmin
      .from("influencer_profiles")
      .update({
        custom_profile_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("influencer_id", userId);

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
