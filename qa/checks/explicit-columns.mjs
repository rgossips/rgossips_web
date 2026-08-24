#!/usr/bin/env node
/**
 * TR-36 / A-35 — explicit column lists must match the live schema.
 *
 * "Column lists match the live schema and fail loudly on drift rather than
 * being masked by select-star."
 *
 * This exists because of the tradeoff F-03's fix forces. `select("*")` is
 * resilient to schema drift but pulls secrets into function memory; an explicit
 * list keeps secrets out but breaks hard when a column is renamed or dropped —
 * PostgREST answers 42703 and the whole query fails. On this codebase that is
 * not hypothetical: CLAUDE.md records `languages` and `city` doing exactly that
 * on influencer_profiles.
 *
 * So: take the explicit lists, check every name against what PostgREST actually
 * exposes, and fail at check time instead of at runtime.
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY (schema introspection). Skips cleanly without
 * it so it never blocks a credential-free run.
 *
 * Run: node qa/checks/explicit-columns.mjs
 */
import { readFileSync } from "node:fs";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Explicit column lists to verify: where they live, the table they target, and
 * how to pull them out of the source. Add a row whenever a select("*") is
 * replaced with an enumerated list.
 */
const TRACKED = [
  {
    file: "supabase/functions/list-brands/index.ts",
    table: "brand_profiles",
    // .from("brand_profiles").select("a,b,c")
    //
    // The literal is matched in place rather than via a named const, because
    // supabase-js only types the select spec when it is one unbroken string
    // literal at the call site — so that is the shape this always takes.
    extract: (src) => {
      const m = src.match(
        /from\(\s*["']brand_profiles["']\s*\)\s*\.select\(\s*["']([a-z_,]+)["']/,
      );
      if (!m) return null;
      return m[1].split(",").filter(Boolean);
    },
  },
];

if (!URL_BASE || !SERVICE_KEY) {
  console.log(
    "explicit-columns: SUPABASE_SERVICE_ROLE_KEY not set — skipping schema verification.",
  );
  process.exit(0);
}

const res = await fetch(`${URL_BASE}/rest/v1/`, {
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
});
// Note: `process.exitCode`, never `process.exit()`, from here down. Calling
// exit() while undici still holds the fetch handle aborts the process with a
// libuv assertion on Windows (`!(handle->flags & UV_HANDLE_CLOSING)`), which
// surfaces as exit code 127 and reads like a check failure when the check
// actually passed.
if (!res.ok) {
  console.error(`explicit-columns: could not read the schema (HTTP ${res.status}).`);
  process.exitCode = 1;
}
const spec = await res.json();

let failed = false;

for (const { file, table, extract } of TRACKED) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    console.error(`explicit-columns: ${file} not found.`);
    failed = true;
    continue;
  }

  const declared = extract(src);
  if (!declared || !declared.length) {
    console.error(
      `explicit-columns: could not find the column list in ${file}. ` +
        `The extractor is out of step with the source — fix it, or this check ` +
        `silently verifies nothing.`,
    );
    failed = true;
    continue;
  }

  const live = new Set(Object.keys(spec?.definitions?.[table]?.properties || {}));
  if (!live.size) {
    console.error(`explicit-columns: table "${table}" is not exposed by PostgREST.`);
    failed = true;
    continue;
  }

  const missing = declared.filter((c) => !live.has(c));
  if (missing.length) {
    console.error(
      `\nexplicit-columns: ${file} selects columns that do not exist on ${table}:\n` +
        missing.map((c) => `  ${c}`).join("\n") +
        `\n\nPostgREST answers 42703 for these and the entire query fails.`,
    );
    failed = true;
  } else {
    console.log(
      `explicit-columns: ${file} → ${table} — all ${declared.length} columns exist.`,
    );
  }
}

process.exitCode = failed ? 1 : 0;
