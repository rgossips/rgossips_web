// Cancel every live Razorpay subscription a creator has. Service role only.
//
// Setting a creator's plan to `free` in the database does not stop Razorpay:
// the subscription keeps charging, and the next `subscription.charged` webhook
// calls setUserPlan and quietly hands the paid plan back. When an admin moves
// someone to free, the gateway side has to be ended too — this is that.
//
// Credentials come from razorpayCreds(userId), the same resolver the webhook
// and checkout use, so a creator enrolled as a test user is cancelled on the
// test account and everyone else on the primary one. Choosing keys any other
// way would look for the subscription on the wrong account and report it gone.
//
// Cancels immediately (cancel_at_cycle_end: 0). The caller has already taken
// the paid access away, so there is no period left to honour.
//
// Body: { userId: string }
// Returns: { cancelled: string[], alreadyEnded: string[], failed: {id, error}[] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { razorpayCreds } from "../_shared/razorpay.ts";
import { serveWithLogging } from "../_shared/serve.ts";
import { log } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Compare-then-probe. Do not decode the bearer as a JWT — the service key is
// not always one (see the service-role section in CLAUDE.md).
async function isServiceRoleCaller(bearer: string): Promise<boolean> {
  if (!bearer) return false;
  if (bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  try {
    const probe = createClient(Deno.env.get("SUPABASE_URL")!, bearer, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  } catch {
    return false;
  }
}

// Razorpay states that can still charge. Anything else is already over.
const CAN_CHARGE = new Set(["created", "authenticated", "active", "pending", "halted", "paused"]);

serveWithLogging("admin-cancel-subscription", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const bearer = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!(await isServiceRoleCaller(bearer))) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || "").trim();
  if (!userId) return json({ error: "userId is required" }, 400);

  const creds = razorpayCreds(userId);
  if (!creds?.keyId || !creds?.keySecret) {
    return json({ error: "razorpay credentials not configured" }, 500);
  }
  const auth = `Basic ${btoa(`${creds.keyId}:${creds.keySecret}`)}`;

  // Razorpay cannot filter subscriptions by notes, so page through and match
  // notes.user_id — the same approach subscription-history uses.
  const mine: any[] = [];
  for (let skip = 0; skip < 1000; skip += 100) {
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions?count=100&skip=${skip}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      log.error("admin_cancel.list_failed", { userId, status: res.status });
      return json({ error: `razorpay list failed (${res.status})` }, 502);
    }
    const page = await res.json().catch(() => ({}));
    const items: any[] = Array.isArray(page?.items) ? page.items : [];
    for (const s of items) {
      if (String(s?.notes?.user_id || "") === userId) mine.push(s);
    }
    if (items.length < 100) break;
  }

  const cancelled: string[] = [];
  const alreadyEnded: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const s of mine) {
    const id = String(s.id);
    if (!CAN_CHARGE.has(String(s.status))) {
      alreadyEnded.push(id);
      continue;
    }
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ cancel_at_cycle_end: 0 }),
    });
    const out = await res.json().catch(() => ({}));
    if (out?.status === "cancelled") {
      cancelled.push(id);
    } else {
      failed.push({ id, error: out?.error?.description || `status ${res.status}` });
    }
  }

  log.persistWarn("admin_cancel.done", {
    fn: "admin-cancel-subscription",
    userId,
    mode: creds.mode,
    cancelled: cancelled.length,
    alreadyEnded: alreadyEnded.length,
    failed: failed.length,
  });
  return json({ mode: creds.mode, cancelled, alreadyEnded, failed });
});
