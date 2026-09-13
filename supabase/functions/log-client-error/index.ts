// Client error sink. The browser and the mobile app post failures here so
// they land in public.error_logs alongside the edge-function errors.
//
// Public by necessity (verify_jwt = false): the errors most worth seeing are
// the ones on the way IN — a sign-up that fails, an Instagram connect that
// dies, a session that expired. None of those have a usable JWT.
//
// That makes it a write endpoint anyone can call, so:
//   * every field is clamped, and the row is assembled field by field — a
//     caller cannot set columns we did not ask for;
//   * a per-IP fixed window caps the volume, reusing the same RPC the landing
//     matcher uses rather than inventing a second limiter;
//   * it ALWAYS answers 200. A reporter that returns an error teaches the
//     client to retry, and a retry loop on the error path is how a logging
//     endpoint becomes the outage.
//
// It records only what the caller claims. Nothing here is trusted for
// anything but diagnostics — never for authorization or billing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serveWithLogging } from "../_shared/serve.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCES = new Set(["web", "mobile", "admin"]);
const SEVERITIES = new Set(["warn", "error", "fatal"]);

const clamp = (v: unknown, n: number): string | null => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  return s ? s.slice(0, n) : null;
};

// Non-cryptographic, first 12 hex — enough to rate-limit and to spot a single
// noisy client, without storing anyone's address.
async function hashIp(ip: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    return Array.from(new Uint8Array(digest))
      .slice(0, 6)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "unknown";
  }
}

serveWithLogging("log-client-error", async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const event = clamp(body.event, 120);
    const area = (clamp(body.area, 60) || "other").toLowerCase();
    if (!event) return ok({ skipped: "event required" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ipHash = await hashIp(ip);

    // 120 reports per IP per minute. Generous for a real user (a broken page
    // can fire a burst), miserly for anyone trying to fill the table.
    try {
      const { data: gate } = await supabase.rpc("bump_landing_match", {
        p_key: `errlog:${ipHash}`,
        p_max: 120,
        p_window_secs: 60,
      });
      const allowed = Array.isArray(gate) ? gate[0]?.allowed !== false : gate?.allowed !== false;
      if (!allowed) return ok({ skipped: "rate_limited" });
    } catch {
      // Limiter unavailable — record anyway. Losing errors is worse than
      // briefly losing the cap.
    }

    // Context is diagnostics only, and it comes from a public caller, so it
    // is size-capped rather than trusted.
    let context: Record<string, unknown> = {};
    if (body.context && typeof body.context === "object" && !Array.isArray(body.context)) {
      const encoded = JSON.stringify(body.context);
      context = encoded.length <= 4000 ? (body.context as Record<string, unknown>) : { truncated: true };
    }

    const rawUser = String(body.userId ?? body.user_id ?? "");
    const source = String(body.source || "web");
    const severity = String(body.severity || "error");

    const { error } = await supabase.from("error_logs").insert({
      source: SOURCES.has(source) ? source : "web",
      area,
      event,
      severity: SEVERITIES.has(severity) ? severity : "error",
      message: clamp(body.message, 2000),
      stack: clamp(body.stack, 4000),
      status_code: Number(body.statusCode) || null,
      user_id: UUID_RE.test(rawUser) ? rawUser : null,
      user_role: clamp(body.userRole, 40),
      request_id: clamp(body.requestId, 80),
      path: clamp(body.path, 500),
      user_agent: clamp(req.headers.get("user-agent"), 400),
      ip_hash: ipHash,
      context,
    });

    // Still 200 — see the header comment. The console line is for us.
    if (error) console.error("log-client-error insert failed:", error.message);
    return ok({ ok: !error });
  } catch (e) {
    console.error("log-client-error:", String((e as Error)?.message || e));
    return ok({ ok: false });
  }
});
