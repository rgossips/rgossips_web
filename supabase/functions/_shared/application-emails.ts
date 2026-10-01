// Email on every application status change — to whoever DIDN'T cause it.
//
// The in-app notification already goes out on both sides (a creator gets the
// app_* family, the brand gets one when the change came from outside), but
// notifications only land if you open the app. A status change is the one
// thing in this product both parties are actively waiting on, so it earns an
// email; and the party who just clicked the button doesn't need telling.
//
//   brand acted      → the creator hears
//   creator acted    → the brand hears
//   an admin acted   → BOTH hear, because neither of them did it
//
// One catalogue, two perspectives per status, so the wording can't drift
// between "your application" and "their application". Everything here is
// best-effort: sendBrandedEmail already swallows its own failures, and no
// caller should let a mail problem fail a committed status change.
//
// Kept in step with:
//   - update-application-status/index.ts  (brand + creator actions)
//   - the admin portal's updateApplicationStatus() in
//     src/app/dashboard/campaigns/actions.ts (admin actions, which mirrors
//     this catalogue in TypeScript because it cannot import Deno modules)

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrandedEmail } from "./email.ts";

export type Actor = "brand" | "influencer" | "admin";

type Copy = {
  subject: string;
  title: string;
  body: string; // HTML
  ctaLabel: string;
};

type Vars = {
  campaignTitle: string;
  campaignId: string;
  creatorName: string;
  brandName: string;
  amountInr?: number | null;
  reason?: string | null;
};

const money = (n?: number | null) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "");

// Statuses worth an email. Anything absent is silent on purpose:
//   pending        — the application being created, handled at apply time
//   payment        — escrow-release owns that mail, with payout detail we
//                    don't have here
const TO_CREATOR: Record<string, (v: Vars) => Copy> = {
  offer_sent: (v) => ({
    subject: `${v.brandName} offered you ${money(v.amountInr) || "a collaboration"} for "${v.campaignTitle}"`,
    title: "You have an offer",
    body: `<p><strong>${v.brandName}</strong> has offered you ${money(v.amountInr) || "a collaboration"} for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Accept it in the app to lock the deal in. Offers don't last forever — brands move on to other creators.</p>`,
    ctaLabel: "View the offer",
  }),
  approved: (v) => ({
    subject: `You're approved for "${v.campaignTitle}"`,
    title: "You're in",
    body: `<p><strong>${v.brandName}</strong> approved your application for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Read the brief once more, then start creating. Submit your draft in the app when it's ready.</p>`,
    ctaLabel: "Open the campaign",
  }),
  revision_needed: (v) => ({
    subject: `${v.brandName} asked for changes to "${v.campaignTitle}"`,
    title: "Changes requested",
    body: `<p><strong>${v.brandName}</strong> has asked for changes to your submission for "<strong>${v.campaignTitle}</strong>".</p>
           ${v.reason ? `<p style="background:#F8F7FB;border-radius:12px;padding:14px;"><em>${v.reason}</em></p>` : ""}
           <p>Make the edits and resubmit in the app — nothing is lost.</p>`,
    ctaLabel: "See what's needed",
  }),
  accepted: (v) => ({
    subject: `Your work for "${v.campaignTitle}" was accepted`,
    title: "Accepted",
    body: `<p><strong>${v.brandName}</strong> accepted your submission for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Post it live and add the link in the app — that's the last step.</p>`,
    ctaLabel: "Add your live link",
  }),
  completed: (v) => ({
    subject: `"${v.campaignTitle}" is complete`,
    title: "That's a wrap",
    body: `<p><strong>${v.brandName}</strong> has marked your work on "<strong>${v.campaignTitle}</strong>" as complete. Nice one.</p>`,
    ctaLabel: "View the campaign",
  }),
  rejected: (v) => ({
    subject: `Your application for "${v.campaignTitle}" wasn't accepted`,
    title: "Not this time",
    body: `<p><strong>${v.brandName}</strong> didn't take your application for "<strong>${v.campaignTitle}</strong>" forward.</p>
           ${v.reason ? `<p style="background:#F8F7FB;border-radius:12px;padding:14px;"><em>${v.reason}</em></p>` : ""}
           <p>It happens to every creator. There are other campaigns open right now.</p>`,
    ctaLabel: "Browse campaigns",
  }),
};

