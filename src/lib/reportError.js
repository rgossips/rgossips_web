// Client-side error reporting into public.error_logs, via the
// log-client-error edge function.
//
// Two ways in:
//   * reportError(area, event, err, extra) from a catch block, where the call
//     site knows which product surface failed and can say so;
//   * the global window handlers installed by <ErrorReporter />, which catch
//     everything nobody thought to wrap.
//
// Rules this file lives by, because a reporter that misbehaves is worse than
// no reporter at all:
//   * it never throws — every path is wrapped;
//   * it never awaits anything the caller depends on;
//   * it never reports the reporter. A failure to send is swallowed, or a
//     broken endpoint would produce an error, which produces a report, which
//     fails…
//   * it de-duplicates. A render loop or a retry can fire the same failure
//     hundreds of times a second; the table should show that it happened, not
//     drown in it.

const ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/log-client-error`;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Set by <ErrorReporter /> once auth resolves. A module-level value rather
// than a parameter so ordinary catch blocks do not each have to thread the
// user through, and so this file stays free of React imports.
let currentUserId = null;
export function setErrorReporterUserId(id) {
  currentUserId = id || null;
}

// Signature -> timestamp of the last send. Same error within the window is
// counted locally and dropped rather than posted again.
const recent = new Map();
const DEDUPE_MS = 30_000;

function shouldSend(signature) {
  const now = Date.now();
  // Opportunistic sweep; the map only ever holds distinct recent failures.
  for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
  if (recent.has(signature)) return false;
  recent.set(signature, now);
  return true;
}

/**
 * Record a client-side failure.
 *
 * @param area  product surface — "instagram", "signin", "signup",
 *              "campaign_application", "payment", … the axis the admin
 *              console filters on
 * @param event precise machine key, e.g. "instagram.connect.failed"
 * @param err   the caught error (or anything throwable)
 * @param extra additional context; `statusCode` and `path` are lifted into
 *              their own columns, the rest is stored as jsonb
 */
export function reportError(area, event, err, extra = {}) {
  try {
    if (typeof window === "undefined" || !ENDPOINT || !KEY) return;

    const message = err?.message || (err == null ? "" : String(err));
    if (!shouldSend(`${area}|${event}|${message}`)) return;

    const body = JSON.stringify({
      source: "web",
      area,
      event,
      severity: extra.severity || "error",
      message,
      stack: err?.stack || null,
      path: window.location?.pathname || null,
      statusCode: extra.statusCode ?? null,
      userId: extra.userId || currentUserId,
      userRole: extra.userRole || null,
      context: extra.context || {},
    });

    // keepalive so a report survives the navigation that often follows a
    // failure. Errors are swallowed: see the header note on not reporting
    // the reporter.
    fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
      },
      body,
    }).catch(() => {});
  } catch {
    /* never let reporting break the caller */
  }
}
