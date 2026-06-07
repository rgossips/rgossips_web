-- One-time backfill: UPI rows registered before the validation-strategy
-- change were left in 'pending' because Razorpay's bank-account
-- validation API doesn't accept VPA fund accounts. New code accepts UPI
-- on the syntax check alone; reflect that for any pre-existing rows so
-- they show "Verified" in the UI instead of being stuck "Verifying…".
UPDATE public.payment_methods
   SET validation_status = 'success',
       validated_at = COALESCE(validated_at, now())
 WHERE type = 'upi'
   AND validation_status = 'pending'
   AND razorpay_fund_account_id IS NOT NULL;
