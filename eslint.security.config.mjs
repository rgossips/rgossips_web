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
]);
