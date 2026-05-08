"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { computeBrandTrustScore, getProfileCompletion } from "@/lib/brandProfile";

// Pulls the inputs needed for the brand trust score and returns the computed
// score + completion. Safe to call on any brand-side page; will short-circuit
// for non-brand users.
export function useBrandTrustScore() {
  const { user, profile, role } = useAuth();
  const [ratings, setRatings] = useState({ avgRating: 0, count: 0 });
  const [campaignStats, setCampaignStats] = useState({ completedCount: 0, staleCount: 0 });
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
        // Pull both in parallel.
        const [{ data: ratingRows }, { data: campaignRows }] = await Promise.all([
          supabase
            .from("campaign_ratings")
            .select("target_rating")
            .eq("brand_id", user.id)
            .eq("rater_role", "influencer"),
          supabase
            .from("campaigns")
            .select("campaign_id, status, campaign_end_date")
            .eq("brand_id", user.id),
        ]);

        if (cancelled) return;

        // Rating average
        const ratingValues = (ratingRows || [])
          .map((r) => Number(r.target_rating))
          .filter((n) => Number.isFinite(n) && n > 0);
        const avgRating =
          ratingValues.length > 0
            ? ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length
            : 0;
        setRatings({ avgRating, count: ratingValues.length });

        // Campaign delivery ratio — needs to know which campaigns had a
        // completed application. One follow-up query keyed by campaign_id.
        const campaigns = campaignRows || [];
        let completedCount = 0;
        let staleCount = 0;

        if (campaigns.length > 0) {
          const ids = campaigns.map((c) => c.campaign_id);
          const { data: appRows } = await supabase
            .from("campaign_applications")
            .select("campaign_id, status")
            .in("campaign_id", ids)
            .eq("status", "completed");

          if (cancelled) return;

          const completedSet = new Set((appRows || []).map((a) => a.campaign_id));
          const now = Date.now();

          for (const c of campaigns) {
            if (completedSet.has(c.campaign_id)) {
              completedCount += 1;
              continue;
            }
            const ended =
              c.status === "closed" ||
              c.status === "completed" ||
              c.status === "archived" ||
              (c.campaign_end_date && new Date(c.campaign_end_date).getTime() < now);
            if (ended) staleCount += 1;
          }
        }

        setCampaignStats({ completedCount, staleCount });
      } catch (e) {
        console.error("useBrandTrustScore failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, role]);

  const completion = useMemo(() => getProfileCompletion(profile), [profile]);
  const trust = useMemo(
    () =>
      computeBrandTrustScore({
        profile,
        ratings,
        campaignDelivery: campaignStats,
      }),
    [profile, ratings, campaignStats]
  );

  return { loading, trust, completion, ratings, campaignStats };
}
