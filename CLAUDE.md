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

**Consequence** (until that fix ships): any brand-side edge function that
does an inline `supabase.auth.getUser(token)` check (`escrow-fund`,
`escrow-release`, etc.) will 401 when the admin app is signed in on the
same browser origin, because the shared cookie holds the admin user's
session and `functions.invoke()` falls back to sending the publishable
key as the Bearer. The user page (`/brands/campaign/[id]`) guards the
two escrow calls with an explicit `supabase.auth.getSession()` + fail-
early alert + explicit `Authorization: Bearer <access_token>` header on
the invoke — matches the pattern the durable cookie-name fix will
generalise.

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
- Entry points: home wallet tile (`ReferBalanceCard`, self-hides at
  0 RC) + a persistent "Refer & Earn" row in the profile dashboard's
  Settings section on BOTH web (`DashboardView.jsx`, added 2026-07) and
  mobile (`DashboardView.tsx`).
- **Mobile route-name fix (2026-07)**: the Refer screen registers only as
  `InfluencerRefer` (`App.tsx`), but three mobile entry points
  (`ReferBalanceCard`, `WelcomeRewardModal`, `DashboardView` RC card) were
  navigating to an unregistered `'Refer'` → silent no-op in prod. All three
  now use `'InfluencerRefer'`. The Settings row was already correct.
- **Missing-code self-heal (2026-07)**: `ensureReferralCode` only runs in
  the payment webhooks, so subs that predate Phase 1 or admin-comped
  plans (`updateInfluencerPlan` bypasses gateways) had a paid
  `subscription_plan` but `referral_code=NULL` → blank share link. New
  edge fn `ensure-referral-code` (caller JWT, server re-checks non-trial
  plan) generates on demand; web `/influencer/refer` + Android
  `ReferScreen` invoke it when subscribed && no code.

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
- **First-cycle discount on Razorpay = throwaway-plan + scheduled upgrade
  (2026-07).** Razorpay has **no programmatic create-offer API** — `POST
  /v1/offers` 404s ("no Route matched") and the Offers product isn't enabled
  on the account, so the referral 50%-off / RC redemption can NOT be applied
  via `offer_id` the way Stripe uses a coupon. (The old offer-create code was
  dead — it silently fell through to full price.) Instead `razorpay-checkout`
  now: (1) mints a one-off **discounted plan** at `full − discount` via `POST
  /v1/plans`, (2) opens the subscription on THAT plan so the reduced amount
  shows at checkout and is charged on cycle 1, recording the real plan in
  `notes.base_plan_id`. The upgrade back to the real plan **cannot** be
  scheduled at creation (`PATCH` is rejected while the sub is `created` —
  "not in Authenticated or Active state"), so it's deferred: both
  `reconcile-subscription` (client's post-payment call, the active path while
  the webhook is off) and `razorpay-webhook` (`subscription.activated/charged`
  backstop) `PATCH …/subscriptions/:id { plan_id: base_plan_id,
  schedule_change_at: "cycle_end" }` once the sub is active. Result: cycle 1
  discounted + visible at checkout, cycles 2..N full price, auto-recurring, no
  Offers feature. `reconcile` reads `notes.plan` (real plan) so the profile
  reflects the right tier regardless of the throwaway `plan_id`. Note: the
  deployed Razorpay key is `rzp_test_…` (test mode).
