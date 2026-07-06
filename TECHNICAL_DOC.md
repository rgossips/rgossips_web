# RGossips — Technical Reference

Living technical spec for the influencer-marketing platform. This document is
the "how does X actually work" ground truth: architecture, flows, decisions,
formulas, gotchas. Update it whenever a rule changes; if the code and this
doc disagree, the code is authoritative — but log the drift here.

Owned surfaces: web (`rgossips.com`), admin console (`/dashboard/*`), Android
app. All three share one Supabase project (`hlfevcdtbehukxrrgykv`).

---

## 1. System architecture

### Repos

| Repo | Path | Stack | Owns |
|---|---|---|---|
| Web (main) | `d:/Development/React/RS_Gossips` | Next.js 15 App Router | Brand + Influencer web surfaces, all Supabase migrations + edge functions |
| Admin | `d:/Development/React/rgossips-admin` | Next.js 15 App Router | `/dashboard/*` operator tools |
| Android | `d:/Development/android/rsgossips_app` | React Native | Mirrors the influencer web surface |

### Backing services

- **Supabase**: Postgres 15, Storage (photos + campaign banners), Edge
  Functions (Deno), Auth. RLS on user-scoped tables (`referrals`,
  `reward_credits_ledger`, `notifications`, etc.).
- **Stripe** — subscription billing (INR-priced Products, monthly + annual).
- **Razorpay** — subscription billing (parallel path to Stripe, brand
  escrow funding, service marketplace payments).
- **Meta Graph API** — Instagram Business Login OAuth + insights.
- **WhatsApp Cloud API** — OTP delivery for signup/login (60s cooldown,
  5/hr per phone, 20/hr per IP).
- **Resend** (or equivalent, via `send-email` edge fn) — transactional email.

### Auth session model

Both web + admin use `@supabase/ssr`'s `createBrowserClient`. The default
storage key is derived from the project ref, so admin + user apps
**share the same cookie name**. When both are signed in on the same
browser origin, whichever signed in last wins; the other side sees no
session and every edge function that does an inline
`supabase.auth.getUser(token)` returns 401.

Durable fix: pass `cookieOptions.name` to each `createBrowserClient` so
the cookies are namespaced (`sb-rgossips-user` vs `sb-rgossips-admin`).
Not applied yet; the brand-side campaign detail escrow calls do explicit
`getSession()` + fail-early alerts as a stop-gap.

### Multi-device sessions

Users can be signed in on N devices simultaneously. Sessions rely on a
**stable per-user password** stored at
`auth.users.raw_app_meta_data.session_password`. Never rotate this on
each login; rotating invalidates all other-device sessions.

### Deleted user reinvite

Admin user-delete removes the `influencer_invitations` / `brand_invitations`
row instead of resetting it to `pending`. Otherwise a re-invited user
hits "you're already invited" loops.

---

## 2. Data model overview

Core tables (Postgres). Every table listed is under RLS unless noted.

### Users + profiles

- `auth.users` (Supabase native) — email/phone identity.
- `influencer_profiles` (PK: `influencer_id` = `auth.users.id`)
  Key columns: `full_name`, `username`, `instagram_handle`,
  `profile_photo_url` (Instagram), `custom_profile_photo_url` (manual upload),
  `followers_count`, `follows_count`, `media_count`, `categories text[]`,
  `subscription_plan`, `payment_gateway`, `stripe_subscription_id`,
  `razorpay_subscription_id`, `referral_code` (unique, populated after first
  paid subscription), `creator_type` ∈ `{null, meme_page, celebrity}`,
  `location`, `gender`, `languages`, `bio`, `engagement_rate`,
  `media_kit_published`, `status` ∈ `{active, deactivated, pending_deletion, …}`.
- `brand_profiles` (PK: `brand_id` = `auth.users.id`)
  Key columns: `brand_name`, `contact_email`, `contact_phone`,
  `instagram_username`, `logo_url`, `profile_photo_url`, `gstin*`,
  `verification_status`, `is_verified`.

### Campaigns

- `campaigns` (PK: `campaign_id`)
  `brand_id`, `title`, `description` (packed: body + `\n\n---\n<JSON meta>`),
  `campaign_type` ∈ `{barter, paid, hybrid}`, `target_categories text[]`,
  `max_influencers`, `campaign_start_date`, `campaign_end_date`,
  `application_deadline`, `content_types_required text[]` (strings like
  `reels:2`), `budget_total`, `budget_per_influencer`,
  `target_follower_min/max`, `target_influencer_tier`, `target_cities text[]`,
  `status` ∈ `{draft, active, paused, completed}`.

