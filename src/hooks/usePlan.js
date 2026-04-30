"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getEffectivePlan,
  hasFeature,
  getFeatureValue,
  isWithinTrial,
  trialDaysLeft,
  PLAN_IDS,
} from "@/lib/plans";

/**
 * Plan-aware helpers for the current signed-in user.
 *  - `plan`: effective plan id (starter / pro / elite)
 *  - `isTrial`: whether the user is in their 30-day trial window
 *  - `daysLeft`: trial days remaining (0 outside trial)
 *  - `can(key)`: bool — feature gate
 *  - `valueOf(key)`: raw matrix value (number, string, bool)
 */
export function usePlan() {
  const { profile } = useAuth();
  return useMemo(() => {
    const plan = getEffectivePlan(profile);
    return {
      plan,
      isStarter: plan === PLAN_IDS.STARTER,
      isPro: plan === PLAN_IDS.PRO,
      isElite: plan === PLAN_IDS.ELITE,
      isTrial: isWithinTrial(profile),
      daysLeft: trialDaysLeft(profile),
      can: (key) => hasFeature(plan, key),
      valueOf: (key) => getFeatureValue(plan, key),
    };
  }, [profile]);
}
