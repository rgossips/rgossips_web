// TR-01 — Mutation testing.
//
// The strategy's argument, which is the reason this exists: "A 90% coverage
// figure on code that computes escrow releases, reward-credit balances and trust
// scores is only meaningful if the assertions are strong. A suite can hold 90%
// coverage with a mutation score below 40%."
//
// SCOPE, and why it is narrower than the strategy asks for. TR-01 names escrow,
// reward credits, referral guards and the application state machine. None of
// those live in `src/` — they are Deno edge functions, which Stryker's jest
// runner cannot mutate. What IS reachable here is the other half of the list:
// Brand Trust Score pillar weighting and clamping, campaign match scoring and
// follower bands, and plan/entitlement resolution. The edge-function half is
// covered instead by offline unit tests in `__deno__/`; mutating those would
// need a Deno-native mutation runner, which does not currently exist.
//
// The mutate list is deliberately identical to `collectCoverageFrom` in
// jest.config.mjs — the modules the unit suite actually claims to cover. Adding
// untested modules here would produce a low score that says nothing about
// assertion strength.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  testRunner: "jest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.mjs",
    enableFindRelatedTests: true,
  },
  reporters: ["html", "clear-text", "progress"],
  htmlReporter: { fileName: "test-results/mutation/index.html" },
  coverageAnalysis: "perTest",
  mutate: [
    "src/utils/matchScore.js",
    "src/lib/brandProfile.js",
    "src/lib/plans.js",
    "src/utils/instagram-url.js",
    "src/lib/utils.js",
    "src/utils/device-session.js",
    "src/lib/services.js",
  ],
  // Thresholds start UNSET as a gate. The strategy's targets are >=70% overall
  // and >=85% on money/state modules; setting them before the real baseline is
  // measured would either pass trivially or fail meaninglessly. Record the
  // first score in qa/registers/disciplines.md, then raise `break` to it and
  // ratchet from there.
  thresholds: { high: 85, low: 70, break: null },
  timeoutMS: 60000,
  concurrency: 4,
};