- `campaign_applications` (PK: `id`)
  `campaign_id`, `influencer_id`, `initiated_by` ∈ `{influencer, brand}`,
  `proposed_rate`, `brand_offered_rate`, `final_agreed_rate`,
  `status` ∈ `{pending, approved, submitted, revision_needed, accepted,
  live_submitted, payment, completed, rejected, withdrawn}`,
  `escrow_status` ∈ `{null, held, released, refunded}`,
  `escrow_order_id`, `escrow_payment_id`, `escrow_amount` (paise),
  `submission_links jsonb`, `rejection_reason`, `metrics jsonb`,
  `metrics_refreshed_at`.

- `campaign_ratings` (PK: `id`) — dual-role. `rater_role ∈ {brand, influencer}`,
  `target_rating` 1–5.

### Referrals + reward credits

- `referrals` — PENDING → SIGNED_UP → QUALIFIED → REWARDED
  (REVERSED / EXPIRED / MANUAL_REVIEW branches).
  `qualifying_event_id` is UNIQUE (subscription id) → double-webhook safe.
  Fraud columns: `signup_ip inet`, `device_fingerprint text`,
  `review_reason text`, `reviewed_at`, `reviewed_by uuid`.
- `reward_credits_ledger` — append-only. `delta_rc int`,
  `reason` ∈ `{REFERRAL_EARN, WELCOME_BONUS, MILESTONE_BONUS, LEADERBOARD,
  REDEMPTION, CLAWBACK, EXPIRY, ADMIN_ADJUSTMENT}`, `balance_after`,
  `unlocks_at` (welcome bonus lock), `expires_at` (90d for positive
  earns), `ref_referral_id`, `admin_id`, `note`.
- `v_reward_credits_balance` view — raw `SUM(delta_rc)` per user.
- `v_reward_credits_available_balance` view — same sum, but positive
  rows with `unlocks_at > now()` are excluded.
- `v_referral_leaderboard_monthly` view — REWARDED count + `SUM(rc)` per
  referrer for the current IST calendar month.
- `get_referral_leaderboard(top_n)` SECURITY DEFINER RPC — bypasses
  referrals RLS, returns public identity + monthly totals.
- `get_my_referral_rank()` SECURITY DEFINER RPC — the caller's rank on
  the current-month board.

### Other tables

- `notifications` — in-app inbox. Payload lives in `body::text` as JSON
  `{ text, link }`.
- `influencer_invitations`, `brand_invitations` — admin-created stubs.
  `status` ∈ `{pending, claimed, expired}`.
- `campaign_ratings`, `disputes`, `payouts`, `services`, `service_orders`,
  `quote_requests`, `leads`, `user_preferences.privacy_prefs.publicProfile`.

---

## 3. Auth + onboarding

### Signup — influencer

1. User visits `/?ref=<slug>` or `/login`.
2. Enters phone → WhatsApp OTP (rate-limited: 60s cooldown, 5/hr per phone,
   20/hr per IP).
3. On verify, Supabase creates the `auth.users` row if new; session issued.
4. Instagram Business Login OAuth — mandatory for creators. Long-lived
   token stored on `influencer_profiles.instagram_access_token`
   (encrypted at rest).
