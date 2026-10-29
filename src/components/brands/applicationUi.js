// Presentation shared by every brand-side surface that lists applications:
// the campaign detail aside and the full /applications page. Both must show
// the same chip for the same status and the same tone for the same match
// percentage — two pages disagreeing about what "Offer Sent" looks like is
// how a brand stops trusting either of them.
//
// Deliberately presentation-only. The scoring itself lives in
// lib/applicationMatch.js, which is hand-synced with the admin portal and
// therefore cannot carry Tailwind classes (the portal has its own palette).

// Match-badge styling, keyed by matchTone().
export const MATCH_TONE_CLASS = {
  strong: "bg-emerald-50 text-emerald-700",
  fair: "bg-amber-50 text-amber-700",
  weak: "bg-gray-100 text-gray-500",
  none: "bg-gray-100 text-gray-400",
};

// "?" is the one that matters: it means we do not hold that field for this
// creator, not that they failed it. Most profiles are missing categories and
// location, and a brand reading a middling score needs to know which it is.
export const VERDICT_MARK = { match: "✓", miss: "✗", unknown: "?" };

export const appStatusConfig = {
  pending: { bg: "bg-amber-50 text-amber-700", labelKey: "applied" },
  // B15 negotiation flow — brand sends a priced offer, creator accepts
  // (or withdraws), and only then does escrow funding happen.
  offer_sent: { bg: "bg-purple-50 text-purple-700", labelKey: "offerSent" },
  offer_accepted: { bg: "bg-emerald-50 text-emerald-700", labelKey: "offerAcceptedPay" },
  approved: { bg: "bg-indigo-50 text-indigo-700", labelKey: "approved" },
  submitted: { bg: "bg-purple-50 text-purple-700", labelKey: "submitted" },
  revision_needed: { bg: "bg-orange-50 text-orange-700", labelKey: "revisionNeeded" },
  accepted: { bg: "bg-emerald-50 text-emerald-700", labelKey: "accepted" },
  live_submitted: { bg: "bg-cyan-50 text-cyan-700", labelKey: "live" },
  // From the brand's perspective, releasing payment is their final step —
  // the campaign is effectively done for them. The influencer side still
  // labels this stage as "Payment in Progress" because admin reconciliation
  // happens on their payout pipeline.
  payment: { bg: "bg-blue-50 text-blue-700", labelKey: "completed" },
  completed: { bg: "bg-blue-50 text-blue-700", labelKey: "completed" },
  rejected: { bg: "bg-red-50 text-red-700", labelKey: "rejected" },
  withdrawn: { bg: "bg-gray-100 text-gray-600", labelKey: "withdrawn" },
};

export const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};
