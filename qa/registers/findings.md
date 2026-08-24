# Findings register — Appendix A, plus what TR-05 found

Every row maps to a test. A **RED** row is an open finding whose assertion fails
today; it goes green the day the fix ships. That is the whole mechanism — the
suite is the register, so it cannot drift from reality.

Run: `npm run test:findings` (expected red) — 16 assertions, **13 failing** as of
2026-08-20.

## Verified open

| # | Sev | Finding | Test | State |
|---|---|---|---|---|
| **F-17** | **S1** | **Reward-credit balance views readable by anon.** `v_reward_credits_available_balance` and `v_reward_credits_balance` return every user's balance keyed by `user_id` to the publishable key that ships in every browser bundle. The underlying `reward_credits_ledger` correctly denies anon — the **views bypass its RLS**, because a Postgres view runs with its owner's privileges unless `security_invoker = on`. Created by migrations 036/038. | `__findings__/f17-reward-credit-views.test.js` | **RED (3)** |
| **F-18** | S3 | **Role-check RPCs executable by anon.** `is_admin`, `is_super_admin`, `is_influencer`, `is_brand` accept an *arbitrary* uuid, so anon can ask whether any given user is an admin. Plus `is_app_admin` and `get_my_referral_rank`. | `__findings__/f18-anon-executable-rpcs.test.js` | **RED (7)** |
| **F-19** | S3→S2 | **Enumeration oracles.** `check_phone_exists(phone_number)` answers whether any number is registered; `check_brand_invitation(ig_username)` does the same for handles. Account enumeration and membership disclosure — and the strategy makes A-25 ("identical response for registered and unregistered numbers") an explicit requirement. | same file | **RED (2)** |
| **F-03** | S1 | **Select-star pulls the Instagram access token into function memory.** Confirmed at `supabase/functions/check-profile/index.ts:88` (`influencer_profiles`), `:93` (`brand_profiles`), `:62` (dynamic table) and `list-brands/index.ts:206`. | `__findings__/f01-f03-money-and-token-exposure.test.js` | **RED (1)** |

### On F-17's fix

The obvious migration is not quite enough, and migration 060 already taught this
lesson on this codebase:

```sql
alter view public.v_reward_credits_balance set (security_invoker = on);
alter view public.v_reward_credits_available_balance set (security_invoker = on);
revoke all on public.v_reward_credits_balance from anon;
revoke all on public.v_reward_credits_available_balance from anon;
```

`REVOKE … FROM PUBLIC` does **not** remove anon's grant — Supabase's
`ALTER DEFAULT PRIVILEGES` grants it to anon *directly*. Revoke from `anon` by
name, then re-run the red test to confirm it flips green.

### On F-19's fix

There is a real product tension here, so the fix is narrower than "remove it".
Signup genuinely needs a pre-auth "is this number known?" check to route between
sign-in and sign-up, and the `check-phone-exists` **edge function** exists for
that — it can carry a rate limit. The raw PostgREST RPC cannot. Revoke the RPC
from anon and leave the product path alone.

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
