"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { computeBrandTrustScore, getProfileCompletion } from "@/lib/brandProfile";

// Pulls the inputs needed for the brand trust score and returns the
// computed score + breakdown. Safe to call on any brand-side page; will
// short-circuit for non-brand users.
//
// Read paths:
//   P1 — campaign_ratings (target_rating, brief_clarity, fairness,
//        feedback_quality, created_at) recency-weighted in
//        getInfluencerReviewsScore.
//   P2 — application funnel counts (approved, abandoned, final-accepted,
//        reached-draft) + accurate revision-round count from
//        application_status_history (transitions to revision_needed).
//   P3 — auth.users email/phone confirmation flags + profile GST/PAN.
//   P4 — SLA latencies derived from application_status_history:
//          decision      = pending → approved/rejected
//          draft feedback = submitted → accepted/revision_needed/rejected
//          final accept   = live_submitted → payment/rejected
//        plus feedback-richness = transitions with a non-empty reason
//        divided by total brand-decision transitions.
//   P5 — last_sign_in_at + campaigns created in last 90 days +
//        extended profile completeness fields.

// Buckets for SLA latency aggregation. Each entry: { fromStatuses,
// toStatuses, key } — `key` is the field name passed to
// getCommunicationScore.
const SLA_RULES = [
  {
    key: "application_decision",
    fromStatuses: new Set(["pending"]),
    toStatuses: new Set(["approved", "rejected"]),
  },
  {
    key: "draft_feedback",
    fromStatuses: new Set(["submitted"]),
    toStatuses: new Set(["accepted", "revision_needed", "rejected"]),
  },
  {
    key: "final_acceptance",
    fromStatuses: new Set(["live_submitted"]),
    toStatuses: new Set(["payment", "rejected", "completed"]),
  },
];

const BRAND_DECISION_TARGETS = new Set([
  "approved",
  "accepted",
  "revision_needed",
  "rejected",
  "payment",
]);

