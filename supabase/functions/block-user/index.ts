// Block / unblock another user, and list who you've blocked.
//
// Required by Play's UGC policy and Apple Guideline 1.2. A block hides content
// in BOTH directions (see blocked_user_ids() in migration 059) — hiding only
// one way would blind the person who pressed Block while leaving them fully
// visible to the person they blocked, which is the opposite of the intent.
//
// action: "block" | "unblock" | "list"
//
// The blocker is always taken from the JWT. Accepting it from the body would
// let anyone sever other people's visibility.

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
    const { action, targetUserId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    const blockerId = userRes?.user?.id;
    if (userErr || !blockerId) {
      return new Response(JSON.stringify({ error: "Not signed in." }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // ── list ────────────────────────────────────────────────────────────
    // Returns only people THIS user blocked, not people who blocked them —
    // the unblock screen is the only consumer, and exposing the latter would
    // tell someone they'd been blocked.
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("user_blocks")
        .select("blocked_id, created_at")
        .eq("blocker_id", blockerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("user_blocks select failed:", error.message);
        return new Response(
          JSON.stringify({ error: "Could not load your blocked list." }),
          { status: 200, headers: jsonHeaders }
        );
      }

      // Resolve display names here rather than in the client. The raw table
      // holds only ids, and an unblock screen listing UUIDs is unusable — but
      // the client cannot look them up itself either, because RLS rightly
      // stops one user reading another's profile. This function holds service
      // role and returns only the name, handle and photo of people the caller
      // has already blocked, which they demonstrably know about.
      const ids = (data || []).map((r: { blocked_id: string }) => r.blocked_id);
      const names = new Map<string, { name: string; handle: string | null; photo: string | null }>();

      if (ids.length) {
        const [inf, brand] = await Promise.all([
          supabaseAdmin
            .from("influencer_profiles")
            .select("influencer_id, full_name, username, instagram_handle, profile_photo_url")
            .in("influencer_id", ids),
          supabaseAdmin
            .from("brand_profiles")
            .select("brand_id, brand_name, contact_name")
            .in("brand_id", ids),
        ]);

        for (const r of inf.data || []) {
          names.set(r.influencer_id, {
            name: r.full_name || r.username || r.instagram_handle || "Creator",
            handle: r.instagram_handle || r.username || null,
            photo: r.profile_photo_url || null,
          });
        }
        for (const r of brand.data || []) {
          names.set(r.brand_id, {
            name: r.brand_name || r.contact_name || "Brand",
            handle: null,
            photo: null,
          });
        }
      }

      const blocks = (data || []).map((r: { blocked_id: string; created_at: string }) => ({
        userId: r.blocked_id,
        blockedAt: r.created_at,
        // A deleted account leaves the block row behind with nothing to
        // resolve. Still list it so the user can clear it.
        ...(names.get(r.blocked_id) || { name: "Removed account", handle: null, photo: null }),
      }));

      return new Response(JSON.stringify({ success: true, blocks }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "targetUserId is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (targetUserId === blockerId) {
      return new Response(
        JSON.stringify({ error: "You can't block yourself." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // ── block ───────────────────────────────────────────────────────────
    if (action === "block") {
      const { error } = await supabaseAdmin
        .from("user_blocks")
        .upsert(
          { blocker_id: blockerId, blocked_id: targetUserId },
          { onConflict: "blocker_id,blocked_id" }
        );
      if (error) {
        console.error("user_blocks upsert failed:", error.message);
        return new Response(
          JSON.stringify({ error: "Could not block this user. Please try again." }),
          { status: 200, headers: jsonHeaders }
        );
      }
      return new Response(
        JSON.stringify({ success: true, blocked: true }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // ── unblock ─────────────────────────────────────────────────────────
    if (action === "unblock") {
      const { error } = await supabaseAdmin
        .from("user_blocks")
        .delete()
        .eq("blocker_id", blockerId)
        .eq("blocked_id", targetUserId);
      if (error) {
        console.error("user_blocks delete failed:", error.message);
        return new Response(
          JSON.stringify({ error: "Could not unblock this user. Please try again." }),
          { status: 200, headers: jsonHeaders }
        );
      }
      return new Response(
        JSON.stringify({ success: true, blocked: false }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "action must be 'block', 'unblock' or 'list'" }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (e) {
    console.error("block-user failed:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
