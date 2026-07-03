# RGossips — Claude context

Single reference file the next Claude session reads before touching anything.
Update this file at the end of any session where architecture, standing
decisions, or repo layout changed.

## Repos

| Repo | Path | What it is |
|---|---|---|
| Web (main) | `d:/Development/React/RS_Gossips` | Next.js 15 App Router, brand + influencer surfaces at rgossips.com. Also owns `supabase/` (migrations + edge functions). |
| Admin | `d:/Development/React/rgossips-admin` | Next.js admin console (`/dashboard/*`). Reads/writes via server actions using the same Supabase project. |
| Android | `d:/Development/android/rsgossips_app` | React Native app — mirrors the influencer web surface. |

All three point at the **same Supabase project**: `hlfevcdtbehukxrrgykv`.
Migrations and edge functions live in the web repo only.

## Standing user preferences

- **No auto-push**: commit only. The user pushes manually. Override only on
  explicit "push and commit".
- **Allow all shell**: standing permission for Bash / PowerShell. No approval
  prompts.
- **Windows / Git Bash**: primary shell is PowerShell but Bash is preferred
  for POSIX scripts. Watch for CRLF warnings on commit — they're safe.
- **Terse responses**: prefer diffs and short summaries over walkthroughs.
- **/loop and workflows off** unless the user opts in with "ultracode" or a
  named workflow.

## Auth session

Both web (rgossips.com) and admin console use `@supabase/ssr` with
`createBrowserClient(url, key)`. **Same project ref → same cookie name** →
signing in on one logs out the other when they share a browser origin.

Distinct cookies via `cookieOptions.name = "sb-rgossips-user"` on the web
side and `"sb-rgossips-admin"` on the admin side — pending, mentioned to
the user but not yet applied.

## Feature: Refer & Earn

Three phases shipped. Everything is keyed to the **influencer** side; brands
neither refer nor earn RC.

### Phase 0 (locked decisions)

1. Referral code = short slug (~8 chars) on `influencer_profiles.referral_code`.
   Only populated after first successful subscription payment.
2. Unused-code TTL = 30 days.
3. Anti-fraud cap = max 5 QUALIFIED referrals per rolling day (IST).
4. All three plan tiers (Starter/Pro/Elite) qualify.
5. Claw-back window = 7 days from QUALIFIED.
6. Referrer must have an ACTIVE subscription at moment of QUALIFIED (strict).
7. ~~No welcome bonus RC~~ → **superseded** in Phase 2: 50 RC on signup, locked 30d.
8. RC redemption capped at `floor(plan_price × 0.5)` per invoice.
9. RC survives cancellation.
10. Admin can grant/deduct RC manually. Same 90d expiry + 50% cap.

### Phase 1 (2026-06 → 2026-07)

- Migration `036_referrals_core.sql`: `referral_code` column, `referrals`
  table with state machine (PENDING → SIGNED_UP → QUALIFIED → REWARDED
  with REVERSED/EXPIRED/MANUAL_REVIEW branches), `reward_credits_ledger`
  (append-only, double-entry), `v_reward_credits_balance` view, nightly
  cron for expiry + PENDING referral TTL.
- Edge functions: `attribute-referral`, `redeem-rc`, `_shared/referrals.ts`
  (`ensureReferralCode`, `qualifyReferralIfEligible`, `clawBackReferral`)
  wired into `stripe-webhook` + `razorpay-webhook`.
- Web `/influencer/refer`, admin `/dashboard/referrals`, Android
  `ReferScreen`.

### Phase 2 (2026-07)

- Migration `038_refer_earn_phase2.sql`: `ledger.unlocks_at`,
  `WELCOME_BONUS` reason, `v_reward_credits_available_balance` view,
  fraud columns on `referrals` (`signup_ip`, `device_fingerprint`,
  `review_reason`, `reviewed_at/_by`).
