# Findings register — Appendix A, plus what TR-05 found

Every row maps to a test. A **RED** row is an open finding whose assertion fails
today; it goes green the day the fix ships. That is the whole mechanism — the
suite is the register, so it cannot drift from reality.

Run: `npm run test:findings` — 16 assertions, **0 failing** as of 2026-08-25.
Every Appendix A finding this suite can reach is now closed; the suite has become
a pure regression guard.

| Date | Red | Change |
|---|---:|---|
| 2026-08-20 | 13 / 16 | Initial |
| 2026-08-24 | 12 / 17 | **F-03 closed for `list-brands`**; exemption + stale-exemption guard added |
| 2026-08-25 | 9 / 17 | **F-17 CLOSED** — migration 061 applied; views moved out of KNOWN_OPEN into the enforced leak-scan |
| 2026-08-25 | **0 / 16** | **F-18 + F-19 CLOSED** — migrations 062 + 063. `is_app_admin` reclassified as not-a-finding |

**F-17 is closed.** Migration 061 is applied (`migration list` shows
`local:061 / remote:061`) and both views now answer anon with `42501`. The
service-role consumer path still returns data, so the aggregation survived
`security_invoker`.

**One check still outstanding**, and it is the one no test covers: log in as a
real user and confirm `ReferBalanceCard` shows a balance. `security_invoker`
changes *who the view runs as* — if the `authenticated` grant or the ledger
policy is not what it appears to be, every user's balance silently reads 0 and
nothing fails loudly. Rollback is `alter view … set (security_invoker = off)`.

## Found by this programme (all closed)

| # | Sev | Finding | Test | State |
|---|---|---|---|---|
| ~~F-17~~ | ~~S1~~ | **CLOSED 2026-08-25 by migration 061.** Was: `v_reward_credits_available_balance` and `v_reward_credits_balance` returned every user's balance keyed by `user_id` to the publishable key that ships in every browser bundle. The underlying `reward_credits_ledger` denied anon correctly — the **views bypassed its RLS**, because a Postgres view runs with its owner's privileges unless `security_invoker = on`. Created by migrations 036/038. | `__findings__/f17-reward-credit-views.test.js` | **GREEN (3)** — now a regression guard |
| ~~F-18~~ | ~~S3~~ | **CLOSED 2026-08-25 by migrations 062+063.** Was: `is_admin`, `is_super_admin`, `is_influencer`, `is_brand` accepted an *arbitrary* uuid, so anon could ask whether any given user was an admin. `is_app_admin` and `get_my_referral_rank` were originally grouped here in error — both take no arguments and answer only about the caller, so neither ever leaked. `get_my_referral_rank` was revoked anyway; `is_app_admin` deliberately was not. | `__findings__/f18-anon-executable-rpcs.test.js` | **GREEN** |
| ~~F-19~~ | ~~S3→S2~~ | **CLOSED 2026-08-25 by migrations 062+063.** Was: `check_phone_exists(phone_number)` and `check_brand_invitation(ig_username)` answered whether an identity was registered, to anyone holding the publishable key. The RPCs are revoked; the `check-phone-exists` **edge function** is untouched, so signup still routes between sign-in and sign-up. | same file | **GREEN** |
| **F-03** | S1 | **Select-star pulls the Instagram access token into function memory.** | `__findings__/f01-f03-money-and-token-exposure.test.js` | **PARTIALLY CLOSED — assertion green** |

### F-03 status, 2026-08-24

**Fixed:** `list-brands/index.ts` now selects ten named columns instead of `*`.
A directory endpoint serving influencer-facing surfaces was loading every
brand's `instagram_access_token` for no reason.

Two things that fix taught, both recorded in the code:

- The select spec must be **one unbroken string literal**. supabase-js parses it
  at the type level; a `.join(",")` array — and even `"a," + "b"` — widens every
  row to `GenericStringError` and produced 15 downstream type errors.