- **Reconcile fallback + checkout idempotency (2026-07)**. Webhooks are the
  normal source of truth for flipping `subscription_plan`; if one is
  disabled/dropped the plan never updates and prior subs never cancel
  (multi-billing). Safety net:
  - `reconcile-subscription` (edge fn, **caller-JWT auth**, users reconcile
    only themselves). **CROSS-GATEWAY**: pulls the user's subs from BOTH
    Stripe + Razorpay via `subscription-history`, keeps the single newest
    active+paid sub, points the profile at it (correct gateway, clears the
    other gateway's ids), and cancels every OTHER live sub on either
    gateway. Idempotent. **Must stay cross-gateway** — a Razorpay-only
    version wrongly re-activated a stale Razorpay sub after a user switched
    to Stripe (regression, fixed). Web + Android pricing call it after the
    post-payment poll.
  - `razorpay-checkout` idempotency: reuses an existing non-terminal sub
    for the same user+plan instead of creating a duplicate; returns
    `already_active` so the client skips reopening checkout (no double
    charge). Prevents the double-subscription seen on double-submit.
  - **Mobile annual-plan fix (2026-07)**: mobile annual cards use ids
    `starter_annual`/`pro_annual`/`elite_annual`, but `PLAN_RAZORPAY_IDS` /
    `PLAN_PRICING` / `PLAN_STRIPE_PRICES` (`lib/plans.ts`) are keyed by base
    tier + a separate `billing` cycle — so `startRazorpay`/`startStripe` in
    `InfluencerPricing.tsx` were looking up `PLAN_RAZORPAY_IDS['pro_annual']`
    → `undefined` → "not configured" throw; annual checkout was impossible.
    Fixed by stripping the suffix (`baseId = plan.id.replace(/_annual$/,'')`)
    before every config lookup and before the backend-facing `plan`/`notes.plan`
    /`finishSuccess` values (cycle still passed as `billing`). `planPriceRupees`
    is now parsed from the **displayed card price** (`plan.price`) rather than
    `PLAN_PRICING`, so the RC/discount cap can't drift from what the user sees
    (the annual cards read ₹2,899/₹6,899 for Pro/Elite while `PLAN_PRICING` had
    2,699/6,299 — display is now authoritative).
  - Pricing success modal shows the plan the user PURCHASED (stashed
    pre-checkout), not a possibly-stale profile plan; has an **Open Invoice**
    button (invoice `hosted_url`/`pdf_url` from `subscription-history`).
  - **Service-order payments have the same fallback (2026-07).** Razorpay
    service advance/final payments (`razorpay-service-checkout` → Razorpay
    Order) were flipped to `in_progress`/`paid_final` ONLY by the
    `razorpay-webhook` `payment.captured` handler — so with the webhook off,
    paying the advance didn't change the order status. New edge fn
    `verify-service-payment` (client calls it in the Razorpay success handler,
    web + Android): fetches the Razorpay Order server-side, requires
    `status="paid"` + matching `notes.order_id`/`phase` + caller owns the
    order, then applies the flip. The actual flip/events/notifications now
    live in `_shared/service-payment.ts` (`applyServicePaymentCaptured`),
    called by BOTH the webhook and the verify fallback so they stay identical;
    idempotent via `advance_paid`/`final_paid`. Stripe service payments are
    unaffected (stripe-webhook works).
  - Pricing banner shows "Renews in N days" for paid plans (approx off
    `updated_at` + cycle — exact `current_period_end` not stored).

## Signup: deferred auth-user creation (Option A, 2026-07)

**Invariant: an `auth.users` row never exists without a matching profile.**
Previously the OTP verifier created the auth user the moment the signup
OTP was verified, but the profile was written minutes later by
`create-profile` — so any abandoned/failed onboarding left an orphaned
phone user (reads as "already registered" yet has no account to sign in
to). Fixed by deferring user creation to the atomic profile step:

- **`whatsapp-otp-verifier` (signup mode)** no longer creates a user or a
  session. On OTP match it stamps the `otp_verifications` row
  (`verified=true, verified_at=now()` — migration 044 added `verified_at`)
  as a short-lived **proof-of-phone** and returns
  `{ success, phoneVerified, phone }`. Sign-in mode is unchanged (still
  returns `{ session, user }`, still has the reactivation short-circuit).
- **`create-profile`** is now the single atomic create point. It: (1)
  validates the proof (a `verified` OTP row for the phone, minted within a
  30-min window); (2) creates the auth user, or reuses an existing
  profile-less one (heals legacy orphans), or returns `already_registered`
  if a profile already exists; (3) writes the profile; (4) **on profile
  failure, deletes the auth user it just created (compensating rollback)**;
  (5) issues a session (stable `app_metadata.session_password` scheme,
  ported from the verifier) and consumes the proof. Returns
  `{ success, userId, session }`. No longer accepts/ trusts a client
  `userId` — `phone` is required instead.
- **Clients** (`login/page.js`, Android `LoginScreen.tsx`): `verifyOtp`
  branches on mode — signup no longer stashes session/userId (there is
  none yet); `handleSignUpFormSubmit` calls `create-profile` with `phone`
  (no userId) and takes `userId` + `session` back from the response, then
  `setSession`. Categories/preferences steps run afterward with the
  returned session.
- Verified live: no-proof → rejected; valid proof → user+profile+session
  atomically; duplicate → `already_registered`; **forced profile failure →
  auth user rolled back, zero orphan.**

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

## Security hardening (audit 2026-07)

Full QA + security + abuse audit. Key results and standing rules:

- **RLS is the real boundary and it holds.** Empirically verified with the
  live publishable/anon key: every sensitive table (`influencer_profiles`,
  `campaigns`, `campaign_applications`, `brand_profiles`, `referrals`,
  `reward_credits_ledger`, `notifications`, `user_preferences`) returns
  `[]` to anon despite holding data, and anon writes are denied (`42501`).
  Only `services` + `homepage_settings` are intentionally public. Storage
  buckets deny anon object listing. When probing, remember **RLS-denied
  SELECT returns `[]`, not an error** — an empty array on a table you know
  has rows means the policy is working, not that the table is empty.
- **OTP brute-force (was CRITICAL, fixed).** `whatsapp-otp-verifier` had
  no attempt cap → a 6-digit code (900k space, 5-min window) was
  brute-forceable = account takeover. Fixed via `otp_verifications.attempts`
  + SECURITY DEFINER RPC `consume_otp_attempt(phone, code, max)` that does
  the compare + increment under a row lock (race-safe), burns the code at
  5 wrong guesses. Match does NOT burn the code (reactivation re-submit
  needs it). Verifier calls the RPC; caps combine with the sender's 60s
  cooldown + 5/phone/hr.
- **Instagram token in client bundle (was HIGH, fixed).** `ProfileDetails.jsx`
  called the Graph API directly with `NEXT_PUBLIC_INSTA_OAUTH_TOKEN` (Next
  inlines every `NEXT_PUBLIC_*` into the browser bundle) and even
  `console.log`ged it. Moved to server route
  `src/app/api/instagram/business-discovery/route.js` (reads server-only
  `INSTA_OAUTH_TOKEN`, falls back to the legacy public name). **Rule: never
  reference a `NEXT_PUBLIC_*` secret from client code** — rename to drop the
  prefix and proxy through a route/edge fn. `lib/instagram.js` (dead) also
  de-referenced.
- **Payment webhooks verify signatures** (Stripe `constructEventAsync`,
  Razorpay HMAC-SHA256, now constant-time compare). Escrow funds/release
  enforce brand ownership + state guards + amount-match + idempotency.
- **Fixed:** duplicate-application race (unique partial index on
  `campaign_applications(campaign_id, influencer_id)`), leaderboard RPC
  exposed to `anon` (revoked from PUBLIC+anon; `top_n` capped at 100),
  `refresh-application-metrics` external-API hammering (60s cooldown,
  `force:true` bypass for genuine post-submit calls).
- **Structured logging**: `supabase/functions/_shared/log.ts` — JSON
  severity+event+context lines, auto-redacts secret-ish keys, `hashId()`
  for PII-free correlation. Wired into the OTP verifier; the pattern to
  copy into other functions.
- **Known-open (documented, not yet done):** several edge fns
  (`apply-campaign`, `create-profile`, `submit-quote-request`,
  `refresh-instagram`) trust a body-supplied `userId`/`influencerId`
  instead of deriving it from the JWT — combine with `verify_jwt` posture
  before relying on their per-user caps. CORS is wildcard `*` everywhere
  but auth is token-in-header (not cookie), so CSRF/credential-theft via
  CORS isn't the exposure; tightening is defense-in-depth only.

## i18n (2026-07)

Foundation shipped across all three apps; English is the source of truth,
conversion is incremental (foundation + one reference surface each so far).

- **Web + Admin** use **next-intl v4** in the **"without i18n routing"** mode —
  the active locale lives in a `NEXT_LOCALE` cookie, NOT a URL prefix, so no
  page had to move under `app/[locale]`. Wiring:
  - `src/i18n/config.{js,ts}` — CLIENT-SAFE constants (`locales`,
    `defaultLocale`, `localeNames`). Never import `next/headers` here.
  - `src/i18n/request.{js,ts}` — `getRequestConfig` reads the cookie, loads
    `messages/<locale>.json`.
  - `next.config.*` — wrapped with `createNextIntlPlugin("./src/i18n/request.*")`.
  - Root layout is `async`: `getLocale()` + `getMessages()` → wrap the tree in
    `<NextIntlClientProvider>`, set `<html lang={locale}>`.
  - Message catalog: `messages/en.json` (repo root of each app), namespaced
    (`Footer`, `Common`, `Sidebar`, …).
  - Components: `useTranslations("Namespace")` → `t("key")`, `t("k", {var})`,
    `t(\`dyn.${x}\`)`. Web `LanguageSwitcher` (`src/components/LanguageSwitcher.jsx`)
    writes the cookie + `router.refresh()`; **self-hides while `locales.length < 2`**.
  - Surfaces converted (web): `Footer.jsx`; **the ENTIRE auth/login surface** —
    `app/(auth)/login/page.js` + every `components/login/*` component
    (`RoleSelection`, `SignInPhone`, `VerifyOTP`, `SignUpForm`,
    `BrandSignUpForm`, `InstagramConnect`, `CategorySelection`, `Preferences`,
    `Notifications`, `SuccessScreen`, `OnboardingCarousel`) — all under the
    `Auth` namespace (sub-namespaces per component: `Auth.roleSelection`,
    `Auth.phone`, `Auth.verifyOtp`, `Auth.signUpForm`, `Auth.brandSignUpForm`,
    `Auth.instagram`, `Auth.onboarding`, …). Patterns established:
    ICU interpolation (`t("...", { otherRole })`), rich text
    (`t.rich("...", { strong, b, link })` for bold spans / anchors),
    role labels via `Auth.roles.*` + a `roleIndef()` helper, and data-array
    → key-array (map a stable `key`/`titleKey` in code, resolve
    `t(\`slides.${key}.title\`)` at render). `components/login/ProfileDetails.jsx`
    is dead code (no importers) — skipped. Admin: `sidebar.tsx` group headings.
  - **WEB: DONE.** The influencer home cards were converted manually, then a
    multi-agent workflow (opted in via "ultracode") converted the remaining
    **115 web components/pages**. Each agent edited its component and wrote a
    per-file namespace part to `messages/i18n-parts/<Ns>.json`; a deterministic
    Node merge folded all parts into `messages/en.json` (now **126 namespaces /
    ~2,906 keys**), the parts dir was deleted, `next build` is green, and every
    literal `t()` key was statically verified to resolve. One agent-introduced
    quirk to know about: in `app/influencer/services/page.js` the tag-map uses a
    param named `t` that shadows the translation `t` — harmless (no `t()` call
    inside that scope) but don't "fix" it blindly.
  - **MOBILE: DONE (2026-07).** The paused workflow had already converted all
    **108 `.tsx`** to `t(...)` (i18next) and written per-component parts to
    `rsgossips_app/src/i18n/parts/`, but never merged them (en.json still had
    only the 3 foundation namespaces, so converted screens rendered raw keys).
    Completed by: deep-merging all 108 parts into `src/i18n/en.json`
    (**111 namespaces / ~2,210 keys**, zero collisions), deleting the `parts/`
    dir, and verifying — **1,803 static `t()` keys resolve with 0 missing**;
    86 dynamic `t(\`ns.${x}\`)` sites (data-array maps, e.g. pricing
    `plans.${plan.id}.name` which has both base + `_annual` keys). The 8 files
    not importing react-i18next were confirmed to have **no user-facing copy**
    (contexts, layouts, composition-only screens; `InfluencerLayout`'s only
    `<Text>` is an unread badge count → its part is empty `{}`). `tsc --noEmit`
    is **green (0 errors)** after fixing one conversion-introduced `t`-shadow
    (`InfluencerMediaKit` `.map((t: MediaKitTemplate)…` renamed param → `tpl`
    so the inner `t('…live')` resolves to the translation fn) and a pre-existing
    `new Promise(r => setTimeout(r, 1200))` typing.
  - **ADMIN: DONE (2026-07).** The paused workflow had converted ~66 `.tsx`
    (next-intl) but never merged the parts and left ~37 files unconverted.
    Completed by: (1) deep-merging existing parts, (2) writing the missing
    catalog entries for 12 already-converted-but-partless files by recovering
    original English from the pre-conversion commit (`2322389^`), (3) converting
    the ~20 remaining files that had copy (subagents; the other ~21 — loading
    spinners, layout wrappers, theme/context/avatar primitives, recharts config,
    delete-modal wrappers whose strings arrive via props — are genuinely
    no-copy), (4) mopping up residual literals the original pass left hardcoded
    (only `quote-response-form` + `login/page` had real ones). Result:
    `messages/en.json` = **82 namespaces / ~1,441 keys**, **82/103 tsx** use
    next-intl, `next build` green, `tsc` 0 errors, all `t()` keys resolve.
    Fixes made: rewrote `stats.*` etc. from flat-dotted keys (`"stats.total"`)
    to nested objects (next-intl does nested-path lookup); renamed a
    `const t = setInterval(...)` in `notification-bell.tsx` that shadowed the
    translation `t`. **i18n across web + mobile + admin is now complete.**
  - Tradeoff: reading the cookie in `getRequestConfig` makes pages render
    dynamically (all routes `ƒ`). Fine here (auth-heavy app); revisit only if a
    public page needs static caching.
- **Mobile** uses **i18next + react-i18next**. `src/i18n/index.ts` inits
  synchronously (English), then restores the persisted choice from AsyncStorage
  (`rg.lang`); `setLanguage(code)` persists + `changeLanguage`. Imported for
  side effect at the top of `App.tsx`. `src/i18n/en.json` is the catalog.
  Components: `const { t } = useTranslation(); t("verifyingOverlay.title")`.
  Reference surface: `VerifyingOverlay.tsx`.

**Add a language**: web/admin — add the code to `src/i18n/config.*` +
`localeNames`, drop `messages/<code>.json`; the switcher appears automatically.
Mobile — add `src/i18n/<code>.json`, register in `resources` + `SUPPORTED_LOCALES`.

**To continue conversion**: pick a surface, move its literals into the app's
`en.json` under a namespace, replace with `t(...)`. Keep brand names ("RGossips")
and data (hrefs, enum values) untranslated.

## Migrations register

| # | Name | Notes |
|---|---|---|
| 036 | referrals_core | Refer & Earn tables, ledger, view, nightly cron |
| 037 | influencer_creator_type | `creator_type` column + partial index |
| 038 | refer_earn_phase2 | `unlocks_at`, welcome bonus reason, available-balance view, fraud columns |
| 039 | referrals_leaderboard | Monthly view + 2 SECURITY DEFINER RPCs |
| 040 | admin_activity_log | Admin rate-limit + audit table (service-role only) |
| 041 | security_hardening | OTP attempts col + `consume_otp_attempt` RPC, apply-campaign unique index, leaderboard anon revoke |
| 042 | perf_indexes_and_stats | Hot-filter indexes + `get_referral_admin_stats()` RPC. **Renamed from 040** — it collided with `040_admin_activity_log` in `schema_migrations` (version tracked by numeric prefix), which aborted a `db push`. Never reuse a version prefix. |
| 043 | leaderboard_revoke_public | Completes 041's leaderboard revoke (also revoke from PUBLIC, not just anon) |
| 049 | ai_config | `ai_config` singleton (provider + model-per-task-class + admin-editable API keys). RLS enabled, **NO policies** (keys readable by service role only) |
| 050 | ai_usage | `ai_generation_usage(user_id, period, tool)` + `bump_ai_usage` RPC (metered AI quota) |
| 051 | application_pitch | `campaign_applications.pitch` — the creator's "why choose you", AI-draftable |

## Feature: AI layer (2026-07)

Provider-swappable, metered LLM layer. English strategy doc endorsed a 3-tier
roadmap; **Foundation + all of Tier 1 shipped web-side** (mobile fast-follow
pending). Decisions locked: provider swappable from admin, API keys
admin-editable, web-first.

### Foundation

- **`ai_config` singleton (migration 049)** — admin picks `active_provider`
  (anthropic/openai/gemini) + a model per **task class** (`cheap`/`standard`/
  `reasoning`/`multimodal`) + a global `enabled` toggle. API keys stored in the
  row (`anthropic_api_key`/…), **masked in admin UI**, only overwritten when a
  new value is typed. RLS on, **no policies** → only the service role reads the
  keys. Adapter falls back to the env secret (`ANTHROPIC_API_KEY` etc.) when the
  DB key is blank.
- **`_shared/ai.ts`** — `aiGenerate(admin, {taskClass, system, messages, …})`;
  30s config cache; `keyFor()` (DB key ‖ env); `anthropic()`/`openai()`/`gemini()`
  REST callers normalized to `{text, provider, model, usage}`.
- **`_shared/campaign-context.ts`** (`buildCampaignContext`, `contextToPrompt`,
  `unpackDescription`) + **`_shared/creator-voice.ts`** (`buildCreatorVoice`,
  `voiceToPrompt`) make every tool campaign-aware + voice-matched.
- **`ai-generate` edge fn** (deploy `--no-verify-jwt`; **caller-JWT auth** so
  quota can't be spoofed) fronts ALL text tools. `TOOLS` registry = prompt
  templates keyed by tool: `caption`, `script`, `hooks`, `rate_card`,
  `brief_checklist`, `pitch`, `match_coach`, `compliance`, `media_kit`. Quota =
  sum of `ai_generation_usage` for the period vs `AI_LIMITS`
  {starter:25, pro:150, elite:∞}; `effectivePlan()` (trial→pro, floor→starter);
  `bump_ai_usage` after each call. Returns `{text, remaining, model}`; known
  errors `ai_disabled`/`ai_key_missing`/`ai_config_missing`/`ai_limit_reached`.
- **Gating**: `src/lib/plans.js` + mobile `plans.ts` `FEATURE_MATRIX` AI rows +
  `getAiUsageStatus(profile, usedThisMonth)`.
- **Client hook** `src/hooks/useAiTool.js` — `generate({tool, campaignId, inputs})`
  → `{loading, result, remaining, error, limitReached, generate, setResult}`.
- **Admin** `rgossips-admin/.../dashboard/ai-settings/` (page + actions, super-admin
  gated, keys masked) + sidebar "AI Settings" entry.
- ⚠️ **Nothing generates until an API key is set** in admin AI Settings (or the
  `ANTHROPIC_API_KEY` Supabase secret).
- **Admin model dropdowns are provider-aware (2026-07)**: `ai-settings/page.tsx`
  has `PROVIDER_MODELS` + `PROVIDER_DEFAULTS`; switching provider auto-remaps any
  model that belonged to a different provider to the new provider's default
  (custom values preserved), with a "Custom…" escape hatch. OpenAI list stays on
  the `gpt-4o`/`4.1` family — the adapter sends `max_tokens`+`temperature`, which
  the o-series/GPT-5 reject (they need `max_completion_tokens`).
- **`buildCreatorVoice` `city`-column bug (fixed 2026-07)**: it selected a
  non-existent `city` column → the whole select 42703'd → returned null → EVERY
  tool ran with **empty creator context** (model asked for info / hallucinated a
  generic creator). `city` is NOT a column on `influencer_profiles` (location is
  `location`). Also: `ai-generate` appends a global **no-questions directive** to
  every system prompt — there's no chat UI, the reply renders as-is, so the model
  must never ask a follow-up.

### Tier 1 (web done; deal-loop order)

- **1.1 Content Studio** — `AiToolsGrid.jsx` rewritten: 5 live tools
  (captions/scripts/hooks/rate_card/brief_helper), monthly quota meter, per-tool
  modal (context → generate → copy/regenerate → upgrade CTA). "Coming Soon"
  removed.
- **1.2 Pitch Assistant** — `campaign_applications.pitch` (051); `apply-campaign`
  stores it (both insert + re-activate paths, trim/slice 800); `ApplyCampaignForm`
  has "Draft with AI" (tool `pitch`) + **mandatory pitch guardrail** (blank
  rejected); brand-side `/brands/campaign/[id]` review panel shows "Their Pitch"
  (`brand-campaigns` get select gained `pitch`).
- **1.3 Match Coach** — `matchScore.js` `explainCampaignMatch(profile, campaign)`
  returns `{score, breakdown[]}` **now factoring engagement + location** (both
  previously ignored); `calculateCampaignMatchScore` delegates to it so badge +
  coach agree. `CampaignCard` match badge is clickable → "Why this match?" modal
  (breakdown bars + AI coach, tool `match_coach`).
- **1.4 Media Kit v2** — `media-kit/page.js` `AiMediaKitCard` in sidebar:
  positioning + bio + audience narrative (tool `media_kit`), one-click "Use as
  my bio" (→ `update-profile`).
- **1.5 Compliance Pre-Check** — `SubmitDeliverablesModal` gained an optional
  "AI Compliance Pre-Check": paste caption → checks brand tag / required hashtags
  / **ASCI `#ad` disclosure** / dos-donts (tool `compliance`) before the brand
  sees it.

### Mobile fast-follow (2026-07, DONE)

All five Tier 1 features ported to the RN app (parallel subagents; `tsc` 0
errors, all 153 static `t()` keys resolve). Foundation:
`src/hooks/useAiTool.ts` (rides `invokeFn` — JWT/timeout/401-retry;
`EdgeFunctionError.data.error` carries the known codes) +
`src/components/AiMarkdown.tsx` (native markdown renderer + `parseAiRates`).
Surfaces: `AIToolsGrid.tsx` (6 tools, usage meter, bottom-sheet modal,
Update-my-pricing), `ApplyCampaignForm.tsx` (Draft-with-AI + regenerate +
mandatory pitch + `pitch` in body), `matchScore.ts` (`explainCampaignMatch`
port; `calculateCampaignMatchScore` delegates) + `CampaignCard.tsx` (match %
button beside Apply → coach modal), `InfluencerMediaKit.tsx` (`AiMediaKitCard`,
labelled-Bio extraction + 500 cap), `SubmitDeliverablesModal.tsx` (collapsible
compliance pre-check). i18n merged centrally into `src/i18n/en.json`
(61 keys; note `CampaignCard.coach.remaining` uses `{{n}}` not `{{count}}` to
dodge plural-suffix lookup). Upgrade CTAs navigate to `InfluencerPricing`
(modals close first — RN Modal would cover the pricing screen).

**Parity sweep (2026-07)**: `AIToolsGrid` was ported but never MOUNTED (home
had an "AI Creator Tools removed per spec" comment) — now rendered on
`InfluencerHome` after `AiMediaKitCard`, which also brings the usage meter.
Also added for full web parity: `EditProfilePage` services-rates "Fill with
AI" (rate_card → parseAiRates, auto-selects priced services, Save persists),
mobile pricing plans' AI lines corrected to the real quotas (25/150/∞ across
all 6 plan variants in `ScreensInfluencerPricing.plans.*`), and brand-side
"Their Pitch" panel in `BrandCampaignDetail` (`pitch` on the Application type;
server already returns it). Every web AI surface now has a mobile equivalent.

**Pending**: Tier 2/3; the 1.5 "brief_checklist" tool exists web+mobile but the
brand-brief checklist isn't surfaced in the deliverables flow; apply-campaign
guardrail is mandatory-pitch only (per-day cap + fail-closed monthly cap not
yet tightened).

## Brand support / callbacks / transactions (2026-07)

- **Brand support chat**: `components/brands/BrandSupportChat.jsx` (namespace
  `BrandSupportChat`) — brand-flavoured clone of the influencer `SupportChat`
  (campaign picker via brand-campaigns list, payments/escrow/account topic
  tree, same CallbackForm inserting `support_callbacks` with
  `user_role:"brand"`). Opened from the brands Sidebar ("Chat with support")
  and a "Live chat" row inside BrandHelpAndSupport.
- **Admin Callbacks page**: `rgossips-admin /dashboard/callbacks` (Operations
  sidebar) — lists `support_callbacks` via service role (RLS is own-row only),
  requester names batch-joined from influencer/brand profiles, Open/Done tabs,
  status toggle gated by `adminGate()`.
- **Brand transactions**: `/brands/transactions` (Sidebar "Transactions") —
  `brand-campaigns` action `transactions` flattens escrow facts from
  `campaign_applications` (order/payment ids, amount paise, escrow_status,
  funded/released timestamps) + campaign title + creator name. Page shows
  totals (spent / in escrow / released) and a printable per-payment receipt
  (print-CSS isolates #receipt-print-area; explicitly labelled NOT a GST
  invoice).
- **Campaign banner crop**: CreateCampaignDialog crops every banner to 3:1
  (1536×512 JPEG) via react-easy-crop before upload; hints state recommended
  sizes. Filter sidebar "+N more" chips (categories/brands) are clickable →
  open the full filter modal. Campaigns list shows "N out of M campaigns" +
  a Show-all reset when filters are active.

**Mobile parity sweep 2 (2026-07)**: everything above ported to the RN app
(6 parallel subagents; tsc 0 errors, 523 t() keys resolve). Highlights:
campaigns list "N out of M" strip + Show all + Load-more 30 (replaced the
scroll auto-loader); brand list sort chips (match/A–Z/campaigns) + Load-more
+ clickable match badge → BrandMatchModal (`explainBrandMatch` in
matchScore.ts keeps mobile's richer tiered category logic); Applications
Closed chips on BrandCampaigns/-Detail; `crop:'banner'` (1536×512) mode in
image-picker.ts for CreateCampaignScreen; `BrandSupportChatModal` (floating
help button on BrandHome, callbacks user_role:"brand");
BrandProfile About/Website + `BrandAccountActionsModal` (deactivate/delete)
+ `BrandTransactions` screen (Share receipt, route registered in App.tsx);
signup field-level errors in LoginScreen forms; TrustSection ring → band
chip; RUDE LABS casing in consent blobs. `CampaignFilters.tsx` is dead code
(zero importers).

## Moderation gates (2026-07)

- **Brand verification**: create-profile now writes brand signups with
  `verification_status='pending'` (was auto-verified). Admin verifies from
  the brands console (existing verification controls). Unverified brands
  cannot publish campaigns — brand-campaigns `create`/`updateStatus` return
  `brand_not_verified`; web campaigns page shows an amber banner + disables
  all New-Campaign triggers (`profile.verification_status !== 'verified'`).
- **Campaign review queue**: publishing (create-with-active or draft→active)
  lands campaigns in status **`under_review`** unless the brand's
  `auto_approve_campaigns` (migration 053, admin edit-brand checkbox) is on.
  paused→active is exempt (already approved once). The creator match+notify
  fan-out fires only when a campaign actually goes active.
- **Admin approval**: campaigns table shows purple "under review" chips with
  inline Approve / Send back buttons (+ filter tab). Approve calls
  brand-campaigns action `adminApprove` — guarded by requiring the SERVICE
  ROLE key as the Bearer (admin server actions hold it; browsers don't) —
  which flips to active AND runs the same fan-out a direct publish would.
  Send back → draft. `reviewCampaign()` in admin campaigns actions.ts.
- Status chips for `under_review` exist on web brand list/detail + mobile
  BrandCampaigns/-Detail. under_review campaigns never reach influencer
  lists (Active tab matches status "Active" only).

## Offline gates (2026-07)

All three apps show a full-screen "No signal, no gossip. 📵" takeover with a
graphic + Try-again button, dismissing ONLY when connectivity actually
returns (probe-verified, plus 4s background polling):
- Web `src/components/OfflineGate.jsx` (root layout) — offline/online events
  + same-origin favicon probe ('online' is verified before dismissing).
- Admin `src/components/offline-gate.tsx` (root layout) — same, inline SVGs
  (no lucide in admin).
- Mobile `src/components/OfflineGate.tsx` (App.tsx, above the navigator) —
  no NetInfo dep: `invokeFn` emits `NETWORK_ERROR_EVENT` (DeviceEventEmitter)
  on "Network request failed"; overlay polls `SUPABASE_URL/auth/v1/health`.
Mobile moderation parity: BrandCampaigns hides the create FAB + shows an
amber banner when `profile.verification_status !== 'verified'`.

## Brand-side campaign lifecycle

Actions on `brand-campaigns` edge function:

- `list` / `get` — read. `get` also returns `matchingCount` — count of active influencers whose profile matches the campaign's target_categories + follower band + target_cities.
- `create` — insert new draft (or `active` when `status=active`). When `status='active'`, matching creators are computed and receive a `type=campaign_match` notification; the response includes `matchingCount`.
- `update` — full-row edit. **Rejected with `{ error: "has_applications", applied }` if ANY `campaign_applications` row exists**, regardless of state. Does NOT touch `status` (pause/publish still flow through `updateStatus`).
- `duplicate` — *(server action retained but currently unused; the client duplicate flow just opens the create dialog prefilled)*.
- `delete` — hard-delete. Same `has_applications` guard as update.
- `updateStatus` — flip between `draft`/`active`/`paused`/`completed`.

### Matching predicate

Shared helper `findMatchingInfluencerIds(campaign)`:

- influencer_profiles.status = 'active'
- 0-follower rows excluded (mostly un-enriched invitation stubs)
- Category overlap: at least one shared entry between `target_categories` and `influencer_profiles.categories`. Skipped if the campaign only has "General".
- Followers band: `target_follower_min <= followers_count <= target_follower_max`.
- City: fuzzy substring match against `influencer_profiles.city` (or `location` fallback). "All India" or empty city list matches everyone.
- Respects `user_preferences.privacy_prefs.publicProfile === false` (excluded).

Same predicate runs at create-time (for the notification fan-out) and at get-time (for the callout on campaign detail).

### Match callout on brand campaign detail

`/brands/campaign/[id]` renders a purple/pink/amber banner when `matchingCount > 0`: "N influencers match perfectly to your needs. They've been notified." Click routes to `/brands/search` with the campaign's criteria prefilled via URL params.

### `/brands/search` URL prefill

Supports both single-value legacy params (`?category=`, `?city=`, `?profileType=`, `?q=`) and multi-value versions used by the match callout:

- `?categories=Beauty%20%26%20Skincare,Fashion%20%26%20Lifestyle` — comma-separated, URL-encoded per entry.
- `?cities=Mumbai,Delhi` — same shape.
- `?followerMin=10000&followerMax=100000` — converted to FilterDrawer bucket labels via `bucketsForRange()`.

Multi-value wins when both single and multi are present on the same param.

Campaign detail (`/brands/campaign/[id]`) surfaces:
- **Edit** — always visible. Zero apps → opens the dialog in edit mode. Any apps → opens the "not editable" modal with Pause + Duplicate.
- **Delete** — visible only when `applications.length === 0`. Confirmation modal before deleting; server double-checks.
- **Duplicate as New** (from the not-editable modal) — opens `CreateCampaignDialog` in create mode with `initialCampaign` prefill; the title is prefixed with `"Copy of "`. Nothing hits the server until the brand actually saves in the dialog.

`CreateCampaignDialog` accepts `initialCampaign` in both `create` and `edit` modes. In edit mode the submit path calls `update`; in create mode it calls `create` — the prefill just seeds the form either way. In edit mode the footer collapses to a single "Save Changes" button (no draft/publish toggle).

## Location / cities

- Canonical list lives in [src/utils/indianCities.js](src/utils/indianCities.js) (web) and [rgossips-admin/src/lib/cities.ts](rgossips-admin/src/lib/cities.ts) (admin). Both files carry the same ~600-entry list; edit both together.
- Surfaces using it:
  - Web brand FilterDrawer Location tab (`Remote` prepended).
  - Web influencer profile edit — chip modal (`LocationModal` in `MyInformationDetail.jsx`).
  - Admin invite influencer + edit influencer + invited-row edit — `MultiSelectChips` component.
- **Storage**: `influencer_profiles.location` remains a scalar text column. Multi-select surfaces comma-join on save (`"Mumbai, Pune"`). The fuzzy substring match in `list-influencers`, brand-campaigns matcher, and `/brands/search` filter chip logic all match either direction, so a stored `"Mumbai, Pune"` matches a "Mumbai" filter and vice versa.
- Bulk-invite CSV still accepts a single-city value per row — the multi-select is an interactive-UI-only feature.

## Application negotiation flow (B15, 2026-07)

`campaign_applications.status` gained three states. Full lifecycle:

```
pending ──(brand: Approve with Price, sets brand_offered_rate)──▶ offer_sent
offer_sent ──(influencer: Accept)──▶ offer_accepted
offer_sent / pending ──(influencer: Withdraw)──▶ withdrawn
offer_accepted ──(brand: Pay to Escrow via Razorpay)──▶ approved (escrow held)
… then the pre-existing chain: submitted → accepted → live_submitted → payment → completed
```

Rules:
- **No counter-offers.** The influencer either accepts the brand's price or withdraws.
- `escrow-fund` refuses any application not in `offer_accepted`, and rejects an amount that doesn't match `brand_offered_rate`.
- `update-application-status` accepts influencer-initiated transitions (`influencerId` instead of `brandId`) only for `offer_accepted` / `withdrawn`, verified against `app.influencer_id` and the legal from-status (`INFLUENCER_TRANSITIONS` map).
- `final_agreed_rate` is stamped from `brand_offered_rate` at escrow time.
- Notifications: offer_sent → influencer; offer_accepted / withdrawn → brand. All recorded in `application_status_history` with `changed_by_role`.

Brand campaign detail (`/brands/campaign/[id]`): aside shows compact application cards (DP + name + status pill); clicking opens `ApplicationJourneyModal` — a timeline built from `application_status_history` + the full review panel (`ApplicationRow` with `alwaysExpanded`).

Influencer offers page: `offer_sent` renders `OfferResponseCard` (Accept / Withdraw with confirm); `offer_accepted` shows a "waiting for escrow" note. `STATUS_STEPS` includes Offer Received / Offer Accepted / Escrow Funded.

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

## Performance / scale notes (2026-07)

- Migration `040_perf_indexes_and_stats.sql`: composite indexes on every
  hot filter — `influencer_profiles(status, followers_count DESC)`,
  `campaigns(brand_id, created_at DESC)`, `campaigns(status)`,
  `campaign_applications(campaign_id, created_at DESC)` + `(influencer_id)`,
  `notifications(user_id, created_at DESC)` + unread partial,
  `influencer_invitations(status)`, `referrals(status)`,
  `reward_credits_ledger(reason)` — plus `get_referral_admin_stats()`
  RPC (EXECUTE revoked from PUBLIC/anon/authenticated; service-role only).
- `list-influencers` uses explicit column lists (never `select("*")` —
  it was dragging `instagram_access_token` etc. into function memory)
  and filters `deactivated/pending_deletion` in SQL. **`languages` and
  `city` are NOT columns on influencer_profiles** — selecting them
  42703s; language data only exists on invitation notes.
- Campaign matcher pushes the follower band into SQL (`gt 0` +
  `gte/lte`), served by the status+followers index.
- Admin Refer & Earn KPIs come from the stats RPC — never ship whole
  tables to a server action for aggregation.
- Upload caps: profile photos 5MB (server, upload-profile-photo +
  admin action pre-buffer check), campaign images 10MB server / 15MB
  client pre-compression source cap; web avatar picker guards 10MB
  before FileReader decode. Android picker crops to 800px so output is
  tiny.
- Load testing lives in the admin console: `/dashboard/load-test`
  (super-admin only). Fixed read-only scenario catalog, hard-capped at
  20 VUs × 20 iterations, sequential per scenario, service key stays
  server-side. Baseline 2026-07: p50 ≈ 450ms, p95 < 1s, 0 errors at 10
  concurrent per endpoint.

## Common commands

- Apply new migration: `npx supabase db push`
- Deploy one edge function: `npx supabase functions deploy <name>`
- Deploy multiple: same command, space-separated names
- **⚠️ verify_jwt landmine (2026-07): there is NO `supabase/config.toml`**, so a
  plain `functions deploy` uses the CLI default `verify_jwt = true` and
  **re-gates the function behind JWT auth on every deploy**. The app calls edge
  functions with the **publishable key** (`sb_publishable_…`, NOT a JWT) and does
  its own in-function auth, so any PUBLIC function redeployed without the flag
  starts returning `{"error":"Authentication Error"}`. **Deploy public functions
  with `--no-verify-jwt`.** Known public (must use the flag): `whatsapp-otp-sender`,
  `whatsapp-otp-verifier`, `public-media-kit`, `update-profile`, `list-influencers`
  (and most others called pre-auth / with the publishable key — when unsure, use
  the flag; a plain deploy that suddenly 401s is this). Example:
  `npx supabase functions deploy whatsapp-otp-sender --no-verify-jwt`
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
