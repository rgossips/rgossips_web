// Deno.serve with error logging attached.
//
// Wiring log.error() into 67 functions by hand would mean finding every catch
// block in each and hoping none were missed. This wraps the handler instead,
// so a function is covered by changing one line at the bottom of the file:
//
//   Deno.serve(async (req) => { … })
//   serveWithLogging("escrow-fund", async (req) => { … })
//
// It records two things the individual catch blocks cannot:
//
//   * THROWN errors that escaped the handler. Those previously produced an
//     opaque 500 from the runtime with nothing written down anywhere.
//   * Every non-2xx RESPONSE, including the deliberate ones. Most functions
//     answer `json({ error: … }, 409)` and return normally, so nothing was
//     ever thrown and no catch block ran — yet "creator must accept your
//     offer first" happening 200 times a day is exactly the kind of thing
//     worth seeing.
//
// 4xx is logged as `warn` and 5xx as `error`. A refused request is usually
// the system working; a 500 never is. Keeping them at different severities is
// what stops the useful signal drowning in routine validation failures.

import { log } from "./log.ts";

const FALLBACK_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Handler = (req: Request) => Response | Promise<Response>;

// How long a browser may reuse a CORS preflight. Without it every POST from
// the web app is preceded by its own OPTIONS round trip — 11% of all API
// traffic in a sampled 8 minutes, mostly ahead of the polled `notifications`
// and `chat` calls. Browsers clamp this (Chrome to 2h, Firefox to 24h), so
// asking for 24h simply gets each browser's maximum.
const PREFLIGHT_MAX_AGE = "86400";

// Adds Access-Control-Max-Age to a successful preflight response unless the
// function already set one. Built as a new Response because a handler's
// headers object may be immutable.
function withPreflightCache(req: Request, res: Response): Response {
  if (req.method !== "OPTIONS" || res.status >= 400 || res.headers.has("Access-Control-Max-Age")) return res;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Max-Age", PREFLIGHT_MAX_AGE);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function serveWithLogging(fn: string, handler: Handler) {
  Deno.serve(async (req: Request) => {
    // Correlates the log line with the response, and with anything the
    // handler logs itself if it passes the same rid through.
    const rid = crypto.randomUUID();
    let path = "";
    try {
      path = new URL(req.url).pathname;
    } catch {
      /* malformed URL is not worth failing over */
    }

    try {
      const res = withPreflightCache(req, await handler(req));

      if (res.status >= 400) {
        // Clone before reading: consuming the original body would send an
        // empty response to the caller.
        let body = "";
        try {
          body = (await res.clone().text()).slice(0, 1000);
        } catch {
          /* streamed or already-consumed body — the status is still useful */
        }
        const entry = {
          fn,
          rid,
          path,
          statusCode: res.status,
          method: req.method,
          responseBody: body,
        };
        if (res.status >= 500) log.error(`${fn}.http_${res.status}`, entry);
        else log.warn(`${fn}.http_${res.status}`, entry);
        // log.warn does not persist by design (see log.ts) — 4xx volume would
        // swamp the table. Persist it explicitly at warn severity so it is
        // there to filter on, without changing what log.warn means elsewhere.
        if (res.status < 500) log.persistWarn(`${fn}.http_${res.status}`, entry);
      }

      return res;
    } catch (err) {
      // Nothing else will record this: the runtime turns an uncaught throw
      // into a bare 500 and moves on.
      log.fatal(`${fn}.unhandled`, { fn, rid, path, method: req.method }, err);
      return new Response(
        JSON.stringify({ error: "Internal server error", requestId: rid }),
        { status: 500, headers: { ...FALLBACK_CORS, "Content-Type": "application/json" } },
      );
    }
  });
}
