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
    return new Response(JSON.stringify({ error: "Use POST" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { action, userId, type, title, body, notificationIds } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 200, headers: jsonHeaders });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // LIST notifications
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: jsonHeaders });

      const unreadCount = (data || []).filter((n: any) => !n.is_read).length;
      return new Response(JSON.stringify({ notifications: data || [], unreadCount }), { status: 200, headers: jsonHeaders });
    }

    // MARK READ
    if (action === "markRead") {
      if (notificationIds === "all") {
        await supabaseAdmin.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
      } else if (Array.isArray(notificationIds)) {
        await supabaseAdmin.from("notifications").update({ is_read: true }).in("user_id", [userId]).in("created_at", notificationIds);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    }

    // CREATE notification
    if (action === "create") {
      if (!type || !title) {
        return new Response(JSON.stringify({ error: "type and title are required" }), { status: 200, headers: jsonHeaders });
      }

      const { error } = await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: type,
        title: title,
        body: body || "",
        is_read: false,
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: jsonHeaders });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
    }

    // CHECK & CREATE profile completion notification
    if (action === "checkProfile") {
      const { data: profile } = await supabaseAdmin
        .from("influencer_profiles")
        .select("full_name, instagram_handle, media_kit_published, services, service_rates, categories")
        .eq("influencer_id", userId)
        .single();

      if (!profile) return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });

      // Calculate completion
      let score = 0;
      if (profile.full_name) score += 20;
      if (profile.instagram_handle) score += 20;
      if (profile.media_kit_published) score += 20;
      if (profile.services?.length > 0) score += 10;
      if (profile.service_rates && Object.values(profile.service_rates).some((v: any) => v && Number(v) > 0)) score += 10;
      if (profile.categories?.length > 0) score += 10;
      score += 10; // account created

      if (score < 90) {
        // Check if we already sent this today
        const today = new Date().toISOString().split("T")[0];
        const { data: existing } = await supabaseAdmin
          .from("notifications")
          .select("created_at")
          .eq("user_id", userId)
          .eq("type", "profile_incomplete")
          .gte("created_at", today + "T00:00:00")
          .limit(1);

        if (!existing?.length) {
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            type: "profile_incomplete",
            title: "Complete your profile",
            body: `Your profile is ${score}% complete. A complete profile gets 3x more brand deals.`,
            is_read: false,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, score }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: jsonHeaders });
  }
});
