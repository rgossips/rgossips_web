-- Creators were getting every application update twice.
--
-- Two senders had grown up for the same events:
--
--   1. `update-application-status` (the edge function) — JSON bodies with a
--      link, campaignId and applicationId, so the notification is clickable
--      and the client can route it.
--   2. `campaign_status_notification`, an AFTER UPDATE trigger on
--      campaign_applications calling notify_campaign_status_change() —
--      plain-string bodies, no link, writing since 2026-04.
--
-- The trigger existed in the database but in NO migration and in no repo:
-- schema drift, created by hand. Nothing referenced it, so nobody removing a
-- duplicate in the function would have found it. It fired first (roughly
-- 250ms ahead), which is why the older-looking "Application Approved! 🎉"
-- sat above "Application approved" in the list.
--
-- Overlap, status by status:
--   approved        — trigger + the function's barter notice, or its
--                     escrow-funded notice on a paid campaign
--   accepted        — trigger + the function's "Drafts accepted"
--   revision_needed — trigger + the function's "Revision requested"
--   rejected        — trigger + the function's "Application rejected"
--   payment         — trigger + escrow-release's "Payment is on the way"
--   completed       — trigger ONLY
--
-- So the function keeps every case, and `completed` was ported into its COPY
-- map in the same change. Drop the trigger, not the richer sender.
--
-- Existing duplicate rows are left alone: they are history, a creator may
-- have read them, and deleting notifications people have seen is worse than
-- a tidy table.

DROP TRIGGER IF EXISTS campaign_status_notification ON public.campaign_applications;
DROP FUNCTION IF EXISTS public.notify_campaign_status_change();

-- The diagnostic from 077-079 has done its job.
DROP FUNCTION IF EXISTS public._diag_application_triggers();
