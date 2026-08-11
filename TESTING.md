# RGossips unit-test report

## Verified result

Run on 4 August 2026 with:

```bash
npm.cmd run test:cov -- --runInBand
```

**Result: 8 suites passed, 118 tests passed, 0 failed.**

| Coverage metric | Result | Enforced minimum |
| --- | ---: | ---: |
| Statements | **96.46%** | 90% |
| Branches | **94.41%** | 85% |
| Functions | **98.79%** | 95% |
| Lines | **99.79%** | 90% |

These are coverage figures for the unit-test scope configured in
`jest.config.mjs`: deterministic business logic and isolated browser/API
helpers. They are deliberately **not** represented as whole-application
coverage: pages, React components, Supabase edge functions, external payment
providers, and live database access need integration or end-to-end testing.

## Run locally

```bash
npm.cmd test
npm.cmd run test:cov -- --runInBand
```

Use `npm.cmd` in this Windows environment because its PowerShell execution
policy blocks `npm.ps1`. The normal `npm` command works where that policy is
not restrictive.

Results:

| File | Purpose |
| --- | --- |
| `coverage/lcov-report/index.html` | Openable per-file coverage report (after `test:cov`). |
| `coverage/lcov.info` | Coverage data for CI/quality tools. |
| `test-results/junit.xml` | JUnit test result for CI. |

`coverage/` and `test-results/` are generated output and are ignored by Git.

## Test scope and scenarios

| Area | Happy paths | Negative, boundary, and resilience paths |
| --- | --- | --- |
| Campaign and brand matching | Exact/related category matches, strong platform and reach fit, budget/rate scoring, campaign-match explanations | Null profiles, absent tags/services/platforms, no category fit, all reach and engagement thresholds, malformed/missing budgets, open/missing/mismatched locations, score clamps |
| Brand trust profile | Valid PAN/GSTIN, completed profiles, fresh reviews, delivery, verification, communication, engagement, trust bands | Invalid identifiers, empty profiles, zero/old ratings, future/no login, SLA and revision boundaries, cold-start cap, penalty and 300–900 score clamps |
| Plans and media-kit access | Trial resolution, plan feature access, templates and quota calculations | Invalid dates, expired/future trials, unknown plans/templates, zero and unlimited limits, exhausted quotas |
| Instagram and location utilities | Link detection/normalisation, known Indian-city matching | Empty/non-Instagram input, invalid URLs, query/trailing-slash variants, empty filters, no match, duplicate city data |
| Device sessions | Stable device IDs, session upsert, active-device status, OS/browser labels | Server-side rendering, missing user, empty device ID, revoked/missing rows, database errors, long user-agent truncation |
| Service helpers | Currency/icon presentation, service-list and slug lookup requests | Invalid response shapes, missing service, failed fetch, rejected JSON/transport errors; failures return safe empty/null values |
| Shared utilities/data | Tailwind class merge, router navigation/refresh, UTC parsing, category/language constants | Invalid dates, router absence/alternate routes, data uniqueness checks |

The tests use fixture builders, frozen clocks for time-based business rules,
mocked browser storage, mocked Supabase query chains, and mocked `fetch`.
They never call a live service and do not require credentials.

## Coverage configuration

Coverage is limited to these tested modules:

- `src/utils/matchScore.js`
- `src/lib/brandProfile.js`
- `src/lib/plans.js`
- `src/utils/instagram-url.js`
- `src/lib/utils.js`
- `src/utils/indianCities.js`
- `src/utils/device-session.js`
- `src/lib/services.js`

The configured guard fails the test run if global coverage falls below 90%
statements/lines, 85% branches, or 95% functions. This prevents the suite from
quietly regressing while avoiding artificial tests of network-only or UI-only
code in a Node unit-test environment.

## Production-code safety

No file under `src/app`, `src/components`, `src/context`, production hooks, or
Supabase functions was changed. This work adds/extends only test files, the
Jest test configuration, test dependencies already declared in the project,
and this document.
