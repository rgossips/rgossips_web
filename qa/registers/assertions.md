# Assertion register — Appendix B, A-01 to A-68

Where each code-anchored assertion landed. **32 of 68 are runnable today.**

| State | Count | Meaning |
|---|---|---|
| **PASS** | 24 | Implemented and green — a regression guard |
| **RED** | 8 | Implemented and failing — an open finding |
| **BLOCKED** | 36 | Needs staging, a device, billable sends, or a human |

## B.1 Escrow & application state machine

| # | Assertion | State | Where |
|---|---|---|---|
| A-01 | Escrow funding refuses a request with no auth header | PASS | `f01-f03-money-and-token-exposure.test.js` |
| A-02 | Refuses a publishable-key bearer and an expired token | PASS | same — the publishable-key half |
| A-03 | Refuses a token belonging to a different brand / the creator party | BLOCKED | needs two real brand sessions |
| A-04 | Amount tamper guard — one-paise, zero, negative | BLOCKED | needs an application in `offer_accepted` |
| A-05 | Status guard refuses every non-accepted-offer status | BLOCKED | needs applications in each status. **Reconcile the count first** — the code has twelve statuses, A-05 says eleven |
| A-06 | Funding idempotency — two concurrent calls, one order | BLOCKED | creates gateway orders |
| A-07 | Payment signature verification rejects forged/replayed | PASS | `critical-flows.test.js` (pre-existing) + `tr12-dormant-paths.test.js` |
| A-08 | Transition map rejects every illegal source status | BLOCKED | needs mutable applications |
| A-09 | Release verifies ownership, cannot release twice | PARTIAL/PASS | refusal half in `f01-f03`; double-release needs staging |

## B.2 Ledger & reward-credit integrity

| # | Assertion | State | Where |
|---|---|---|---|
| A-10 | Welcome grant amount, lock and expiry offsets | BLOCKED | grant happens in `create-profile`; needs a real signup |
| A-11 | Locked rows excluded from spendable balance | BLOCKED | needs ledger rows |
| A-12 | Redemption ceiling at the exact boundary | BLOCKED | needs a real invoice |
| A-13 | Clawback is a no-op beyond its window | BLOCKED | `clawBackReferral` needs a qualified referral |
| A-14 | Expiry never drives a wallet negative / no duplicate row | BLOCKED | nightly cron |
| A-15 | Ledger is append-only, no update/delete grant | BLOCKED | needs `information_schema` access |
| A-16 | Outstanding identity balances for every user | BLOCKED | needs full ledger read |
| A-17 | Qualifying event uniqueness — 10 concurrent, 1 reward | **PASS** | `__deno__/referrals_test.ts` — the single-call idempotency short-circuit. The *concurrent* half is blocked. |
| A-18 | Rolling daily cap routes to manual review | **PASS** | `__deno__/referrals_test.ts` — at the cap and above it |
| A-19 | Referral attribution guards | **PASS** | `__deno__/referrals_test.ts` — self/re-attribution, inactive referrer → REVERSED |
| A-20 | Fraud flags — duplicate device/IP → manual review | BLOCKED | needs `attribute-referral` invocation |
| A-21 | Administrative adjustment ceiling and audit stamp | BLOCKED | admin console |

## B.3 Authentication, OTP & session

| # | Assertion | State | Where |
|---|---|---|---|
| A-22 | Per-phone cooldown, hourly phone + address caps | BLOCKED | **billable sends** |
| A-23 | Rate-limit refusals surfaced verbatim on every surface | BLOCKED | same |
| A-24 | Forwarding-header spoofing cannot bypass the IP cap | BLOCKED | same |
| A-25 | OTP hygiene — single-use, expiry, identical timing | BLOCKED | same. Note **F-19**: `check_phone_exists` already breaks the "identical response for registered and unregistered" property at the RPC layer |
| A-26 | Global daily send ceiling trips | BLOCKED | same |
| A-27 | OAuth state, redirect allow-list, no token to client | BLOCKED | browser flow |
| A-28 | Token refresh, revocation, account-type change | BLOCKED | needs a connected creator |
| A-29 | Admin sign-in does not invalidate a user session | BLOCKED | two browser sessions |

## B.4 Row-level security & data exposure