const TO_BRAND: Record<string, (v: Vars) => Copy> = {
  offer_accepted: (v) => ({
    subject: `${v.creatorName} accepted your offer for "${v.campaignTitle}"`,
    title: "Offer accepted",
    body: `<p><strong>${v.creatorName}</strong> accepted your ${money(v.amountInr) || ""} offer for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Fund the escrow in the app to get them started.</p>`,
    ctaLabel: "Open the campaign",
  }),
  withdrawn: (v) => ({
    subject: `${v.creatorName} withdrew from "${v.campaignTitle}"`,
    title: "A creator withdrew",
    body: `<p><strong>${v.creatorName}</strong> has withdrawn from "<strong>${v.campaignTitle}</strong>". Their seat is free again.</p>`,
    ctaLabel: "Find another creator",
  }),
  submitted: (v) => ({
    subject: `${v.creatorName} submitted work for "${v.campaignTitle}"`,
    title: "A draft is waiting for you",
    body: `<p><strong>${v.creatorName}</strong> has submitted their draft for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Review it in the app — accept it, or ask for changes with a note.</p>`,
    ctaLabel: "Review the draft",
  }),
  live_submitted: (v) => ({
    subject: `${v.creatorName} posted their content for "${v.campaignTitle}"`,
    title: "It's live",
    body: `<p><strong>${v.creatorName}</strong> has added the live link for "<strong>${v.campaignTitle}</strong>".</p>
           <p>Check it, then mark the application complete.</p>`,
    ctaLabel: "See the post",
  }),
  // Admin-initiated versions of the brand-side decisions: the brand didn't
  // press the button, so it needs telling too.
  approved: (v) => ({
    subject: `${v.creatorName} was approved for "${v.campaignTitle}"`,
    title: "An application was approved",
    body: `<p><strong>${v.creatorName}</strong> has been approved for "<strong>${v.campaignTitle}</strong>" by the RGossips team.</p>`,
    ctaLabel: "Open the campaign",
  }),
  rejected: (v) => ({
    subject: `${v.creatorName}'s application for "${v.campaignTitle}" was declined`,
    title: "An application was declined",
    body: `<p><strong>${v.creatorName}</strong>'s application for "<strong>${v.campaignTitle}</strong>" was declined by the RGossips team.</p>
           ${v.reason ? `<p style="background:#F8F7FB;border-radius:12px;padding:14px;"><em>${v.reason}</em></p>` : ""}`,
    ctaLabel: "Open the campaign",
  }),
  accepted: (v) => ({
    subject: `${v.creatorName}'s work for "${v.campaignTitle}" was accepted`,
    title: "Work accepted",
    body: `<p><strong>${v.creatorName}</strong>'s submission for "<strong>${v.campaignTitle}</strong>" was accepted by the RGossips team.</p>`,
    ctaLabel: "Open the campaign",
  }),
  revision_needed: (v) => ({
    subject: `Changes were requested from ${v.creatorName} for "${v.campaignTitle}"`,
    title: "Changes requested",
    body: `<p>The RGossips team asked <strong>${v.creatorName}</strong> for changes to their submission for "<strong>${v.campaignTitle}</strong>".</p>
           ${v.reason ? `<p style="background:#F8F7FB;border-radius:12px;padding:14px;"><em>${v.reason}</em></p>` : ""}`,
    ctaLabel: "Open the campaign",
  }),
  completed: (v) => ({
    subject: `"${v.campaignTitle}" was marked complete for ${v.creatorName}`,
    title: "Application completed",
    body: `<p><strong>${v.creatorName}</strong>'s work on "<strong>${v.campaignTitle}</strong>" was marked complete.</p>`,
    ctaLabel: "Open the campaign",
  }),
};

// Who should hear about this change. The actor never emails themselves.
function recipients(actor: Actor): ("creator" | "brand")[] {
  if (actor === "brand") return ["creator"];
  if (actor === "influencer") return ["brand"];
  return ["creator", "brand"];
}

export async function sendApplicationStatusEmails(
  admin: SupabaseClient,
  opts: {
    actor: Actor;
    status: string;
    applicationId: string;
    campaignId: string;
    creatorUserId: string;
    brandUserId: string | null;
    campaignTitle: string;
    creatorName: string;
    brandName: string;
    amountInr?: number | null;
    reason?: string | null;
    // Set when the caller has already emailed that side about this same
    // change with better copy — a funded approval, for instance, is emailed
    // with the escrow amount in it, and must not also get the generic one.
    skipCreator?: boolean;
    skipBrand?: boolean;
  },
): Promise<void> {
  const vars: Vars = {
    campaignTitle: opts.campaignTitle,
    campaignId: opts.campaignId,
    creatorName: opts.creatorName,
    brandName: opts.brandName,
    amountInr: opts.amountInr ?? null,
    reason: opts.reason ?? null,
  };

  for (const side of recipients(opts.actor)) {
    if (side === "creator" && opts.skipCreator) continue;
    if (side === "brand" && opts.skipBrand) continue;
    const copy = side === "creator" ? TO_CREATOR[opts.status]?.(vars) : TO_BRAND[opts.status]?.(vars);
    if (!copy) continue; // nothing worth saying to this side about this status
    const userId = side === "creator" ? opts.creatorUserId : opts.brandUserId;
    if (!userId) continue; // admin-created campaign with no registered brand
    try {
      await sendBrandedEmail(admin, {
        userId,
        subject: copy.subject,
        title: copy.title,
        body: copy.body,
        ctaLabel: copy.ctaLabel,
        ctaPath: side === "creator" ? `/influencer/offers/${opts.campaignId}` : `/brands/campaign/${opts.campaignId}`,
        preheader: copy.subject,
      });
    } catch (e) {
      console.error(`application status email (${side}/${opts.status}) failed:`, e);
    }
  }
}
