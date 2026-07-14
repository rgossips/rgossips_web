"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight, Crown, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { isWithinTrial, TRIAL_DAYS } from "@/lib/plans";

function getTrialInfo(profile) {
  const createdAt = profile?.created_at || profile?.updated_at;
  if (!createdAt) return { daysLeft: TRIAL_DAYS, progress: 0, expired: false };

  const start = new Date(createdAt);
  const now = new Date();
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  const progress = Math.min(100, Math.round(((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100));

  return { daysLeft, progress, expired: daysLeft === 0 };
}

// Approximation while we don't surface `subscription_current_period_end`
// from Stripe: assume the active subscription renews `cycle_days` after the
// last profile update (which is bumped on plan change). Good enough to
// give the user a real number without a backend schema change.
function getPlanRenewalInfo(profile) {
  if (!profile?.updated_at) return { daysLeft: null };
  const cycleDays = profile.billing_cycle === "annual" ? 365 : 30;
  const start = new Date(profile.updated_at);
  const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, cycleDays - elapsed);
  return { daysLeft, cycleDays };
}

// Tags vs categories with sloppy substring matching — same pattern as
// TopPicksCarousel so "Beauty & Skincare" matches "Beauty" and vice-versa.
const tagsMatchCategories = (tags, categories) => {
  if (!categories?.length || !tags?.length) return false;
  return categories.some((cat) =>
    tags.some((t) =>
      String(t).toLowerCase().includes(String(cat).toLowerCase()) ||
      String(cat).toLowerCase().includes(String(t).toLowerCase())
    )
  );
};

const scrollToRecommendedCampaigns = () => {
  if (typeof document === "undefined") return;
  const el = document.getElementById("section-recommended-campaigns");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function ProStatusCard() {
  const t = useTranslations("ProStatusCard");
  const { profile } = useAuth();
  const { daysLeft, progress, expired } = getTrialInfo(profile);
  const renewal = getPlanRenewalInfo(profile);
  const currentPlan = (profile?.subscription_plan || "").toLowerCase();
  // Any explicit non-empty plan (other than the placeholder "free"/"trial"
  // strings) counts as a paid subscription — that includes Starter, which is
  // a paid tier (₹99/mo). Previously this card excluded "starter" and showed
  // "Free Trial" to users who'd actually upgraded.
  const hasPaidPlan = !!currentPlan && currentPlan !== "free" && currentPlan !== "trial";
  const onTrial = !hasPaidPlan && isWithinTrial(profile);

  // Real count of brands with active campaigns matching the creator's
  // chosen categories. Mirrors the Recommended Campaigns filter so the
  // number lines up with what the section actually shows.
  const [matchingBrandsCount, setMatchingBrandsCount] = useState(null);
  const userCategories = useMemo(() => profile?.categories || [], [profile?.categories]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: "{}",
        });
        const data = await res.json();
        if (cancelled || !Array.isArray(data?.campaigns)) return;
        const matching = data.campaigns.filter((c) => {
          if (c.status !== "Active") return false;
          if (userCategories.length === 0) return true;
          return tagsMatchCategories(c.tags, userCategories);
        });
        const brandIds = new Set(matching.map((c) => c.brandId || c.brandName).filter(Boolean));
        setMatchingBrandsCount(brandIds.size);
      } catch {
        if (!cancelled) setMatchingBrandsCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, [userCategories]);

  return (
    <div className="lg:px-10 pb-6 w-full flex items-center justify-center">
      <Card className="w-full p-4 lg:p-6 bg-white border border-slate-200 shadow-sm rounded-[32px] lg:rounded-3xl">
        {/* Main Container: Stacks on mobile, Rows on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 space-y-4 lg:space-y-0">
          {/* Section 1: Avatar + Name + Earnings */}
          <div className="flex items-center gap-4 lg:shrink-0">
            <div className="relative shrink-0">
              <Image
                width={56}
                height={56}
                src={profile?.custom_profile_photo_url || profile?.profile_photo_url || "/default-avatar.svg"}
                alt={profile?.full_name || t("userFallback")}
                className="w-14 h-14 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl lg:text-xl font-black text-slate-800 leading-tight">
                {t("greeting", { name: profile?.full_name?.split(" ")[0] || t("creatorFallback") })}
              </h1>
              <div className="inline-flex items-center px-2 py-0.5 bg-emerald-50 rounded-md">
                <p className="text-[10px] lg:text-xs font-bold text-emerald-600 tracking-tight">
                  {t("planLabel")}{" "}
                  <span className="text-slate-900 ml-1">
                    {hasPaidPlan
                        ? currentPlan.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : expired
                        ? t("planFree")
                        : t("planStarterTrial")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Vertical Divider - Desktop Only */}
          <div className="hidden lg:block w-px h-12 bg-slate-100 shrink-0" />

          {/* Section 2: Brands CTA Card — clicks scroll to the Recommended
              Campaigns section below. */}
          <button
            type="button"
            onClick={scrollToRecommendedCampaigns}
            className="flex-1 group cursor-pointer text-left"
          >
            <div className="flex items-center justify-between p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg hover:bg-slate-50 lg:hover:bg-transparent transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 lg:bg-slate-50 rounded-full">
                  <Sparkles size={18} className="text-purple-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600 leading-snug">
                  <span className=" bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text font-bold">
                    {matchingBrandsCount == null
                      ? t("brandsLoading")
                      : t("brandsCount", { count: matchingBrandsCount })}
                  </span>
                  <br className="block lg:hidden" />
                  <span className="lg:ml-1">
                    {userCategories.length > 0
                      ? t("lookingNiche")
                      : t("activeNow")}
                  </span>
                </p>
              </div>
              <div className="p-1 bg-slate-50 rounded-full lg:bg-transparent">
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-slate-500"
                />
              </div>
            </div>
          </button>

          {/* Vertical Divider - Desktop Only */}
          <div className="hidden lg:block w-px h-12 bg-slate-100 shrink-0" />

          {/* Section 3: Trial Status + Upgrade */}
          <div className="flex items-center gap-3">
            {hasPaidPlan ? (
              <div className="p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg flex-1">
                <div className="flex items-center justify-between lg:gap-6">
                  <div className="flex-1 lg:w-36">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-purple-600 fill-purple-600" />
                      <span className="text-[10px] lg:text-[11px] font-black tracking-widest text-slate-500 uppercase">
                        {t("activePlan")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {t("renewsLine", { cycle: profile?.billing_cycle === "annual" ? t("cycleAnnual") : t("cycleMonthly") })}
                    </p>
                  </div>
                  <div className="pl-4 lg:pl-0 border-l lg:border-0 border-slate-100 text-center">
                    <span className="text-3xl lg:text-3xl font-black leading-none bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text">
                      {renewal.daysLeft != null ? renewal.daysLeft : "—"}
                    </span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                      {t("days")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg flex-1">
                <div className="flex items-center justify-between lg:gap-6">
                  <div className="flex-1 lg:w-36">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={14} className={expired ? "text-slate-400 fill-slate-400" : "text-purple-600 fill-purple-600"} />
                      <span className="text-[10px] lg:text-[11px] font-black tracking-widest text-slate-500 uppercase">
                        {expired ? t("trialExpired") : t("freeTrial")}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${expired ? "bg-red-400" : "bg-gradient-to-r from-[#9810fa] to-[#e60076]"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Day Counter */}
                  <div className="pl-4 lg:pl-0 border-l lg:border-0 border-slate-100 text-center">
                    <span className={`text-3xl lg:text-3xl font-black leading-none ${expired ? "text-red-400" : "bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text"}`}>
                      {daysLeft}
                    </span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                      {t("daysLeft")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Button — hidden on Elite (top tier, nothing to
                upgrade to). Starter, Pro, trial, and free users all see
                it pointing them at the pricing page. */}
            {currentPlan !== "elite" && (
              <Link
                href="/influencer/pricing"
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-lg shadow-purple-200 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
              >
                <Crown size={16} />
                <span className="hidden lg:inline">{t("upgrade")}</span>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
