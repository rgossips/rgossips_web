#!/usr/bin/env node
/**
 * TR-05 / A-31 — a migration must not add a table without row-level security.
 *
 * The strategy asks for this as a CI gate: "Make this an automated test that
 * fails CI when a migration adds a table without it."
 *
 * This is the static half — it reads the migration files, so it runs offline and
 * needs no credentials. The live half (does the deployed schema actually deny
 * anon?) is `__integration__/tr05-rls.test.js`, which enumerates the real schema
 * and fails on anything unclassified. Both are needed: this one catches the
 * mistake at review time, that one catches it in reality.
 *
 * Run: node qa/checks/rls-on-new-tables.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "supabase/migrations";

/**
 * Tables that are intentionally readable without RLS, with the reason. Keep in
 * step with ANON_READABLE in __integration__/tr05-rls.test.js.
 */
const PUBLIC_BY_DESIGN = new Set([
  "services",
  "homepage_settings",
  "creator_stories",
  "featured_brands",
  "featured_campaigns",
  "featured_creators",
  "platform_config",
  "categories",
  "cities",
  "countries",
  "states",
  "languages",
  "content_types",
]);

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const created = new Map(); // table -> migration file
const rlsEnabled = new Set();

for (const file of files) {
  const sql = readFileSync(join(DIR, file), "utf8");

  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(\w+)/gi)) {
    if (!created.has(m[1])) created.set(m[1], file);
  }
  for (const m of sql.matchAll(
    /alter\s+table\s+public\.(\w+)\s+enable\s+row\s+level\s+security/gi,
  )) {
    rlsEnabled.add(m[1]);
  }
}

const missing = [...created.entries()]
  .filter(([t]) => !rlsEnabled.has(t) && !PUBLIC_BY_DESIGN.has(t))
  .map(([t, f]) => `${t}  (created in ${f})`);

console.log(
  `rls-on-new-tables: ${created.size} tables created across ${files.length} migrations, ` +
    `${rlsEnabled.size} with RLS explicitly enabled.`,
);

if (missing.length) {
  console.error(`\nTables created without an explicit RLS enable, and not classified public:\n`);
  for (const m of missing) console.error(`  ${m}`);
  console.error(
    `\nEither add "alter table public.<t> enable row level security;" to its migration,\n` +
      `or add it to PUBLIC_BY_DESIGN here AND to ANON_READABLE in\n` +
      `__integration__/tr05-rls.test.js with a stated reason.`,
  );
  process.exit(1);
}

console.log("rls-on-new-tables: clean.");
