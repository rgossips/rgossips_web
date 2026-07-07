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

export const log = {
  debug: (event: string, ctx?: Ctx) => emit("debug", event, ctx),
  info: (event: string, ctx?: Ctx) => emit("info", event, ctx),
  warn: (event: string, ctx?: Ctx) => emit("warn", event, ctx),
  error: (event: string, ctx?: Ctx, err?: unknown) => emit("error", event, ctx, err),
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