- `list-brands` reads `p.instagram_followers_count`, which is **not a column on
  `brand_profiles`** (it is `followers_count`). It has been returning `undefined`
  all along, masked by `select("*")`. Left as-is deliberately — behaviour is
  identical either way and a latent display bug does not belong in a security
  change. **Tracked as a separate bug.**

**Deliberately not fixed:** `check-profile`. It derives `instagram_connected`
from the token itself, and that boolean gates the Instagram connection flow on
all three surfaces. An explicit list would have to include the token — all 64
columns, identical in effect to `select("*")` — satisfying the finding's wording
while changing nothing. The response is already safe (`sanitize()` strips it;
A-34 passes). Residual risk is the token in function memory and possibly in a log
line. Fully closing it needs a DB-derived boolean so the token never crosses the
boundary — a design change that re-enters the same `security_invoker` trap as
F-17, so it is a decision, not an inline edit.

The red test carries a documented exemption for `check-profile` plus a
stale-exemption guard, so the excuse cannot outlive the reason for it.

**New guard:** `qa/checks/explicit-columns.mjs` verifies every explicit column
list against the deployed schema (assertion **A-35**, previously BLOCKED). This
matters because the explicit list trades schema-drift resilience for secret
hygiene: a renamed column now 42703s the whole query, and this check catches it
before deploy rather than at runtime.

### How F-17 was fixed (migration 061, applied 2026-08-25)

The obvious migration was not quite enough, and migration 060 had already taught
this lesson on this codebase:

```sql
alter view public.v_reward_credits_balance set (security_invoker = on);
alter view public.v_reward_credits_available_balance set (security_invoker = on);
revoke all on public.v_reward_credits_balance from anon;
revoke all on public.v_reward_credits_available_balance from anon;
```

`REVOKE … FROM PUBLIC` does **not** remove anon's grant — Supabase's
`ALTER DEFAULT PRIVILEGES` grants it to anon *directly*. Revoking from `anon` by
name is what made it stick; the shipped migration also grants `select` to
`authenticated, service_role` so the real consumers keep working.

### How F-18 and F-19 were fixed (migrations 062 + 063, applied 2026-08-25)

**It took two migrations, and the reason is worth keeping.** 062 revoked EXECUTE
from `anon` by name — following migration 060's lesson — applied cleanly, and
changed nothing: the audit still reported all eight RPCs answering `200`. The
missing half is the mirror image of that lesson:

> 060: `REVOKE … FROM PUBLIC` does not remove anon's grant, because Supabase
> grants to anon **directly**.
> 062: `REVOKE … FROM anon` does not remove PUBLIC's grant, and anon
> **inherits** whatever PUBLIC holds.

Both are true at once. A function is closed to anon only when the grant is gone
from **both** PUBLIC and anon by name. 063 did that and the assertions flipped.

Worth noting the failure mode: 062 applied without error and looked like a fix.
Only the audit re-run caught that it had done nothing.

**F-19's fix is narrower than "remove it", deliberately.** Signup genuinely needs
a pre-auth "is this number known?" check to route between sign-in and sign-up,
and the `check-phone-exists` **edge function** provides it — and can carry a rate
limit, which the raw PostgREST endpoint cannot. Only the RPC was revoked;
`check-uniqueness` (its service-role caller) was re-verified working afterwards.

**Collateral, checked rather than assumed.** Revoking from PUBLIC changed anon's
result on two relations — `influencer_profiles` and `brand_profiles` went from
`200 []` to `401 42501`, because their RLS policies evaluate one of the revoked
functions. No new exposure: both already denied anon, and the change is
fail-closed-loudly rather than fail-open. All seven client-side readers of those
tables are either service-role or behind auth; the one on the public landing page
(`AIPrompt.jsx:170`) is guarded by `if (!user) return`. A before/after diff across
all 68 relations found no other change.

