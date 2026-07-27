// Fan a single notification out to all of a user's registered devices.
// Called by the notifications-table trigger (migration 056) on every insert,
// and safe to call directly for testing.
//
// Body: { userId, title, body, type }  (body is the notification's JSON string
// which carries { text, link }). Auth: an `x-push-secret` header that must match
// the PUSH_SECRET function secret when that secret is set (the trigger sends it).
//
// Deploy PUBLIC: npx supabase functions deploy send-push --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPush, sendFcm, PushPayload } from "../_shared/push.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Shared-secret gate (skipped if PUSH_SECRET isn't configured).
    const expected = Deno.env.get("PUSH_SECRET");
    if (expected && req.headers.get("x-push-secret") !== expected) {
      return json({ error: "unauthorized" }, 200);
    }

    const { userId, title, body, type } = (await req.json().catch(() => ({}))) as {
      userId?: string;
      title?: string;
      body?: string;
      type?: string;
    };
    if (!userId) return json({ error: "userId required" });

    // The notification `body` is a JSON string { text, link } (some legacy rows
    // are plain text). Show the title + text; deep-link on tap via link.
    let text = "";
    let link = "";
    try {
      const parsed = JSON.parse(body || "{}");
      text = parsed?.text || "";
      link = parsed?.link || "";
    } catch {
      text = body || "";
    }
    const payload: PushPayload = { title: title || "RGossips", body: text || title || "", link, type };

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, platform, endpoint, p256dh, auth, token")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) return json({ sent: 0, pruned: 0 });

    let sent = 0;
    const dead: string[] = [];
    await Promise.all(
      subs.map(async (s: any) => {
        const res =
          s.platform === "web"
            ? await sendWebPush({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload)
            : await sendFcm(s.token, payload);
        if (res.ok) sent++;
        else if (res.gone) dead.push(s.id);
      }),
    );

    // Prune dead devices so we don't keep retrying them.
    if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);

    return json({ sent, pruned: dead.length });
  } catch (e) {
    return json({ error: "send_failed", message: String((e as any)?.message || e) });
  }
});