export function useBrandTrustScore() {
  const { user, profile, role } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [execution, setExecution] = useState({
    approvedCount: 0,
    finalAcceptedCount: 0,
    abandonedAfterApproval: 0,
    reachedDraftCount: 0,
    totalRevisions: 0,
  });
  const [communication, setCommunication] = useState({});
  const [engagement, setEngagement] = useState({
    lastLoginAt: null,
    campaignsLast90d: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || role !== "brand") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const supabase = createClient();
      try {
        const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString();

        const [
          { data: ratingRows },
          { data: campaignRows },
          { count: countLast90d },
        ] = await Promise.all([
          supabase
            .from("campaign_ratings")
            .select("target_rating, brief_clarity, fairness, feedback_quality, created_at")
            .eq("brand_id", user.id)
            .eq("rater_role", "influencer"),
          supabase
            .from("campaigns")
            .select("campaign_id, status, campaign_end_date")
            .eq("brand_id", user.id),
          supabase
            .from("campaigns")
            .select("campaign_id", { count: "exact", head: true })
            .eq("brand_id", user.id)
            .gte("created_at", since90),
        ]);

        if (cancelled) return;

        setReviews(Array.isArray(ratingRows) ? ratingRows : []);

        // Application funnel — fetch every application for this brand's
        // campaigns, then bucket by status.
        const campaigns = campaignRows || [];
        let approvedCount = 0;
        let finalAcceptedCount = 0;
        let abandonedAfterApproval = 0;
        let reachedDraftCount = 0;
        let totalRevisions = 0;

        const slaSums = Object.create(null);   // { key: sum_in_hrs }
        const slaCounts = Object.create(null); // { key: n }
        let brandDecisionsTotal = 0;
        let brandDecisionsWithReason = 0;

        if (campaigns.length > 0) {
          const ids = campaigns.map((c) => c.campaign_id);
          const { data: appRows } = await supabase
            .from("campaign_applications")
            .select("id, campaign_id, status, rejection_reason")
            .in("campaign_id", ids);

          if (cancelled) return;

          // Status history for the same applications — drives both the
          // accurate revision count and the SLA averages. Ordered ASC so
          // the per-app walk sees transitions chronologically.
          const aIds = (appRows || []).map((a) => a.id);
          let histRows = [];
          if (aIds.length > 0) {
            const { data } = await supabase
              .from("application_status_history")
              .select("application_id, from_status, to_status, changed_by_role, reason, created_at")
              .in("application_id", aIds)
              .order("created_at", { ascending: true });
            histRows = data || [];
          }

          if (cancelled) return;

          const DRAFT_REACHED = new Set([
            "submitted", "revision_needed", "accepted",
            "live_submitted", "payment", "completed",
          ]);

          for (const a of appRows || []) {
            const passedApproved = a.status !== "pending" && a.status !== "rejected" && a.status !== "withdrawn";
            if (passedApproved) approvedCount += 1;
            if (a.status === "completed") finalAcceptedCount += 1;

            if (passedApproved && a.status !== "completed") {
              const camp = campaigns.find((c) => c.campaign_id === a.campaign_id);
              const ended = camp && (
                camp.status === "closed" ||
                camp.status === "completed" ||
                camp.status === "archived" ||
                (camp.campaign_end_date && new Date(camp.campaign_end_date).getTime() < Date.now())
              );
              if (ended) abandonedAfterApproval += 1;
            }

            if (DRAFT_REACHED.has(a.status)) reachedDraftCount += 1;
          }

          // Walk per-application history in chronological order to compute
          // revision counts + SLA latencies + feedback richness.
          const byApp = new Map();
          for (const h of histRows || []) {
            if (!byApp.has(h.application_id)) byApp.set(h.application_id, []);
            byApp.get(h.application_id).push(h);
          }

          for (const [, hist] of byApp) {
            // History is already ASC-sorted by the outer query.
            for (let i = 0; i < hist.length; i++) {
              const cur = hist[i];

              // Revisions = each transition INTO revision_needed.
              if (cur.to_status === "revision_needed") totalRevisions += 1;

              // SLA latency — look up the matching rule based on the
              // immediate previous row's to_status (= cur.from_status).
              if (cur.from_status && i > 0) {
                const prev = hist[i - 1];
                const hrs = (new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime()) / 3_600_000;
                if (Number.isFinite(hrs) && hrs >= 0) {
                  for (const rule of SLA_RULES) {
                    if (rule.fromStatuses.has(cur.from_status) && rule.toStatuses.has(cur.to_status)) {
                      slaSums[rule.key] = (slaSums[rule.key] || 0) + hrs;
                      slaCounts[rule.key] = (slaCounts[rule.key] || 0) + 1;
                      break;
                    }
                  }
                }
              }

              // Feedback richness — every brand-side decision counts as
              // an opportunity to leave feedback; we credit the ones
              // where the reason field is non-empty.
              if (cur.changed_by_role === "brand" && BRAND_DECISION_TARGETS.has(cur.to_status)) {
                brandDecisionsTotal += 1;
                const trimmed = (cur.reason || "").trim();
                if (trimmed.length > 0) brandDecisionsWithReason += 1;
              }
            }
          }
        }

        setExecution({
          approvedCount,
          finalAcceptedCount,
          abandonedAfterApproval,
          reachedDraftCount,
          totalRevisions,
        });

        const avgOrNull = (key) =>
          slaCounts[key] > 0 ? slaSums[key] / slaCounts[key] : null;

        setCommunication({
          avgApplicationDecisionHrs: avgOrNull("application_decision"),
          avgDraftFeedbackHrs:       avgOrNull("draft_feedback"),
          avgFinalAcceptanceHrs:     avgOrNull("final_acceptance"),
          // We don't model negotiation as a status (rates are agreed at
          // the Approve step, not via a back-and-forth). Pass null so
          // the SLA average ignores it.
          avgNegotiationHrs: null,
          feedbackRichnessRatio:
            brandDecisionsTotal > 0
              ? brandDecisionsWithReason / brandDecisionsTotal
              : null,
        });

        setEngagement({
          lastLoginAt: user.last_sign_in_at || null,
          campaignsLast90d: countLast90d ?? 0,
        });
      } catch (e) {
        console.error("useBrandTrustScore failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, role, user?.last_sign_in_at]);

  const verification = useMemo(() => ({
    emailVerified: !!user?.email_confirmed_at,
    phoneVerified: !!user?.phone_confirmed_at,
    pan: profile?.pan || "",
    gstin: profile?.gstin || "",
  }), [user?.email_confirmed_at, user?.phone_confirmed_at, profile?.pan, profile?.gstin]);

  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  const trust = useMemo(
    () =>
      computeBrandTrustScore({
        profile,
        reviews,
        execution,
        verification,
        communication,
        engagement,
        penaltyPoints: 0,
      }),
    [profile, reviews, execution, verification, communication, engagement]
  );

  return { loading, trust, completion, reviews, execution, communication };
}