**`is_app_admin()` was deliberately left granted to anon.** It takes no arguments
and answers only about the caller, so for anon it is always `false` — there is no
oracle, because you cannot ask it about anyone else. It is also evaluated inside
the `ash_admin_read` RLS policy (migration 028:62), which has no `TO` clause and
so applies to anon; revoking it would turn an anon SELECT on
`application_status_history` into a hard permission error. Grouping it with the
real oracles was over-scoping in the original finding.

## Verified NOT reproducible — the strategy may be out of date here

| # | Sev | Finding as written | What the code shows |
|---|---|---|---|
| **F-01** | S1 | "The escrow funding and release functions run with platform JWT verification disabled." | **Appears closed.** Deployed config read 2026-08-20 shows `verify_jwt: true` on both `escrow-fund` and `escrow-release`, and the behavioural assertion (a publishable-key bearer must not reach the funding path) **passes**. Kept as a green regression guard rather than deleted — it is the property that matters, whichever layer enforces it. |
| **F-04** | S2 | "The email-sending function runs without JWT verification." | `send-email` shows `verify_jwt: true`. Not reproducible as written. |

Both are recorded rather than quietly dropped: the strategy was written against
an earlier state, and a finding register that keeps closed items as open noise
gets ignored.

## Not yet asserted — needs work the constraints rule out

| # | Sev | Finding | Blocker |
|---|---|---|---|
| F-02 | S1 | Verification API key as a source literal, committed | Needs secrets scanning across full git history (gitleaks/TruffleHog in CI) |
| F-05 | S2 | OTP sender runs without JWT; every send is billable | `verify_jwt: false` confirmed, but asserting the rate limits **requires sending real OTPs**. On the safety denylist. |
| F-06 | S2 | Admin and user apps share a session cookie name | Browser-level; needs two authenticated sessions on one origin |
| F-07 | S2 | Pre-login lead PII in Firestore, outside RLS | Needs the Firebase client config (TR-20, decision E-4) |
| F-08 | S2 | SECURITY DEFINER functions bypass RLS | **Partly covered**: `tr05-security-definer.test.js` proves 6 are correctly revoked and F-18/F-19 catch the open ones. The `search_path` pinning and returned-field review are static work not yet done. |
| F-09 | S2 | Mobile tokens in unencrypted AsyncStorage | Asserted in the mobile repo — see below |
| F-10 | S2 | Client helper falls back to a publishable-key bearer | Asserted in the mobile repo — see below |
| F-11 | S3 | Public shortlink resolver unauthenticated | A-38 probe in `tr04-authorisation-matrix.test.js` passes; the allow-list review is separate |
| F-12 | S3 | Native config files with client keys committed | Needs the mobile build; API-key restriction is a console setting |
| F-13 | S3 | Payout endpoints deployed outside policy | Recorded by `tr12-dormant-paths.test.js`; the decision is E-3, not a test |
| F-14 | S3 | Secondary gateway wired but UI-gated | Recorded by `tr12-dormant-paths.test.js`; decision E-2 |
| F-15 | S3 | Templates fetch web fonts at runtime | Not started |
| F-16 | S3 | Public media-kit route reads via service role | A-37 shape check passes; the published-only assertion needs a real published kit |

## Mobile repo (`D:\Development\React Native\rsgossips_app`)

| # | Finding | Test | State |
|---|---|---|---|
| F-09 | `src/utils/supabase.ts:6-13` sets `auth.storage: AsyncStorage`, unencrypted. No Keychain or encrypted-storage dependency exists. | `__findings__/f09-token-storage.test.ts` | **RED** |
| F-10 | `getAuthToken()` (`src/lib/api.ts:47-63`) races the session read against a 3s timer and falls back to the publishable key. Mitigated by a 401-retry at `api.ts:131-140`. | `__findings__/f10-auth-fallback.test.ts` | see note |

The F-10 assertion is written as the property that actually matters — a
privileged call must never *succeed or silently no-op* under the fallback —
rather than "never sends the anon key", which the code contradicts on purpose.
