-- Rework campaign_ratings:
--   • drop the old "journey" axis (it was confusing — both sides are now
--     rating the campaign collaboration, not the platform experience).
--   • add two influencer-only sub-scores about the brand's behaviour:
--       brief_clarity — was the brief clear and detailed?
--       fairness     — were revisions and rejections reasonable?
--   Both new columns are nullable so brand-side rows (which only carry
--   target_rating) remain valid.

alter table public.campaign_ratings
  drop column if exists journey_rating;

alter table public.campaign_ratings
  add column if not exists brief_clarity int check (brief_clarity between 1 and 5),
  add column if not exists fairness int check (fairness between 1 and 5);
