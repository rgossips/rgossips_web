#!/usr/bin/env node
/**
 * No UTF-16 truncation of text in edge functions.
 *
 * `s.slice(0, N)` counts UTF-16 code units. Most emoji are two, so the cut can
 * keep half of one — a lone surrogate that PostgREST rejects as
 * "Empty or invalid json", failing the entire write. That is how
 * refresh-instagram never saved analytics for a creator whose reel caption
 * had an emoji at character 100.
 *
 * Use truncateText(value, N) from supabase/functions/_shared/text.ts.
 *
 * Flags `.slice(0, <number>)`, `.substring(0, <number>)` and
 * `.substr(0, <number>)` when the receiver looks like text: a String(...) or
 * .trim() / .toString() call, or an identifier whose name says it holds text.
 * Array slices (`ids.slice(0, 2000)`) and separator cuts (`raw.slice(0, idx)`)
 * are not flagged.
 *
 * A genuine non-text slice the heuristic catches can be exempted with a
 * trailing `// text-truncation-ok: <reason>` comment.
 *
 * Run: node qa/checks/text-truncation.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const DIRS = ["supabase/functions"];
const SKIP_FILES = new Set(["supabase/functions/_shared/text.ts"]);

const TEXTY_NAME =
  /(caption|text|reason|note|bio|label|prompt|query|summary|message|details|title|name|description|pitch|agent|body|stack|comment|content|about|address|email|handle|username)/i;

// receiver + .slice(0, 123)
const CUT = /([\w$.?\]\)"'`]+)\s*\.\s*(slice|substring|substr)\(\s*0\s*,\s*\d+\s*\)/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|js|mjs)$/.test(entry)) out.push(p);
  }
  return out;
}

const problems = [];
for (const d of DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (SKIP_FILES.has(rel)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/text-truncation-ok/.test(line)) return;
      const code = line.replace(/\/\/.*$/, "");
      for (const m of code.matchAll(CUT)) {
        const receiver = m[1];
        const texty =
          /\bString\(|\.trim\(\)|\.toString\(\)/.test(code.slice(0, m.index + receiver.length)) ||
          TEXTY_NAME.test(receiver);
        if (texty) problems.push(`${rel}:${i + 1}  ${line.trim()}`);
      }
    });
  }
}

if (problems.length) {
  console.error(
    `✖ text-truncation: ${problems.length} UTF-16 cut(s) on text — use truncateText() from _shared/text.ts\n` +
      problems.map((p) => "  " + p).join("\n"),
  );
  process.exit(1);
}
console.log("✔ text-truncation: no UTF-16 truncation of text in edge functions");