5. Signup form collects `full_name` (+ any missing metadata).
6. `create-profile` edge fn:
   - Downloads Instagram avatar → uploads to `influencer-photos` bucket
     (Instagram CDN URLs expire).
   - Upserts `influencer_profiles`.
   - Grants **50 RC welcome bonus**, locked 30 days, expires 90 days.
   - If `?ref=<slug>` present, calls `attribute-referral` (see §6).
   - Sends welcome notification + email.
   - Deletes matching `leads` row (they've graduated from prospect to user).
   - Claims any pending `influencer_invitations` matching their handle.

### Signup — brand

Same phone-OTP entry, then GSTIN capture (validated against a 3rd-party
lookup which fills `gstin_legal_name / gstin_trade_name / gstin_business_type`
into `brand_profiles`). Brand-direct-signup rows get `verification_status = verified`
by default (they've already verified GSTIN + phone).

### Session guarantees

- Fresh OTP + Instagram OAuth flow can safely be interrupted (in-place
  advance without re-OAuth).
- Role-mismatch on invitation shows a dedicated interrupt (not the
  generic "sign in instead").
- `check-profile` edge fn returns `instagram_connected: boolean` (never
  the raw token). The dashboard `InstagramRequiredGate` reads that.

---

## 4. Subscriptions

### Plans

| Plan | Monthly | Annual | Monthly-equivalent (annual) | Referral RC when someone signs up on this |
|---|---|---|---|---|
| Starter | ₹99 | ₹899 | ₹75 | 50 |
| Pro | ₹299 | ₹2,699 | ₹225 | 150 |
| Elite | ₹699 | ₹6,299 | ₹525 | 300 |

Feature matrix per plan lives in [src/lib/plans.js](src/lib/plans.js)
and [rsgossips_app/src/lib/plans.ts](rsgossips_app/src/lib/plans.ts).
Keep in sync manually.

Cold-start / trial: any user within 30 days of `created_at` and still on
`subscription_plan = trial` is treated as **Elite** by `getEffectivePlan()`
for feature-gating purposes only.

### Checkout — Stripe

1. Client → `stripe-checkout`:
   `{ userId, priceId, plan, cycle, email, origin, applyRc, planPriceRupees }`.
2. If `applyRc && planPriceRupees > 0`, the function:
   - Reads `v_reward_credits_available_balance`.
   - Computes `applied = min(available, floor(planPriceRupees × 0.5))`.
   - Creates a one-off Stripe Coupon (`amount_off = applied × 100`,
     `currency = inr`, `duration = once`, `max_redemptions = 1`).
   - Stamps `metadata.rc_applied = <applied>` on the Checkout Session.
3. Returns the Checkout URL; client redirects.
4. `stripe-webhook` on `checkout.session.completed`:
   - `setUserPlan(userId, plan, {stripe_customer_id, stripe_subscription_id, payment_gateway: 'stripe'})`.
   - `ensureReferralCode()` — generates the user's own share slug if
     they don't have one yet.
   - `qualifyReferralIfEligible()` — if they were referred, mark the
     referral REWARDED and credit the referrer (see §6).
   - If `metadata.rc_applied > 0`: insert `REDEMPTION` ledger row
     (idempotent via note-based sub_id lookup).

### Checkout — Razorpay

Same shape. Ad-hoc discount uses Razorpay's Offers API (`payment_method: card`,
`discount_amount`, 24h validity). Requires Offers to be enabled on the
account; if create fails, checkout still completes without RC applied
(logged, `rc_applied` stays 0).

### Both webhooks — `clawBackReferral(sub_id)` on refund events

7-day claw-back window from REWARDED timestamp. Inserts negative
`CLAWBACK` ledger row + fires the "RC reclaimed" notification + email.

---

## 5. Trust score (brand-side)

CIBIL-style 300–900. Computed in [src/lib/brandProfile.js](src/lib/brandProfile.js).

### Pillars

| Pillar | Weight | Signal |
|---|---|---|
| Influencer reviews | 30% | Ratings from campaign_ratings (creator side) |
| Campaign execution | 25% | `finalAccepted / (finalAccepted + abandonedAfterApproval)` |
| Verification & identity | 20% | email verified, phone verified, PAN valid, GSTIN valid |
| Communication | 15% | Response-time SLAs + feedback richness |
| Platform engagement | 10% | Profile completeness + activity recency |

### Formula

```
overall100 = Σ (pillar_percent × pillar_weight)   // in [0, 100]
raw_score  = 300 + (overall100 / 100) × 600       // in [300, 900]
score      = clamp(raw_score − penaltyPoints, 300, 900)

if (finalAcceptedCount < 3):
    score = min(score, 720)   // cold-start cap
```

`penaltyPoints` is capped at 400 before subtraction.

### Bands (renamed 2026-07)

| Score | Label |
|---|---|
| 800–900 | Elite |
| 740–799 | Trusted |
| 670–739 | Established |
| 580–669 | Emerging |
| 300–579 | Building Trust |

Non-punitive language: a new brand landing at ~350 doesn't get told
they're "Poor". Same score cutoffs.

### Rendered where

- `BrandHero.jsx` — top ring on brand dashboard.
- `BrandCard.jsx` — pill on brand-side influencer directory.
- `TrustSection.jsx` — brand-facing detailed breakdown.
- `TrustScoreInfoModal.jsx` — "how this is calculated" panel.

---

## 6. Refer & Earn

Three phases shipped. Applies only to influencers.

### Phase 0 — locked decisions

1. Referral code = base62 slug, ~8 chars, unique on `influencer_profiles`.
2. Populated only after first successful subscription payment
   (`ensureReferralCode` in webhook).
3. Unused-code TTL = 30 days from creation (`expire_pending_referrals` cron).
4. Anti-fraud cap = max 5 QUALIFIED referrals per rolling 24h per referrer.
5. All three plan tiers qualify.
6. Clawback window = 7 days from REWARDED.
7. Referrer must have an ACTIVE (non-trial) subscription at the moment
   of QUALIFIED — strict. Otherwise referral flips to REVERSED, referee
   still gets their 50% welcome discount.
8. RC redemption capped at `floor(plan_price × 0.5)` per invoice.
9. RC survives cancellation.
10. Admin can grant/deduct RC via `/dashboard/referrals` — same 90d
    expiry + 50% cap as earned RC.

### Reward table (referee's first plan → RC to referrer)

| Referee plan | RC |
|---|---|
| Starter | 50 |
| Pro | 150 |
| Elite | 300 |

### State machine — `referrals.status`

```
                     ┌──── EXPIRED  (>30d unused, cron)
                     │
     PENDING ── ref clicked in ─▶ SIGNED_UP
        │              signup                │
        │                                    │  first paid sub
        │                                    ▼
        │                              (webhook)
        │                                    │
        │                                    ├─ referrer inactive → REVERSED
        │                                    ├─ daily cap hit     → MANUAL_REVIEW
        │                                    │  (admin approves → REWARDED
        │                                    │   or rejects → REVERSED)
        │                                    ▼
        │                                 REWARDED
        │                                    │
        │                                    │  refund within 7d
        │                                    ▼
        │                                 REVERSED
```

`qualifying_event_id` (subscription id) is UNIQUE on `referrals`, so a
re-delivered webhook can't double-credit.

### Ledger accounting

Every wallet change is one row in `reward_credits_ledger` with signed
`delta_rc`. Rows are never mutated. Balance is `SUM(delta_rc)`:

- **`v_reward_credits_balance`**: total. Marketing display only.
- **`v_reward_credits_available_balance`**: excludes positive rows whose
  `unlocks_at > NOW()`. This is the only figure `redeem-rc` will spend.

### Welcome bonus

`create-profile` inserts on every new influencer:

```
delta_rc      = 50
reason        = WELCOME_BONUS
unlocks_at    = now() + 30 days
expires_at    = now() + 90 days
```

Idempotent (skips if a WELCOME_BONUS row already exists for that user).

### Redemption (`redeem-rc`)

```
applied = min(available_balance, floor(planPriceRupees × 0.5))
```

Reasons in response: `no_balance`, `cap_zero`, `applied`, `dry_run`.
The subscription checkout flows inline the same math + write the
REDEMPTION row from the webhook (not `redeem-rc`).

### Fraud attribution

`attribute-referral` captures `signup_ip` + `device_fingerprint`
(client-side hash of UA + timezone + language + screen dimensions).
Two auto-flags:

| Flag | Trigger | Effect |
|---|---|---|
| `duplicate_device_fp` | Referrer already has ≥1 referral with the same fingerprint | Row created as MANUAL_REVIEW |
| `duplicate_signup_ip` | Referrer already has ≥3 referrals from the same IP | Row created as MANUAL_REVIEW |

Admin `/dashboard/referrals` shows the flag + IP + fingerprint inline
on MANUAL_REVIEW rows, with Approve / Reject buttons.

### Notifications

Fired on both in-app inbox and branded email (via `_shared/email.ts`):

- SIGNED_UP → "A friend just signed up" (only for non-MANUAL_REVIEW).
- REFERRAL_EARN → "You earned N RC".
- CLAWBACK → "N RC reclaimed".

### Leaderboard

`get_referral_leaderboard(top_n=10)` — top N referrers this IST month by
`(rc_earned DESC, rewarded_count DESC)`. Rendered on
`/influencer/refer` and mobile ReferScreen with a "You: #N" chip via
`get_my_referral_rank()`.

---

## 7. Campaigns lifecycle (brand-side)

### States

`draft → active → paused ↔ active → completed`.

`completed` terminal; brand can duplicate as a new draft.

### Actions on `brand-campaigns` edge fn

| Action | Guard |
|---|---|
| `list` | Ownership by `brand_id` |
| `get` | Ownership |
| `create` | Ownership |
| `update` | Ownership + **zero applications** (rejected with `{ error: "has_applications", applied }`) |
| `delete` | Ownership + **zero applications** |
| `updateStatus` | Ownership + valid status transition |
| `duplicate` | *(server action retained; client currently prefills the create dialog instead of round-tripping)* |

### Brand UI

- **Edit** button on campaign detail — zero apps opens the dialog,
  else opens a "not editable" modal with Pause + Duplicate.
- **Delete** button — visible only when `applications.length === 0`;
  confirmation modal; server double-checks.
- **Duplicate as New** (from not-editable modal) — opens
  `CreateCampaignDialog` in create mode with `initialCampaign` prefill;
  title prefixed with `"Copy of "`. Nothing hits the server until the
  brand actually saves.

### Description packing

The extended audit fields (product name, do's, don'ts, hashtags, usage
rights, keepup duration, exclusivity, payment timeline, target gender,
target languages, min engagement rate, banner, gallery) aren't columns —
they're serialized as a JSON blob appended to `description` after a
`\n\n---\n` separator. `unpackDescription()` splits body from meta on
read.

---

## 8. Campaign discovery (influencer-side)

`list-campaigns` edge fn returns a computed shape per campaign:

- `isExpired`: `campaign_end_date` (with `application_deadline` as
  fallback) < now.
- `applicationDeadlinePassed`: `application_deadline` < now, in
  isolation. New in 2026-07 to catch campaigns where applications
  closed but the overall campaign is still ongoing.

### Visibility rule

Hide row when `(isExpired || applicationDeadlinePassed) && !applicationStatus`.

Rows the influencer has already applied to (`applicationStatus` set) are
kept regardless, so Applied / Completed tabs stay populated.

### Match score

Client-side, per campaign (via `calculateCampaignMatchScore(profile, c)`):

- Category overlap: number of shared categories between influencer's
  `categories[]` and campaign's `target_categories[]`.
- Follower fit: 1 if `targetFollowerMin ≤ followers ≤ targetFollowerMax`,
  else 0.
- Tier match.
- Location match.
- Engagement floor (`min_engagement_rate`).

Weights and formula in [src/lib/campaignMatch.js](src/lib/campaignMatch.js).

---

## 9. Applications + escrow

### Influencer applies

1. `submit-application` (or brand-initiated invite) creates a row with
   `status = pending`, `proposed_rate` from the influencer.

### Brand approves + funds escrow

1. Brand enters `agreed_rate` on the application row on campaign detail.
2. Click **Approve & Pay**:
   - Client calls `escrow-fund` with `{ applicationId, agreedRate }`
     and an explicit `Authorization: Bearer <session.access_token>`
     (guarded by an inline `getSession()` check — see §1 cookie
     collision).
   - `escrow-fund` verifies ownership, creates a Razorpay Order for
     `agreedRate * 100 paise`, returns `{order_id, key_id, amount_paise}`.
   - Client opens Razorpay Checkout against the order.
   - On Checkout success, client calls `update-application-status` with
     `{ escrowOrderId, escrowPaymentId, escrowSignature, agreedRate }`.
   - The status function verifies the Razorpay signature server-side
     (HMAC over `orderId|paymentId`), flips application to
     `status = approved`, `escrow_status = held`, stores payment ids +
     amount.
3. Idempotent: if the row is already `held`, `escrow-fund` returns the
   existing order id.

### Content submission

- Influencer submits links (reel URL, story URL, etc.) → status
  `submitted`. Metrics scraped and stored in `metrics` JSON.
- Brand can accept (→ `accepted`) or request revision (→ `revision_needed`
  with `rejection_reason`).

### Live submission

- Once posted live, influencer flips to `live_submitted`.
- Brand verifies + clicks **Accept & Release Payment**.

### Release payment

- Client calls `escrow-release` with `{ applicationId }` (same session
  guard).
- `escrow-release`:
  - Verifies signature + ownership.
  - Flips `status = payment` (brand-facing "Completed" label), then
    `completed` after admin reconciliation.
  - Fires notifications to creator ("Payment released").
  - Fires "please rate the brand" email to the creator.
  - Records payout intent for the manual payout queue at
    `/dashboard/payouts`.

### Escrow states

`null` (no funds committed yet) → `held` (funds captured, not paid out)
→ `released` (paid out to creator) OR `refunded` (returned to brand
after mutual cancellation).

---

## 10. Payments summary

### Money in — subscriptions (recurring)

Both Stripe and Razorpay handle influencer subscriptions. Users pick
gateway per-checkout; the winner sets `payment_gateway` on the profile
row and the other gateway's ids are nulled so a stale cancel-webhook
can't downgrade the user.

### Money in — escrow (one-off)

Razorpay Payments API only (no Stripe path). Brand funds each application
individually via `escrow-fund`.

### Money in — service marketplace

`service-payment-checkout` + `razorpay-service-checkout` +
`stripe-checkout` (with `metadata.kind = "service_payment"`). Handled
by the same webhook, branching on `metadata.kind`.

### Money out — payouts

**Manual only** as of 2026-07 (RazorpayX pipeline removed). Admin sees
pending payouts at `/dashboard/payouts`, marks each as paid after
transferring via UPI/bank.

---

## 11. Instagram integration

### OAuth

Meta Business Login. Callback URL is a Next.js route handler that
exchanges the short-lived code for a long-lived token, stores it on
`influencer_profiles.instagram_access_token`, sets
`instagram_token_expires_at`.

### Refresh

`refresh-instagram` edge fn is invoked in two places:
- Post-signup (fire-and-forget in `create-profile`)
- User-triggered from the InstagramReconnectBanner when a request 401s.

### Metrics quirk

`GET /me/insights?metric=reach&metric_type=time_series&period=days_28`
returns real 28-day rolling reach.

`GET /me/insights?metric=reach&period=days_28` (no `metric_type`) silently
downgrades to 1-day reach for Creator accounts. Use `time_series`.

Views / interactions / engagement follow their own quirks and are
documented in the fetcher (`_shared/instagram.ts`).

---

## 12. OTP + notifications

### OTP send

`send-otp` edge fn:
- Rate limits: 60s cooldown per phone; 5 sends per hour per phone; 20
  sends per hour per IP.
- Persists a `verifier` cookie/local row; verify checks that.
- Delivery via WhatsApp Cloud API.

### In-app notifications

`notifications` table. Client polls / subscribes for the current user's
rows. Body is `JSON.stringify({ text, link })` so consumers can render
either raw text or the CTA button.

### Email

`send-email` edge fn wraps whatever ESP is configured. `_shared/email.ts`
provides a branded template (`renderEmailHtml` + `sendBrandedEmail`)
used by every referral event + admin manual-approve + welcome flow.

---

## 13. Search + filter (brand-side find creators)

**Server-side pagination** as of 2026-07.

### `list-influencers` accepts

```
{
  limit: 50,                  // default 50, hard cap 2000
  offset: 0,
  q: "",                      // free text across name/username/handle
  filters: {
    categories: string[],
    followerBuckets: string[],// includes Creator Type synonyms
    locations: string[],
    genders: string[],
    profileTypes: string[],   // 'meme_page' | 'celebrity'
    languages: string[]
  },
  sort: 'followers_desc' | 'followers_asc' | 'alpha'
}
```

Returns `{ influencers, total, limit, offset }`. `total` is the count
**after filters**, not the raw directory size.

### `/brands/search` client

- Debounces search input (300ms).
- Fetches the first 50 on any change to search / filters / sort.
- **Load more** button appends 50-row batches.
- Stale-response guard via a monotonic `reqRef` counter so a slow
  earlier request can't overwrite newer results.
- Filter Drawer's "Apply Filters (N)" count is a live server dry-run
  (debounced 250ms).

### Hidden rows

- `influencer_profiles.status ∈ {deactivated, pending_deletion}` — hidden.
- `user_preferences.privacy_prefs.publicProfile === false` — hidden.
- Their invitation stubs (same instagram handle) are also filtered from
  the invites branch so hiding a registered profile doesn't accidentally
  reveal the pre-signup stub.

### Photo URL fallback

`custom_profile_photo_url || profile_photo_url || ""`. This coalesce
lives in `list-influencers` AND `brand-campaigns.get` (which was fixed
in 2026-07 after the campaign detail page showed the wrong photo).
Any new edge function that joins `influencer_profiles` and returns a
photo must mirror the same coalesce.

---

## 14. Media kit

- Templates in `plans.js` `MEDIA_KIT_TEMPLATES`. Access per plan:
  Starter = Classic only; Pro = Classic + Glass Blue + Editorial Noir
  (capped at 3 lifetime template switches); Elite = all 5, unlimited
  switches.
- `MEDIA_KIT_TEMPLATE_CHANGE_LIMITS` = `{Starter: 0, Pro: 3, Elite: ∞}`.
- Published kits are readable via a public `/mediakit/[handle]` route
  that pulls the profile row via a service-role edge fn.
- OG meta tags on the public kit URL are set server-side so LinkedIn /
  X / WhatsApp preview cards render correctly.

---

## 15. Admin functions

### Sidebar (grouped)

- Overview — Dashboard.
- Influencers — Influencers, Featured Creators, Creator Stories, Refer & Earn.
- Brands — Brands, Featured Brands, Campaigns, Featured Campaigns, Plan Your Stay.
- Operations — Disputes, Payouts, Services, Quote Requests, Leads.
- Admin Panel (super-admin only) — Admin Users.

### RC adjust

`/dashboard/referrals` → Adjust RC form.
- `MAX_ABS_DELTA = 10_000`.
- Positive grants get 90d `expires_at`; deductions get no expiry.
- Deducts can't drive the wallet negative.
- Note is required (audit trail).
- `admin_id` stamped on the ledger row.

### Manual review queue

Rows with `status = MANUAL_REVIEW` land in the top filter. Approve
flips to REWARDED + credits the referrer (fires notification + email).
Reject flips to REVERSED. Both stamp `reviewed_at + reviewed_by`.

### Analytics on `/dashboard/referrals`

Two extra KPI strips:

**Funnel**
- Signup → rewarded % = `REWARDED / (SIGNED_UP + QUALIFIED + REWARDED + MANUAL_REVIEW)`.
- Clawback % = `REVERSED / (REWARDED + REVERSED)`.
- Reversed count (all time).
- Signups (all time).

**RC cost**
- Earned (referrals).
- Granted (welcome).
- Granted (admin).
- Redeemed.
- Clawed back.
- Outstanding = `earned + welcome + admin − redeemed − clawback − expiry`.

---

## 16. Formulas cheat sheet

Everything spendable-money-touching. Keep this section immediately in
sync when any rule changes.

### RC — earn (referral)

```
rc = REWARD_BY_PLAN[referee_first_plan]     // 50 / 150 / 300
expires_at = now + 90d
```

### RC — welcome bonus

```
rc = 50
unlocks_at = now + 30d
expires_at = now + 90d
```

### RC — redemption cap

```
applied = min(available_balance, floor(plan_price_rupees × 0.5))
invoice_discount_paise = applied × 100
```

### RC — clawback

```
delta_rc = -original_reward_rc
if now - rewarded_at > 7d: NO-OP
```

### RC — expiry (nightly cron at 21:45 UTC = 03:15 IST)

```
for each earn row with expires_at < now and no matching EXPIRY row:
    if wallet_balance > 0:
        insert EXPIRY row with delta = -min(earn_rc, wallet_balance)
```

### Trust score

```
score = clamp(300 + (Σ pillar_percent × pillar_weight) / 100 × 600 − penaltyPoints, 300, 900)
if finalAcceptedCount < 3: score = min(score, 720)
```

### Match score (campaign fit, client-side)

```
score = (
  categoryOverlap × W_CAT
  + followerFit    × W_FOLLOWERS
  + tierMatch      × W_TIER
  + locationMatch  × W_LOCATION
  + engagementMet  × W_ENGAGEMENT
) × 100
```

Weights defined in `src/lib/campaignMatch.js`.

### Referral daily cap check

```
rewardedLast24h = count(referrals WHERE referrer_id = X
                                   AND status = 'REWARDED'
                                   AND rewarded_at >= now - 24h)
if rewardedLast24h >= 5: this row → MANUAL_REVIEW
```

### Referrer active-subscription check (strict)

```
active =
    profile.subscription_plan
 && profile.subscription_plan != 'trial'
 && (profile.stripe_subscription_id || profile.razorpay_subscription_id)
```

### Match at influencer signup — referral attribution

`attribute-referral` guards, in order:
1. code exists on some influencer_profile
2. code ≠ own uid (self-referral rejected)
3. referrer is currently subscribed (strict, above)
4. referee not already attributed
5. duplicate-device fingerprint under same referrer → MANUAL_REVIEW
6. ≥3 same-IP referrals under same referrer → MANUAL_REVIEW

If all pass → row created as `SIGNED_UP`.

---

## 17. Edge-function inventory

| Function | Verify-JWT | Purpose |
|---|---|---|
| `create-profile` | yes | Signup finalizer (welcome RC, referral hookup, notifications, email) |
| `check-profile` | yes | Returns `instagram_connected: boolean` (never the token) |
| `update-profile` | yes | Field-level profile edits (photos, contact, categories, gender, etc.) |
| `upload-profile-photo` | yes | Multipart → Storage `influencer-photos/{userId}.jpg`; sets `custom_profile_photo_url` |
| `upload-campaign-image` | yes | Multipart → `campaign-images/{banners,gallery}` |
| `refresh-instagram` | yes | Pull latest Instagram metrics + token refresh |
| `send-otp` / `verify-otp` | no | Rate-limited OTP send + verify |
| `send-email` | no | Thin wrapper around ESP |
| `list-influencers` | yes | Brand-side directory with server-side filter + pagination |
| `list-campaigns` | yes | Influencer-side directory with isExpired + applicationDeadlinePassed hiding |
| `brand-campaigns` | yes | Brand-side CRUD (list, get, create, update, delete, duplicate, updateStatus) |
| `submit-application` | yes | Influencer applies to a campaign |
| `update-application-status` | yes | Brand approves / rejects / requests revision |
| `escrow-fund` | no (own auth check) | Creates Razorpay Order for the agreed rate |
| `escrow-release` | no (own auth check) | Marks payout intent + notifications |
| `stripe-checkout` / `stripe-webhook` | yes / no | Subscription + escrow flows |
| `razorpay-checkout` / `razorpay-webhook` | yes / no | Same, Razorpay |
| `attribute-referral` | yes | Writes SIGNED_UP referral row + fraud flags + notification + email |
| `redeem-rc` | yes | Available-balance check + REDEMPTION row + dry-run mode |
| `send-account-event-email` | yes | Transactional emails for auth events |
| `service-payment-checkout` | yes | Service marketplace one-off checkout |
| `quote-request` | yes | Brand submits a quote request |
| `resolve-shortlink` | no | Public shortlink → target |
| _shared/referrals.ts | — | ensureReferralCode, qualifyReferralIfEligible, clawBackReferral |
| _shared/email.ts | — | renderEmailHtml, sendBrandedEmail |

`_shared/*.ts` is a Deno convention — bundled by every function that
imports it, not deployed as its own function.

---

## 18. Migrations register

| # | Name | What it does |
|---|---|---|
| 036 | referrals_core | `referrals` + `reward_credits_ledger` + view + nightly cron |
| 037 | influencer_creator_type | `creator_type` column + partial index |
| 038 | refer_earn_phase2 | `unlocks_at`, WELCOME_BONUS reason, available-balance view, fraud columns |
| 039 | referrals_leaderboard | Monthly view + 2 SECURITY DEFINER RPCs |

Baseline (001–035) covers auth, profiles, campaigns, applications,
escrow, notifications, invitations, disputes, services, subscription
tracking, preferences.

---

## 19. Common commands

```bash
# Apply pending migrations to remote
npx supabase db push

# Deploy one edge function
npx supabase functions deploy <name>

# Deploy multiple
npx supabase functions deploy stripe-checkout razorpay-checkout brand-campaigns

# Directly query the DB (from web repo root; SUPA_KEY in .env.local)
curl -sS "$SUPA_URL/rest/v1/<table>?<filter>&select=..." \
  -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY"

# Sanity check a specific migration was applied
curl -sS "$SUPA_URL/rest/v1/rpc/get_referral_leaderboard?top_n=1" \
  -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY" \
  -H "Content-Type: application/json" -X POST -d '{}'
```

---

## 20. Common gotchas

1. **Photo URL fallback** must live in every edge function that joins
   `influencer_profiles` and returns a photo. Two sites do it correctly
   (`list-influencers`, `brand-campaigns.get`); any new one is a
   regression waiting to happen.

2. **CreateCampaignDialog + Radix**: both `Dialog` and `Drawer` variants
   need their own `Title`/`Description` descendants — a shared `<h2>`
   fires an a11y warning on desktop.

3. **`supabase.functions.invoke` falls back to publishable-key Bearer**
   when there's no session. Any edge function that does inline
   `auth.getUser(token)` will 401 in that case. Always precede such
   calls with an explicit `getSession()` check + pass the access_token
   as an explicit `Authorization` header.

4. **Admin + user share a cookie name** by default (same project ref).
   Signing in on one signs out the other until we ship the
   `cookieOptions.name` fix in both apps.

5. **Description packing** — the `\n\n---\n<JSON>` blob at the tail of
   `campaigns.description` carries a lot of state. When you add a
   field, update `pickExtras()` server-side AND the client's
   `campaignToForm()` prefill helper AND `list-campaigns` unpacking.

6. **Stable session password** — never rotate on login. All multi-device
   sign-ins break the moment you do.

7. **28-day Instagram reach** — must use `metric_type=time_series`; the
   default silently downgrades to 1-day on Creator accounts.

8. **Referral qualifying_event_id UNIQUE** — that's what makes the
   webhook idempotent. Never bypass it in a manual DB fix; add a
   guard column instead.

9. **`applicationDeadlinePassed` vs `isExpired`** — a campaign whose
   applications closed yesterday but whose end date is next month is
   `applicationDeadlinePassed && !isExpired`. `list-campaigns` hides
   the row from the Active tab based on either flag.

10. **List-influencers pagination** — default limit is 50. Callers that
    filter/sort the whole directory locally (`PocketFriendlyCreators`,
    other carousels) must explicitly pass `limit: 2000`.
