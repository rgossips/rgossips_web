// TR-02 — Static analysis, security ruleset.
//
// SEPARATE from eslint.config.mjs on purpose. The existing `npm run lint` is
// what gates day-to-day work; bolting security rules onto it would either flood
// that gate with pre-existing findings or force them to be silenced, and a
// silenced rule is worse than no rule. This config is its own reporting pass:
// `npm run lint:security`.
//
// Scope covers the browser/server code in src/ plus the Deno edge functions,
// which is where the injection-shaped risks actually are.
import { defineConfig, globalIgnores } from "eslint/config";
import security from "eslint-plugin-security";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "coverage/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  // JS only. The Deno edge functions are TypeScript and this config has no TS
  // parser, so including them produced 355 "Parsing error: Unexpected token"
  // results that looked like findings and were not. Linting them properly needs
  // typescript-eslint wired up with a Deno-aware parser config — recorded as
  // remaining work in qa/registers/disciplines.md rather than faked here.
  // `deno lint` is not a substitute: its default ruleset is style-oriented
  // (440 hits, almost all no-explicit-any) and carries no security rules.
  {
    files: ["src/**/*.{js,jsx,mjs}", "scripts/**/*.js"],
    // react-hooks and @next/next are registered but NOT enabled. Source files
    // carry inline `eslint-disable-next-line react-hooks/exhaustive-deps` and
    // `@next/next/no-img-element` comments; without the plugins present ESLint
    // reports "Definition for rule was not found" on each one, which reads as 47
    // findings and is really 47 unresolved rule names. Registering them makes
    // the comments resolve while leaving the rules off, so this pass reports
    // security results only.
    plugins: { security, "react-hooks": reactHooks, "@next/next": next },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // The disable comments target rules this config deliberately leaves off, so
    // every one of them reads as "unused". That is expected here and is not a
    // finding — reporting it would bury the security results under 35 warnings.
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      // The subset that earns its place on this codebase. Each maps to a real
      // risk class in the strategy rather than being enabled wholesale.
      "security/detect-object-injection": "off", // too noisy on plain lookups to be useful
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error", // ReDoS — user-supplied bios and briefs
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "warn", // webhook signature compares
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-new-buffer": "error",
    },
  },
  // scripts/ — developer-run maintenance tools, not request-handling code.
  //
  // Every one of these opens the repo's own .env.local to pick up service
  // credentials:
  //
  //   const envPath = path.join(__dirname, "..", ".env.local");
  //   fs.readFileSync(envPath, "utf8")
  //
  // detect-non-literal-fs-filename fires on all 13 purely because the argument
  // is a variable rather than a string literal. The path is assembled from
  // __dirname and literals, is fixed at author time, and no caller can steer
  // it — the process.argv these scripts do read supplies handles and --commit
  // flags, never a path. There is no untrusted input in the set, so the risk
  // class the rule exists for is absent.
  //
  // Scoped off here rather than 13 inline disables, which drift and get
  // copy-pasted into the next script without the reasoning. src/ and the rest
  // of the tree keep the rule at error, which is where request-handling code
  // lives and where a non-literal path would matter.
  //
  // The tidier long-term fix is to extract the .env.local parsing into one
  // shared helper: the duplication is the actual smell, and it would reduce
  // this to a single justified suppression. Not done here because it means
  // editing 13 working scripts for a lint result.
  {
    files: ["scripts/**/*.js"],
    plugins: { security },
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
]);
