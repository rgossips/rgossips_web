// Structured logging for edge functions.
//
// One JSON line per event so Supabase's log drain / any downstream
// collector can filter by severity and pivot on request/user/campaign
// context. NEVER pass secrets, tokens, OTP codes, passwords, or full
// Authorization headers through here — the `redact` helper scrubs the
// common offenders defensively, but the caller is the real gate.
//
// Usage:
//   import { log } from "../_shared/log.ts";
//   const rid = crypto.randomUUID();
//   log.info("otp.verify.start", { rid, phoneHash });
//   log.warn("otp.verify.bad_code", { rid, phoneHash, attempts });
//   log.error("escrow.fund.order_failed", { rid, userId, applicationId }, err);

type Ctx = Record<string, unknown>;
type Severity = "debug" | "info" | "warn" | "error";

const SECRET_KEYS =
  /(token|secret|password|otp|authorization|apikey|api_key|access_token|refresh_token|signature|key_secret)/i;

function redact(ctx: Ctx): Ctx {
  const out: Ctx = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SECRET_KEYS.test(k)) {
      out[k] = "[redacted]";
    } else if (typeof v === "string" && v.length > 512) {
      out[k] = v.slice(0, 512) + "…";
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(severity: Severity, event: string, ctx: Ctx = {}, err?: unknown) {
  const line: Record<string, unknown> = {
    severity,
    event,
    ...redact(ctx),
  };
  if (err !== undefined) {
    // Never serialise a whole error object blindly — take the message and
    // a short stack head only.
    const e = err as { message?: string; stack?: string };
    line.error = e?.message || String(err);
    if (e?.stack) line.stack = e.stack.split("\n").slice(0, 4).join(" | ");
  }
  const out = JSON.stringify(line);
  if (severity === "error") console.error(out);
  else if (severity === "warn") console.warn(out);
  else console.log(out);
}

// ── Persistence ───────────────────────────────────────────────────────────
//
// Errors also land in public.error_logs so the admin console can answer
// "how often does Instagram connect fail?" without anyone tailing a log
// drain at the moment it happens. Console output stays exactly as it was;
// this is additive.
//
// Fire-and-forget by design: a logger that can throw, block, or fail a
// request is worse than no logger. Everything here is wrapped, the fetch is
// never awaited by the caller, and a failure to record is swallowed.

// event keys read "escrow.fund.order_failed" — the first segment says which
// part of the system spoke. Map it to the product surface an admin filters
// on; anything unrecognised keeps its own first segment rather than being
// lumped into "other", so a new subsystem shows up as itself.
const AREA_BY_PREFIX: Record<string, string> = {
  otp: "signin",
  signin: "signin",
  signup: "signup",
  profile: "signup",
  instagram: "instagram",
  insta: "instagram",
  apply: "campaign_application",
  campaign: "campaign_application",
  escrow: "payment",
  razorpay: "payment",
  stripe: "payment",
  payout: "payout",
  subscription: "payment",
  iap: "payment",
};

function inferArea(event: string): string {
  const head = String(event).split(".")[0]?.toLowerCase() || "other";
  return AREA_BY_PREFIX[head] || head || "other";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Keys lifted out of ctx into real columns. Whatever is left stays in the
// jsonb blob — filterable things get columns, the long tail does not.
const COLUMN_KEYS = [
  "area", "fn", "userId", "user_id", "userRole", "user_role",
  "requestId", "rid", "path", "statusCode", "status_code", "ipHash", "userAgent",
];

// The stored severities are not the console's: there is no point persisting
// debug/info, and `fatal` exists in the table to mark the errors worth waking
// someone for. Hence its own union rather than reusing Severity.
type StoredSeverity = "warn" | "error" | "fatal";

function persist(severity: StoredSeverity, event: string, ctx: Ctx, err?: unknown) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;

    const c = redact(ctx);
    const rest: Ctx = {};
    for (const [k, v] of Object.entries(c)) if (!COLUMN_KEYS.includes(k)) rest[k] = v;

    const e = err as { message?: string; stack?: string } | undefined;
    const rawUser = String(c.userId ?? c.user_id ?? "");

    const row = {
      source: "edge",
      area: String(c.area || inferArea(event)),
      event,
      severity,
      message: e?.message || (err !== undefined ? String(err) : null),
      // Sliced, not split into lines: the column is text and the whole point
      // is a readable head of the trace. Keeps this free of escape handling.
      stack: e?.stack ? String(e.stack).slice(0, 2000) : null,
      status_code: Number(c.statusCode ?? c.status_code) || null,
      // Only a real uuid goes in the column; anything else would abort the
      // insert and lose the error we were trying to record.
      user_id: UUID_RE.test(rawUser) ? rawUser : null,
      user_role: c.userRole ?? c.user_role ?? null,
      request_id: c.requestId ?? c.rid ?? null,
      fn: c.fn ?? null,
      path: c.path ?? null,
      ip_hash: c.ipHash ?? null,
      user_agent: c.userAgent ?? null,
      context: rest,
    };

    const p = fetch(`${url}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    }).catch(() => {});

    // Edge runtimes can kill work that outlives the response. waitUntil keeps
    // the insert alive where it exists, and its absence is not fatal.
    (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } })
      .EdgeRuntime?.waitUntil?.(p);
  } catch {
    /* logging must never break the caller */
  }
}

export const log = {
  debug: (event: string, ctx?: Ctx) => emit("debug", event, ctx),
  info: (event: string, ctx?: Ctx) => emit("info", event, ctx),
  warn: (event: string, ctx?: Ctx, err?: unknown) => emit("warn", event, ctx, err),
  error: (event: string, ctx?: Ctx, err?: unknown) => {
    emit("error", event, ctx, err);
    persist("error", event, ctx || {}, err);
  },
  fatal: (event: string, ctx?: Ctx, err?: unknown) => {
    emit("error", event, ctx, err);
    persist("fatal", event, ctx || {}, err);
  },
  // Persist a warning WITHOUT changing what log.warn means elsewhere.
  // Warnings are high-volume in normal operation, so log.warn stays
  // console-only and callers that genuinely want one recorded — the serve
  // wrapper's 4xx path — opt in explicitly.
  persistWarn: (event: string, ctx?: Ctx, err?: unknown) => persist("warn", event, ctx || {}, err),
};

// Hash a phone/email for correlation without logging the PII itself.
// Non-cryptographic; just enough to group events for one identity in a
// log search without storing the raw value.
export async function hashId(value: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .slice(0, 6)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "unknown";
  }
}
