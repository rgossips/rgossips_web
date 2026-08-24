# Environment register — actual topology vs strategy Table 8

The single largest constraint on this programme. Table 8 of the Master Test
Strategy specifies five environments. This project has two.

| Strategy expects | Reality | Consequence |
|---|---|---|
| **Local** — seeded synthetic, providers stubbed | Exists. `next dev` + `.env.local` pointing at **production**. | No local Supabase stack is running; local dev reads and writes the live project. |
| **CI** — ephemeral seeded, all providers stubbed | **Does not exist.** `.github/workflows/qa.yml` is scaffolded but no repo secrets are configured. | Nothing runs automatically on push. |
| **Preview** — per-PR deploy, shared staging dataset | **Does not exist.** No Netlify link, no CLI, no token in the repo. | Deploy-preview assertions in TR-34 cannot run. |
| **Staging** — production-shaped, fully anonymised | **Does not exist.** | The blocker for 18 disciplines. |
| **Production** | `RGossips-dev` (`hlfevcdtbehukxrrgykv`), `ACTIVE_HEALTHY`, ap-south-1 | Serves web + admin + mobile simultaneously. |

## The single-project problem

`npx supabase projects list` returns exactly one project. It is named
`RGossips-dev` but it is production: the live web app, the admin console and the
Android app all point at it, and it holds real users (1,693 influencer profiles
at the time of writing), real campaigns and real reward-credit balances.

That means every one of these is unavailable:

- **Mutating end-to-end journeys** (TR-06) — twelve journeys, each run twice,
  each creating campaigns, applications, escrow rows and notifications.
- **Payment matrix** (TR-11) — real gateway transactions, even in test mode,
  write rows into the live database.
- **Concurrency** (TR-15) — "fire the same webhook ten times and assert one
  ledger entry" requires ten real webhooks.
- **Load, soak, spike, stress** (TR-30) — would degrade the live service.
- **Chaos** (TR-31) — requires breaking real dependencies.
- **Restore drills** (TR-33) — "perform a full restore into a clean project" is
  literally a second project.
- **Privacy erasure** (TR-21) — requires creating and deleting a real user.

## What unblocks it

One additional Supabase project on the same organisation, seeded with anonymised
data, plus the same edge functions deployed to it. Concretely:

1. Create a second project (`rgossips-staging`, same region for parity).
2. `npx supabase db push --project-ref <new>` — all 60 migrations apply cleanly;
   they are ordered and idempotent.
3. `npx supabase functions deploy --project-ref <new>` — **with
   `--no-verify-jwt` on the public functions**, or they re-gate behind JWT and
   the app 401s. This is the documented landmine in CLAUDE.md.
4. Seed via `seed-test-users` (already deployed) plus a synthetic generator for
   the scalability profiles.
5. Point the test suites at it by swapping `.env.local` — every suite reads
   `NEXT_PUBLIC_SUPABASE_URL` and the key from the environment, so nothing else
   changes.

Cost is a second Supabase plan. Against that: TR-06, TR-11, TR-15, TR-21, TR-30,
TR-31 and TR-33 all become executable — seven disciplines, including three of the
strategy's P0 items.

## Credentials currently available

| Credential | Where | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | every live suite |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `.env.local` | the anon boundary probes |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | schema enumeration in `tr05-rls.test.js` only |
| Supabase CLI session | machine keyring | `db push`, `functions deploy`, `projects list` |

Absent: gateway keys, Meta app credentials, LLM keys, VAPID, Firebase config.
Several disciplines (TR-19, TR-20, TR-28, TR-29) need these before they can run
even given a staging project.

## Note on `.env.local`

It did not exist in this checkout — it is gitignored and had never been
committed, which is why the dev server was 500ing on every route. It was
reconstructed on 2026-08-19 from the Supabase management API. Anyone setting up
this repo fresh will hit the same wall; the file is not recoverable from git.