| # | Assertion | State | Where |
|---|---|---|---|
| A-30 | RLS enabled on every public-schema relation | **PASS** | `tr05-rls.test.js` — all 68 exposed relations, self-maintaining from the live schema |
| A-31 | CI fails when a migration adds a table without RLS | **PASS** | `qa/checks/rls-on-new-tables.mjs` (static) + the unclassified check in `tr05-rls.test.js` (live) |
| A-32 | SECURITY DEFINER — EXECUTE revoked as intended | **PASS (6) / RED (8)** | `tr05-security-definer.test.js` proves 6 revoked; `f18-anon-executable-rpcs.test.js` is red on 8. `search_path` pinning not yet audited. |
| A-33 | No select-star against the profile table | **PASS (with 1 exemption)** | `f01-f03` — `list-brands` fixed; `check-profile` exempted with reason + a stale-exemption guard |
| A-34 | No response contains the access token | **PASS** | `tr05-rls.test.js` + `f01-f03` |
| A-35 | Explicit column lists match the live schema | **PASS** | `qa/checks/explicit-columns.mjs` — verifies every enumerated list against the deployed schema |
| A-36 | Storage buckets not publicly listable | **PASS** | `tr05-rls.test.js` — 3 buckets |
| A-37 | Public media kit returns only published, public fields | **PASS (shape)** | `tr04-authorisation-matrix.test.js` — enumeration indistinguishability. Published-only needs a real kit. |
| A-38 | Shortlink cannot redirect to an arbitrary host | **PASS** | `tr04-authorisation-matrix.test.js` |

## B.5 Mobile & cross-surface

| # | Assertion | State | Where |
|---|---|---|---|
| A-39 | Tokens not in plain local storage | **RED** | mobile `__findings__/f09-token-storage.test.ts` |
| A-40 | Crafted deep link cannot mark a payment successful | BLOCKED | needs a device |
| A-41 | No token enters the WebView JS context | BLOCKED | needs a device |
| A-42 | Native payment path does identical server-side checks | BLOCKED | needs a device |
| A-43 | Explicit auth header; no publishable-key fallback for privileged calls | **RED (1) / PASS (2)** | mobile `__findings__/f10-auth-fallback.test.ts` — the fallback and its 401-retry are confirmed present; the missing privileged-function list is the open half |
| A-44 | Lifecycle interruption leaves no orphaned state | BLOCKED | needs a device |
| A-45 | Rule parity across three surfaces | BLOCKED | needs authenticated sessions |
| A-46 | Server authority — direct call refuses like the UI | **PASS** | `tr04-authorisation-matrix.test.js` |

## B.6 AI, secondary datastore & third parties

| # | Assertion | State | Where |
|---|---|---|---|
| A-47 | Provider config row writable by super-admin only | **PASS** | `tr05-rls.test.js` — `ai_config` denies anon read and write |
| A-48 | Adapter host cannot be an arbitrary URL | BLOCKED | needs config write access |
| A-49 | Golden-prompt parity across three vendors | BLOCKED | metered LLM calls |
| A-50 | Prompt injection cannot alter behaviour | BLOCKED | metered LLM calls |
| A-51 | Provider keys never in a read path or client bundle | **PASS** | `tr05-rls.test.js` + `qa/checks/bundle-secrets.mjs` |
| A-52 | Lead collection denies unauthenticated read/list | BLOCKED | needs the Firebase client config |
| A-53 | Lead deleted when the prospect becomes a user | BLOCKED | same |

## B.7 Performance & data integrity

| # | Assertion | State | Where |
|---|---|---|---|
| A-54 | Query plans confirm indexes are chosen at 100k/1M | BLOCKED | needs synthetic scale data |
| A-55 | Write-path load profiled under concurrency | BLOCKED | would load the live project |
| A-56 | Discovery payload has an asserted ceiling | BLOCKED | needs alerting |
| A-57 | Pagination default and hard cap enforced | **PASS** | `tr04-authorisation-matrix.test.js` — over-cap, negative, default |
| A-58 | Packed description metadata cannot break unpacking | BLOCKED | not yet written; tractable offline |
| A-59 | Deadline vs expiry flags → correct visibility | BLOCKED | not yet written; **pure logic, the cheapest remaining win** |
| A-60 | Upload caps enforced at every surface | BLOCKED | needs real uploads |

## B.8 Fallback, failover & degraded mode

| # | Assertion | State |
|---|---|---|
| A-61 – A-68 | All eight | **BLOCKED — no fallback exists to test.** See `qa/blocked/TR-32.md` |
