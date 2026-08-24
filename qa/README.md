# QA programme

Implementation of the RGossips Master Test Strategy (ISO/IEC/IEEE 29119-3),
test-side only. No application code was changed to make any of this pass.

## Run it

| Command | Discipline | Credentials | Expected |
|---|---|---|---|
| `npm test` | TR-09 unit | none | green — 118 tests |
| `npm run test:cov` | TR-09 + coverage gate | none | green — 90/85/95/90 floors |
| `npm run test:deno` | TR-14 ledger + referral guards | none | green — 22 tests |
| `npm run qa:checks` | TR-05/A-31, TR-34/A-51 | none | green |
| `npm run lint:security` | TR-02 | none | reporting |
| `npm run test:mutation` | TR-01 | none | ~5 min, score report |
| `npm run test:int` | TR-04, TR-05, TR-12 | `.env.local` | green — 70 tests |
| `npm run test:findings` | open findings | `.env.local` | **RED — 13 failing** |
| `npm run qa:gate` | everything blocking | none | green |

Mobile repo (`D:\Development\React Native\rsgossips_app`):
`npm run test:findings` → **RED — 3 failing** (F-09, F-10).

Deno must be on PATH for `test:deno` (`winget install DenoLand.Deno`).

## How this is organised

```
__tests__/        offline pure logic (pre-existing, extended by the coverage gate)
__deno__/         edge-function money logic, offline, stubbed DB
__integration__/  live guard/read-only contracts + the safety denylist
__findings__/     RED by design — one file per open finding
qa/registers/     disciplines, findings, assertions, environment
qa/blocked/       what cannot run here, and exactly what would unblock it
qa/checks/        static checks with no credential requirement
```

## The two rules that keep this safe

**1. Nothing mutates the live project.** `RGossips-dev` is the only Supabase
project and it serves web, admin and mobile. There is no staging. Every live
test is a read, a refused guard, or a bad-signature path — all of which change
nothing. This is enforced by a denylist in `__integration__/safety.js` that
*throws* rather than call `whatsapp-otp-sender` (billable per send), any
checkout, any escrow mutation, or any seeding function. A guarded exception
requires a written justification in `ALLOW_GUARDED`.

**2. Red means a finding, not a break.** `__findings__/` asserts the state the
code *should* be in. Those tests fail today and go green when the fix ships, so
the suite is the findings register and cannot drift from reality. It is
deliberately outside `npm test` — a permanently-red suite inside the blocking
gate teaches people to ignore the gate.

## What this pass found

Implementing TR-05 surfaced three previously unrecorded issues:

- **F-17 (S1)** — `v_reward_credits_available_balance` and
  `v_reward_credits_balance` return every user's reward-credit balance, keyed by
  `user_id`, to the publishable key that ships in every browser bundle. The
  underlying table's RLS is fine; the **views bypass it**, because a Postgres
  view runs with its owner's privileges unless `security_invoker = on`.
- **F-18 (S3)** — `is_admin` / `is_super_admin` / `is_influencer` / `is_brand`
  accept an arbitrary uuid and are executable by anon: a role oracle.
- **F-19 (S3→S2)** — `check_phone_exists` and `check_brand_invitation` are
  anon-executable enumeration oracles.

And TR-01 measured the thing the strategy warns about: **96.46% statement
coverage, 62.30% mutation score.** `plans.js` sits at **38%** despite being in
the "covered" set. The suite executes the code; it does not assert it.

Two Appendix A findings did **not** reproduce and are recorded as such rather
than carried as noise: **F-01** (escrow functions now show `verify_jwt: true`
and refuse a publishable-key bearer) and **F-04** (`send-email` likewise).

## The trap that catches everyone

An RLS-denied `SELECT` returns `[]` with HTTP **200**, not an error. An empty
array on a table you know holds rows means the policy is working. A revoked
*function* is different — it answers `42501`/401. Both behaviours are relied on
throughout `__integration__/`, and confusing them is how migration 059 shipped
an open grant that read as locked down.