- `create-profile` grants 50 RC welcome bonus (locked 30d, expires 90d).
- `redeem-rc` reads `available_balance` (unlocked + unexpired only).
- Pricing page (web + Android) toggle "Apply my N RC" → passes
  `applyRc + planPriceRupees` to checkout functions.
- Stripe → one-off Coupon (`amount_off`, `duration=once`). Razorpay →
  dynamic Offer + `offer_id`. Webhooks post the REDEMPTION ledger row
  post-payment, idempotent by sub-id.
- `attribute-referral` captures IP + client device fingerprint; flags
  duplicate-device (≥1) or duplicate-IP (≥3) as `MANUAL_REVIEW`.
- Admin queue shows fraud flag + IP + fingerprint inline.
- Referrer notifications: SIGNED_UP + REFERRAL_EARN + CLAWBACK, all
  in-app AND email (via `_shared/email.ts` → `send-email`).

### Phase 3 (2026-07)

- Migration `039_referrals_leaderboard.sql`:
  `v_referral_leaderboard_monthly` (IST month bucket) + two SECURITY
  DEFINER RPCs — `get_referral_leaderboard(top_n)`,
  `get_my_referral_rank()`.
- Web `/influencer/refer` + Android ReferScreen render top-10 monthly
  + your rank chip.
- Admin analytics: funnel strip (signup→rewarded %, clawback %) +
  RC-cost strip (earned/redeemed/clawback/outstanding).
- Home wallet tile (`ReferBalanceCard`) on influencer home in both
  web and mobile; self-hides at 0 RC.
- Discoverability gap: **no persistent web nav entry**. Mobile has a
  "Refer & Earn" row inside `DashboardView`. If a user has 0 RC and no
  admin-granted balance, web has no way to reach `/influencer/refer`
  outside typing the URL. Not fixed as of last touch.

## Feature: Trust score (brand-side)

CIBIL-style 300–900 score with cold-start cap of 720 until 3 FINAL_ACCEPTED
campaigns. Bands renamed 2026-07 to non-punitive labels:

| Score | Old | New |
|---|---|---|
| 800–900 | Excellent | **Elite** |
| 740–799 | Very Good | **Trusted** |
| 670–739 | Good | **Established** |
| 580–669 | Fair | **Emerging** |
| <580 | Poor | **Building Trust** |

Source of truth: [src/lib/brandProfile.js](src/lib/brandProfile.js). Colour
maps in `BrandCard.jsx` + `TrustSection.jsx`; border switch in
`BrandHero.jsx`; scale legend in `TrustScoreInfoModal.jsx`.

## Feature: Influencer profile classifier

Migration `037_influencer_creator_type.sql` added
`influencer_profiles.creator_type` ∈ `{meme_page, celebrity}`, optional.

- Admin invite + edit forms have Profile Type dropdown.
- Brands home Meme/Celebrity cards deep-link to
  `/brands/search?profileType=meme_page` / `celebrity`.
- Filter Drawer has a "Profile Type" section.

## Photo URLs — fallback rule

Two fields:
- `custom_profile_photo_url` — manual upload (`upload-profile-photo`)
- `profile_photo_url` — Instagram-synced (populated on signup / refresh)

Always resolve as `custom || instagram || default`. Web home components
(`UserDoc.jsx`, `ProStatusCard.jsx`) were reading only Instagram; fixed
2026-07 to use the fallback. Media kit, profile page, brand-side cards,
and the mobile `useProfilePhoto()` helper already did the right thing.

**Edge-function joins must coalesce too.** Client code that reads
`inf.profile_photo_url` off a joined row is trusting the server to have
picked the right column. Fixed sites:
- `list-influencers` — `r.custom_profile_photo_url || r.profile_photo_url`
- `brand-campaigns` (get action) — maps `custom_profile_photo_url` onto
  `profile_photo_url` on each application's joined `influencer_profiles`
  so campaign detail shows the custom upload (fixed 2026-07).

