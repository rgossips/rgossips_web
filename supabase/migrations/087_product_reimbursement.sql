-- Product reimbursement: the creator buys the product themselves and the
-- brand pays them back before deliverables begin.
--
-- WHY NOT THE EXISTING FULFILMENT COLUMNS
--
-- campaign_applications already has a shipping block — shipping_address,
-- shipping_tracking_url, shipping_carrier, product_received,
-- product_received_at. That is the opposite flow: the BRAND ships to the
-- creator and the creator confirms arrival. Here the creator pays out of
-- pocket, so there is an order id, an amount, a verification by the brand
-- and a payment back. None of that fits a tracking number, and overloading
-- product_received would make the two indistinguishable in reporting — a
-- barter delivery and a self-purchase would look identical.
--
-- WHERE THE FLAG LIVES
--
-- Whether a campaign uses this is NOT a column. It rides in the campaign
-- description's metadata trailer as `include_product_reimbursement`,
-- alongside shipping_required, product_value and target_gender — the same
-- place every other campaign extra lives, so no migration is needed to add
-- one more brief field. This table holds per-application STATE, which does
-- need columns.
--
-- THE MONEY MOVES OFF-PLATFORM
--
-- Decided deliberately: the brand verifies the order and records that they
-- have reimbursed, with a reference. RGossips does not move the money.
-- RazorpayX was removed in 2026-07 and creator payouts are already manual,
-- so inventing a second automated rail here would be the odd one out. The
-- consequence is honest and worth stating: `reimbursed` means the brand
-- SAYS they paid. If that turns out to need enforcement, the escrow rail is
-- the place to add it, not this table.

alter table public.campaign_applications
  -- not_required      — campaign has no reimbursement step (the default)
  -- awaiting_purchase — approved; creator has not submitted an order yet
  -- submitted         — order id + amount in, waiting on delivery
  -- delivered         — creator confirmed the product arrived
  -- rejected          — brand disputed it; back to the creator with a reason
  -- reimbursed        — brand verified and paid; deliverables unlock
  add column if not exists reimbursement_status text
    not null default 'not_required',
  add column if not exists reimbursement_order_id text,
  -- Paise, like every other money column here (escrow_amount,
  -- quoted_fee_paise). What the CREATOR says they paid; the brand approves
  -- or rejects that figure rather than it being fixed to product_value,
  -- because real orders carry discounts and delivery charges.
  add column if not exists reimbursement_amount_paise bigint,
  add column if not exists reimbursement_submitted_at timestamptz,
  add column if not exists reimbursement_delivered_at timestamptz,
  add column if not exists reimbursement_reviewed_at timestamptz,
  add column if not exists reimbursement_reviewed_by uuid,
  -- Shown to the creator so a rejection is actionable, exactly like
  -- campaigns.review_reason and application revision notes.
  add column if not exists reimbursement_reject_reason text,
  -- Whatever the brand wants to record as proof of payment — a UPI ref, a
  -- bank UTR, "paid in cash". Free text on purpose: we are not the rail.
  add column if not exists reimbursement_reference text,
  add column if not exists reimbursement_paid_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_applications_reimbursement_status_chk'
  ) then
    alter table public.campaign_applications
      add constraint campaign_applications_reimbursement_status_chk
      check (reimbursement_status in (
        'not_required',
        'awaiting_purchase',
        'submitted',
        'delivered',
        'rejected',
        'reimbursed'
      ));
  end if;
end $$;

-- The brand's queue: "which of my applications are waiting on me to verify
-- a reimbursement". Partial, because all but a handful of rows are
-- 'not_required' and indexing those is dead weight.
create index if not exists campaign_applications_reimbursement_open_idx
  on public.campaign_applications (campaign_id, reimbursement_status)
  where reimbursement_status <> 'not_required';

comment on column public.campaign_applications.reimbursement_status is
  'Product-reimbursement sub-flow. Gates deliverable submission: while a '
  'campaign requires reimbursement, submit-deliverables refuses until this '
  'reads ''reimbursed''.';
