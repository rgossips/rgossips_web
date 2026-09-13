"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEffectivePlan,
  hasFeature,
  getFeatureValue,
  isSubscribed,
  FREE_BARTER_APPLICATIONS,
  PLAN_IDS,
} from "@/lib/plans";

/**
 * Plan-aware helpers for the current signed-in user.
 *  - `plan`: effective plan id (free / starter / pro / elite)
 *  - `isFree`: no paid subscription — the 3-barter-application tier
 *  - `subscribed`: holds any paid plan; the gate for every feature
 *  - `can(key)`: bool — feature gate
 *  - `valueOf(key)`: raw matrix value (number, string, bool)
 *
 * There is no trial. `isTrial` / `daysLeft` were removed with it — use
 * `isFree` for the "hasn't paid" case they were standing in for.
 */
export function usePlan() {
  const { profile } = useAuth();
  return useMemo(() => {
    const plan = getEffectivePlan(profile);
    return {
      plan,
      isFree: plan === PLAN_IDS.FREE,
      isStarter: plan === PLAN_IDS.STARTER,
      isPro: plan === PLAN_IDS.PRO,
      isElite: plan === PLAN_IDS.ELITE,
      subscribed: isSubscribed(profile),
      freeApplicationLimit: FREE_BARTER_APPLICATIONS,
      can: (key) => hasFeature(plan, key),
      valueOf: (key) => getFeatureValue(plan, key),
    };
  }, [profile]);
}
