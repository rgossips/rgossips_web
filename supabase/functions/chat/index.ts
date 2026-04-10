import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") return new Response(JSON.stringify({ error: "Use POST" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { action, userId, conversationId, recipientId, recipientType, content } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: "userId required" }), { status: 200, headers: jsonHeaders });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // LIST conversations for user
    if (action === "listConversations") {
      // Get conversations where user is brand or influencer
      const { data: convs } = await sb
        .from("conversations")
        .select("*")
        .or(`brand_id.eq.${userId},influencer_id.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      const conversations = [];
      for (const c of convs || []) {
        const otherId = c.brand_id === userId ? c.influencer_id : c.brand_id;
        const otherIsBrand = c.brand_id !== userId;

        // Get other user's info
        let otherName = "Unknown";
        let otherAvatar = "";
        if (otherIsBrand) {
          const { data: brand } = await sb.from("brand_profiles").select("brand_name, gstin_trade_name, logo_url").eq("brand_id", otherId).maybeSingle();
          if (brand) {
            otherName = brand.gstin_trade_name || brand.brand_name || "Brand";
            otherAvatar = brand.logo_url || "";
          } else {
            const { data: inv } = await sb.from("brand_invitations").select("brand_name, logo_url").eq("id", otherId).maybeSingle();
            if (inv) { otherName = inv.brand_name || "Brand"; otherAvatar = inv.logo_url || ""; }
          }
        } else {
          const { data: inf } = await sb.from("influencer_profiles").select("full_name, profile_photo_url, custom_profile_photo_url").eq("influencer_id", otherId).maybeSingle();
          if (inf) {
            otherName = inf.full_name || "Influencer";
            otherAvatar = inf.custom_profile_photo_url || inf.profile_photo_url || "";
          }
        }

        // Get last message
        const { data: lastMsgs } = await sb.from("messages").select("content, sender_id, sent_at").eq("conversation_id", c.conversation_id).order("sent_at", { ascending: false }).limit(1);
        const lastMsg = lastMsgs?.[0];

        // Unread count
        const { count } = await sb.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.conversation_id).neq("sender_id", userId).eq("is_read", false);

        conversations.push({
          id: c.conversation_id,
          otherUserId: otherId,
          name: otherName,
          avatar: otherAvatar,
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg?.sent_at || c.last_message_at || c.created_at,
          isLastMessageMine: lastMsg?.sender_id === userId,
          unread: count || 0,
        });
      }

      return new Response(JSON.stringify({ conversations }), { status: 200, headers: jsonHeaders });
    }

    // GET messages for a conversation
    if (action === "getMessages") {
      if (!conversationId) return new Response(JSON.stringify({ error: "conversationId required" }), { status: 200, headers: jsonHeaders });

      const { data: msgs } = await sb
        .from("messages")
        .select("message_id, sender_id, content, sent_at, is_read")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true });

      // Mark unread messages as read
      await sb.from("messages").update({ is_read: true }).eq("conversation_id", conversationId).neq("sender_id", userId).eq("is_read", false);

      return new Response(JSON.stringify({ messages: msgs || [] }), { status: 200, headers: jsonHeaders });
    }

    // SEND a message
    if (action === "sendMessage") {
      if (!conversationId || !content?.trim()) return new Response(JSON.stringify({ error: "conversationId and content required" }), { status: 200, headers: jsonHeaders });

      const { data: msg, error: msgErr } = await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        is_read: false,
      }).select().single();

      if (msgErr) return new Response(JSON.stringify({ error: msgErr.message }), { status: 200, headers: jsonHeaders });

      // Update conversation last_message_at
      await sb.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("conversation_id", conversationId);

      return new Response(JSON.stringify({ success: true, message: msg }), { status: 200, headers: jsonHeaders });
    }

    // START or GET a conversation with a specific user
    if (action === "getOrCreateConversation") {
      if (!recipientId) return new Response(JSON.stringify({ error: "recipientId required" }), { status: 200, headers: jsonHeaders });

      const isBrandRecipient = recipientType === "brand";
      const brandId = isBrandRecipient ? recipientId : userId;
      const influencerId = isBrandRecipient ? userId : recipientId;

      // Check existing
      const { data: existing } = await sb.from("conversations").select("conversation_id").eq("brand_id", brandId).eq("influencer_id", influencerId).maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ conversationId: existing.conversation_id, isNew: false }), { status: 200, headers: jsonHeaders });
      }

      // Create new
      const { data: newConv, error: convErr } = await sb.from("conversations").insert({
        brand_id: brandId,
        influencer_id: influencerId,
        last_message_at: new Date().toISOString(),
      }).select().single();

      if (convErr) return new Response(JSON.stringify({ error: convErr.message }), { status: 200, headers: jsonHeaders });

      return new Response(JSON.stringify({ conversationId: newConv.conversation_id, isNew: true }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: jsonHeaders });
  }
});
