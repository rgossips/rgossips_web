-- Persist the outcome of an admin campaign review on the campaign itself.
--
-- Before this, rejecting a campaign flipped its status to `draft` and threw
-- the reason away: it survived only in `admin_activity_log` (admin-only) and
-- inside a notification body. So the brand opened their campaign, saw a plain
-- "Draft" chip identical to one they had never submitted, and had no idea it
-- had been reviewed at all — let alone what to change. The review queue exists
-- to tell brands what to fix, and it was not doing that.
--
-- Two changes:
--
--   1. `review_reason` / `reviewed_at` — the verdict, on the row, readable by
--      the brand through the normal campaign read path.
--   2. A new `rejected` status value. `campaigns.status` is a plain text
--      column with no CHECK constraint (see 053), so this needs no constraint
--      change — but it does mean every status branch has to learn the value.
--      In particular `brand-campaigns.updateStatus` must treat rejected the
--      same as draft when the brand republishes, or a rejected campaign would
--      go straight to `active` and skip the review it just failed.
--
-- Deliberately NOT backfilled. Campaigns rejected before this shipped are
-- indistinguishable from ordinary drafts in the row — the reason for those
-- lives only in the audit log, and inventing a `rejected` status for rows we
-- cannot prove were rejected would be worse than leaving them as drafts.

alter table public.campaigns
  add column if not exists review_reason text,
  add column if not exists reviewed_at timestamptz;

comment on column public.campaigns.review_reason is
  'Admin''s reason from the most recent review decision. Set on reject, cleared on approve and when the brand resubmits — a stale reason on a live campaign reads as a current complaint.';

comment on column public.campaigns.reviewed_at is
  'When the most recent admin review decision was recorded.';

-- The brand campaigns list filters by status; `rejected` joins `under_review`
-- as a value that surfaces in its own tab.
create index if not exists campaigns_status_reviewed_idx
  on public.campaigns (status, reviewed_at desc);
