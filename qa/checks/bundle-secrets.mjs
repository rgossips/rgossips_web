#!/usr/bin/env node
/**
 * TR-34 / A-51 / F-02 — no secret in any client bundle.
 *
 * Next inlines every NEXT_PUBLIC_* value into the browser bundle. The strategy's
 * standing rule, learned the hard way on this codebase (see CLAUDE.md, the
 * Instagram token incident): "never reference a NEXT_PUBLIC_* secret from client
 * code."
 *
 * This scans the built output for the shapes that must never appear there:
 * service-role keys, gateway secrets, Meta app secrets, LLM keys. The
 * publishable/anon key is expected and is NOT a finding.
 *
 * Run after `next build`:  node qa/checks/bundle-secrets.mjs
 * Exits non-zero on a hit.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = ".next";

/** Patterns that must never reach a browser bundle. */
const FORBIDDEN = [
  { name: "Supabase service-role key (sb_secret_)", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  {
    name: "Supabase service_role JWT",
    re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*\./,
  },
  { name: "Stripe secret key", re: /sk_(live|test)_[A-Za-z0-9]{16,}/ },
  { name: "Razorpay secret", re: /rzp_(live|test)_[A-Za-z0-9]{10,}:[A-Za-z0-9]{10,}/ },
  { name: "Anthropic key", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  // Quote-delimited, because a bare `sk-[A-Za-z0-9]{40,}` also matches the
  // middle of base64 blobs.
  { name: "OpenAI key", re: /sk-proj-[A-Za-z0-9_-]{20,}|["'`]sk-[A-Za-z0-9]{40,}["'`]/ },
  // MUST be quote-delimited and long. The first version of this rule was
  // /IGQ[A-Za-z0-9_-]{40,}/ and it fired twice on a clean bundle: base64-inlined
  // SVG decodes to ` d="M123.` -> "IGQ9Ik0xMjMu", and an embedded binary asset
  // gave "IGQwAAAABgIA". Both start with IGQ purely by coincidence of the
  // base64 alphabet. A real long-lived token is ~150-200 chars and appears as a
  // bare quoted string, never mid-blob. A secrets check that cries wolf gets
  // muted, and a muted check is worse than none.
  { name: "Instagram long-lived token", re: /["'`]IGQ[A-Za-z0-9_-]{100,}["'`]/ },
  { name: "Google/Firebase private key", re: /-----BEGIN PRIVATE KEY-----/ },
  { name: "Generic service-account JSON", re: /"type":\s*"service_account"/ },
];

/** Explicitly allowed — these are public by design. */
const ALLOWED = [/sb_publishable_[A-Za-z0-9_-]+/];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|css|json|map)$/.test(entry)) out.push(p);
  }
  return out;
}

const files = walk(BUILD_DIR);
if (!files.length) {
  console.log(
    "bundle-secrets: no build output found in .next/ — run `npm run build` first. Skipping.",
  );
  process.exit(0);
}

const hits = [];
for (const file of files) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const { name, re } of FORBIDDEN) {
    const m = src.match(re);
    if (!m) continue;
    if (ALLOWED.some((a) => a.test(m[0]))) continue;
    hits.push({ file, name, sample: `${m[0].slice(0, 12)}…` });
  }
}

if (hits.length) {
  console.error(`bundle-secrets: ${hits.length} secret-shaped value(s) in the client bundle:\n`);
  for (const h of hits) console.error(`  ${h.name}\n    ${h.file}\n    ${h.sample}`);
  console.error("\nRotate the key, drop the NEXT_PUBLIC_ prefix, and proxy through a route.");
  process.exit(1);
}

console.log(`bundle-secrets: clean — scanned ${files.length} built files, 0 secrets found.`);