If you add a new edge function that joins to `influencer_profiles` and
returns a photo, mirror the same coalesce or another surface will
silently regress.

## Payments

- **Stripe** (subscriptions): `stripe-checkout` creates Sessions,
  `stripe-webhook` handles `checkout.session.completed`,
  `customer.subscription.updated/deleted`. India-compliance:
  `billing_address_collection = required`.
- **Razorpay** (subscriptions): `razorpay-checkout` creates subs (needs
  `planId` — mobile bug fixed 2026-07 to pass it explicitly),
  `razorpay-webhook` handles `subscription.activated`,
  `subscription.charged`, `subscription.cancelled/completed/halted`.
  Also handles `payment.captured` for service marketplace + payout
  events + fund-account validation.
- **RazorpayX removed 2026-07** in favour of manual payouts. Admin has
  `/dashboard/payouts` queue.

## Sessions + auth quirks

- **Stable per-user password** in `app_metadata.session_password` — DO NOT
  rotate per login. Rotating invalidates other-device sessions.
- **Multi-device session** works because of the above.
- **Deleted user reinvite**: on admin user delete, delete the invitation
  row rather than reset to pending (prevents "you're already invited" loop).
- **Invitation loop fixed**: "Continue with my invitation" advances
  in-place, no re-OAuth.
- **Role-mismatch** interrupt shows dedicated copy, not the generic
  "sign in instead".

## Instagram data

- **Business Login OAuth** during signup.
- Reach: use `metric_type=time_series` with `period=days_28` — the
  older single-value read silently downgrades to 1-day for Creator
  accounts. Views / interactions / engagement need different handling
  (documented ad-hoc, not fully standardised).
- `check-profile` returns `instagram_connected` boolean (does NOT expose
  the access token). Gate reads that.

## Sidebar / navigation

Admin sidebar is grouped:
- **Overview** — Dashboard
- **Influencers** — Influencers, Featured Creators, Creator Stories,
  Refer & Earn
- **Brands** — Brands, Featured Brands, Campaigns, Featured Campaigns,
  Plan Your Stay
- **Operations** — Disputes, Payouts, Services, Quote Requests, Leads
- **Admin Panel** (super-admin only) — Admin Users

## Migrations register

| # | Name | Notes |
|---|---|---|
| 036 | referrals_core | Refer & Earn tables, ledger, view, nightly cron |
| 037 | influencer_creator_type | `creator_type` column + partial index |
| 038 | refer_earn_phase2 | `unlocks_at`, welcome bonus reason, available-balance view, fraud columns |
| 039 | referrals_leaderboard | Monthly view + 2 SECURITY DEFINER RPCs |

## Campaign visibility rules (influencer side)

`list-campaigns` (edge fn) hides a campaign from the influencer list
when EITHER:

- `isExpired` is true (based on `campaign_end_date`, falling back to
  `application_deadline` if no end date) — the overall campaign ended, OR
- `applicationDeadlinePassed` is true (based on `application_deadline`
  alone) — applications closed even though the campaign might still be
  running for people already accepted.

Both flags surface on the campaign row for the client. Rows the
influencer has already applied to are always kept (regardless of either
flag) so they can still see status / submit deliverables / view final
metrics under the Applied / Completed tabs.

## Common commands

- Apply new migration: `npx supabase db push`
- Deploy one edge function: `npx supabase functions deploy <name>`
- Deploy multiple: same command, space-separated names
- Query DB directly (from web repo root — SUPA_KEY is in `.env.local`):
  ```
  curl -sS "$SUPA_URL/rest/v1/<table>?<filter>&select=..." \
    -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY"
  ```

## Update protocol

At the end of any session that shipped a change, append a short line to
the appropriate section here — or add a new section if the change opens
a new surface. Small edits are cheap; the goal is that the next Claude
session can read this file and know the current state without hunting
through git log.
