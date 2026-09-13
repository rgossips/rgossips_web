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
      const res = await handler(req);

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
