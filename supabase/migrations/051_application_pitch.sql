-- The creator's application pitch ("Why choose you"). The apply form already
-- collected this but silently dropped it on submit — there was no column. Now
-- it's stored + shown to the brand, and draftable via the AI Pitch Assistant.
alter table public.campaign_applications
  add column if not exists pitch text;
