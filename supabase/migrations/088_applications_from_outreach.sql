-- An approved outreach creator becomes a real application.
--
-- The outreach tracker ends when the quote is approved. From that point the
-- creator belongs on the campaign's application list beside everyone who
-- applied through the portal, and the ordinary application flow carries
-- them the rest of the way.
--
-- THE OBSTACLE: campaign_applications.influencer_id is a FK to
-- influencer_profiles, and most sourced creators have no account. Measured
-- when this was written: of 65 bookings, 51 are creators who have never
-- signed up. Those 51 could not have an application row at all.
--
-- THE FIX: let an application hang off an INVITATION instead. Every sourced
-- creator already has one — ensureInvitation in the admin portal creates it
-- the moment they are added, which is why all 65 bookings carry either an
-- invitation_id (51) or an influencer_id (14) and none carry neither. So the
-- application attaches to the invitation now and acquires the creator later,
-- when they sign up: the record is waiting on their profile rather than
-- having been lost because they had not joined yet.
--
-- Shape mirrors campaigns.brand_invitation_id, which has solved exactly this
-- problem on the brand side since migration 075: a row that references a real
-- account when there is one and an invitation when there is not.

-- ──────────────────────────────────────────────────────────────────
-- 1. An application may belong to an invitation instead of a profile
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.campaign_applications
  ALTER COLUMN influencer_id DROP NOT NULL;

ALTER TABLE public.campaign_applications
  ADD COLUMN IF NOT EXISTS influencer_invitation_id uuid
    REFERENCES public.influencer_invitations(id) ON DELETE SET NULL;

-- But never neither. An application has to be ABOUT somebody, and without
-- this a bad write would produce a row nothing can ever attach to.
ALTER TABLE public.campaign_applications
  DROP CONSTRAINT IF EXISTS campaign_applications_has_subject;
ALTER TABLE public.campaign_applications
  ADD CONSTRAINT campaign_applications_has_subject
  CHECK (influencer_id IS NOT NULL OR influencer_invitation_id IS NOT NULL);

-- One application per creator per campaign, the invitation-backed half of
-- the rule UNIQUE(campaign_id, influencer_id) already enforces for profiles.
-- Partial, because influencer_invitation_id is null on every portal
-- application and NULLs do not collide anyway — being explicit documents it.
CREATE UNIQUE INDEX IF NOT EXISTS campaign_applications_campaign_invitation_uniq
  ON public.campaign_applications (campaign_id, influencer_invitation_id)
  WHERE influencer_invitation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaign_applications_invitation_idx
  ON public.campaign_applications (influencer_invitation_id)
  WHERE influencer_invitation_id IS NOT NULL;

COMMENT ON COLUMN public.campaign_applications.influencer_invitation_id IS
  'Set when the application came from the outreach tracker and the creator has no account yet. The claim trigger fills influencer_id when they sign up. Null on every application made through the portal.';

-- ──────────────────────────────────────────────────────────────────
-- 2. RLS needs no change, and that is worth stating
-- ──────────────────────────────────────────────────────────────────
--
-- applications_creator_self_rw (migration 035) is USING (influencer_id =
-- auth.uid()). For an unclaimed row influencer_id is NULL, `NULL = uuid` is
-- NULL, and NULL is not true — so the row is invisible to every creator
-- until it is claimed, which is exactly right: nobody can act on it yet.
-- The moment the trigger below fills influencer_id it becomes visible to its
-- owner and to nobody else, with no policy edit.

-- ──────────────────────────────────────────────────────────────────
-- 3. Claiming an invitation now also claims its applications
-- ──────────────────────────────────────────────────────────────────
--
-- Extends link_bookings_on_invitation_claim from migration 081 rather than
-- adding a second trigger on the same table: two triggers firing on one
-- event is how an ordering bug gets written, and they answer the same
-- question — "this invitation is now a person, what else was waiting on
-- that?"
CREATE OR REPLACE FUNCTION public.link_bookings_on_invitation_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.influencer_profile_id IS NOT NULL
     AND NEW.influencer_profile_id IS DISTINCT FROM OLD.influencer_profile_id THEN
    UPDATE public.campaign_bookings
       SET influencer_id = NEW.influencer_profile_id,
           updated_at = now()
     WHERE invitation_id = NEW.id
       AND influencer_id IS NULL;

    -- Also catch bookings that were entered by hand against the same handle
    -- but never linked to this invitation row.
    UPDATE public.campaign_bookings
       SET influencer_id = NEW.influencer_profile_id,
           invitation_id = COALESCE(invitation_id, NEW.id),
           updated_at = now()
     WHERE influencer_id IS NULL
       AND NEW.instagram_username IS NOT NULL
       AND lower(instagram_username) = lower(NEW.instagram_username);

    -- NEW IN 088: the applications that were waiting on this invitation.
    --
    -- The NOT EXISTS guard matters. UNIQUE(campaign_id, influencer_id)
    -- still applies, so if this creator ALSO applied through the portal to
    -- the same campaign before signing up was linked, filling influencer_id
    -- here would raise and take the whole claim down with it — meaning a
    -- creator could not finish signing up. The invitation-backed row is
    -- left unclaimed in that case; their own application is the better
    -- record of the two, and the admin portal still shows both.
    UPDATE public.campaign_applications a
       SET influencer_id = NEW.influencer_profile_id,
           updated_at = now()
     WHERE a.influencer_invitation_id = NEW.id
       AND a.influencer_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.campaign_applications other
          WHERE other.campaign_id = a.campaign_id
            AND other.influencer_id = NEW.influencer_profile_id
       );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger itself is unchanged from 081; re-stated so this migration is
-- readable on its own.
DROP TRIGGER IF EXISTS link_bookings_on_claim ON public.influencer_invitations;
CREATE TRIGGER link_bookings_on_claim
  AFTER UPDATE ON public.influencer_invitations
  FOR EACH ROW EXECUTE FUNCTION public.link_bookings_on_invitation_claim();

-- ──────────────────────────────────────────────────────────────────
-- 4. A terminal stage for a booking whose creator has moved on
-- ──────────────────────────────────────────────────────────────────
--
-- The tracker's job now ends at the quote approval, so a booking needs a
-- state that says "finished here, the application has them". Reusing
-- `closed` would have been free but wrong: closed has meant "settled and
-- paid" since 085, and a booking that has merely been handed over has not
-- been paid anything.
--
-- The stages after the handoff (product, content, content_review, payout,
-- closed) stay in the CHECK and are NOT dropped. Three bookings are sitting
-- in them right now, and a constraint that invalidated live rows would fail
-- this migration; the portal offers those rows the same hand-over move so
-- they can finish the normal way.
ALTER TABLE public.campaign_bookings
  DROP CONSTRAINT IF EXISTS campaign_bookings_stage_check;

ALTER TABLE public.campaign_bookings
  ADD CONSTRAINT campaign_bookings_stage_check
  CHECK (stage IN (
    'proposed',
    'shortlisted',
    'outreach',
    'quote_review',
    'handed_off',
    'product',
    'content',
    'content_review',
    'payout',
    'closed',
    'dropped'
  ));

COMMENT ON COLUMN public.campaign_bookings.application_id IS
  'Set when the booking was handed over to a campaign_applications row at quote approval (migration 088). A booking with one is represented by its application and no longer counts toward campaign seats on its own.';
