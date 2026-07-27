// Register / unregister a push device for the calling user.
// Auth = caller JWT (the device belongs to whoever is signed in).
//
// Body:
//   { action:"subscribe", platform:"web", subscription:{endpoint, keys:{p256dh,auth}}, userAgent? }
//   { action:"subscribe", platform:"fcm", token:"<fcm-token>", userAgent? }
//   { action:"unsubscribe", platform:"web", endpoint }   | { platform:"fcm", token }
//
// Deploy PUBLIC (does its own JWT check): npx supabase functions deploy register-push --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { data: userRes } = await admin.auth.getUser(token);
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "unauthorized" }, 200);

    const payload = (await req.json().catch(() => ({}))) as any;
    const action = payload?.action;
    const platform = payload?.platform;
    if (platform !== "web" && platform !== "fcm") return json({ error: "bad_platform" });

    if (action === "unsubscribe") {
      const q = admin.from("push_subscriptions").delete().eq("user_id", userId).eq("platform", platform);
      if (platform === "web") {
        if (!payload?.endpoint) return json({ error: "endpoint required" });
        await q.eq("endpoint", payload.endpoint);
      } else {
        if (!payload?.token) return json({ error: "token required" });
        await q.eq("token", payload.token);
      }
      return json({ success: true });
    }

    if (action === "subscribe") {
      const userAgent = String(payload?.userAgent || "").slice(0, 300);
      if (platform === "web") {
        const sub = payload?.subscription;
        const endpoint = sub?.endpoint;
        const p256dh = sub?.keys?.p256dh;
        const auth = sub?.keys?.auth;
        if (!endpoint || !p256dh || !auth) return json({ error: "bad_subscription" });
        const { error } = await admin
          .from("push_subscriptions")
          .upsert(
            { user_id: userId, platform: "web", endpoint, p256dh, auth, token: null, user_agent: userAgent, updated_at: new Date().toISOString() },
            { onConflict: "endpoint" },
          );
        if (error) return json({ error: error.message });
        return json({ success: true });
      }
      // fcm
      const fcmToken = payload?.token;
      if (!fcmToken) return json({ error: "token required" });
      const { error } = await admin
        .from("push_subscriptions")
        .upsert(
          { user_id: userId, platform: "fcm", token: fcmToken, endpoint: null, p256dh: null, auth: null, user_agent: userAgent, updated_at: new Date().toISOString() },
          { onConflict: "token" },
        );
      if (error) return json({ error: error.message });
      return json({ success: true });
    }

    return json({ error: "unknown_action" });
  } catch (e) {
    return json({ error: "register_failed", message: String((e as any)?.message || e) });
  }
});
