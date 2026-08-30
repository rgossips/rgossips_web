"use client";

import React from "react";
import { Star, Box, Compass, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import BrandsCarousel from "@/components/BrandsCarousel2";
import CreatorsCarouselWithLink from "@/components/CreatorsCarouselWithLink";
import JourneyCarousel from "@/components/JourneyCarousel";
import StackedDeals from "@/components/StackedDeals";
import StayCarousel from "@/components/StayCarousel";
import TopPicksCarousel from "@/components/TopPicksCarousel";
import TopServices from "@/components/TopServices";
import UserDoc from "@/components/UserDoc";
import { useAuth } from "@/context/AuthContext";
import DealsLaptop from "@/components/DealsLaptop";
import { ProStatusCard } from "@/components/ProStatusCard";
import { CompleteProfileCard, useProfileCompletion } from "@/components/CompleteProfileCard";
import { AiMediaKitCard } from "@/components/AMediaKitCard";
import { AiToolsGrid } from "@/components/AiToolsGrid";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import InstagramReconnectBanner from "@/components/InstagramReconnectBanner";
import WelcomeRewardModal from "@/components/WelcomeRewardModal";
import { REWARDS_ENABLED } from "@/lib/features";

// `labelKey` maps to InfluencerHome.nav.<key>.
const CATEGORIES = [
  { id: 2, labelKey: "brands", icon: <Box size={20} />, active: false, action: "navigate", target: "/influencer/brands" },
  { id: 3, labelKey: "topServices", icon: <Compass size={20} />, active: false, action: "scroll", target: "section-top-services" },
  { id: 4, labelKey: "topCreators", icon: <Crown size={20} />, active: false, action: "scroll", target: "section-top-creators" },
  { id: 5, labelKey: "campaigns", icon: <Star size={20} />, active: false, action: "scroll", target: "section-recommended-campaigns" },
];

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("InfluencerHome");
  const { loading, profile } = useAuth();
  // Hide the "Get Your First Brand Deal" checklist once all 5 steps are done.
  const profileCompletion = useProfileCompletion(profile);
  const onboardingDone = profileCompletion.completed >= profileCompletion.total;

  const handleCategoryClick = (cat) => {
    if (cat.action === "navigate") {
      router.push(cat.target);
    } else if (cat.action === "scroll") {
      const el = document.getElementById(cat.target);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  //   const [homeData, setHomeData] = useState({
  //   activeOffers: [],
  //   topBrands: [],
  //   topInfluencers: [],
  //   travelOffers: [],
  // });

  // useEffect(() => {
  //   const fetchAllData = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();

  //     const [
  //       activeOffersRes,
  //       topBrandsRes,
  //       topInfluencersRes,
  //       travelOffersRes
  //     ] = await Promise.all([
  //       // 1. Top 10 Active Offers
  //       supabase.from('offers').select('*').eq('status', 'active').limit(10),

  //       // 2. Top 10 Brands (verification_state = 2)
  //       // Assuming brands are in a 'profiles' table with a 'type' or 'role' column
  //       supabase.from('profiles').select('*').eq('verification_state', 2).eq('role', 'brand').limit(10),

  //       // 3. Top 10 Influencers (verification_state = 2, not current user)
  //       supabase.from('profiles')
  //         .select('*')
  //         .eq('verification_state', 2)
  //         .eq('role', 'influencer')
  //         .neq('id', user?.id)
  //         .limit(10),

  //       // 4. Top 10 Travel Offers (target_categories contains travel)
  //       // Uses the 'cs' (contains) filter for array columns
  //       supabase.from('offers')
  //         .select('*')
  //         .contains('target_categories', ['travel'])
  //         .limit(10)
  //     ]);

  //     setHomeData({
  //       activeOffers: activeOffersRes.data || [],
  //       topBrands: topBrandsRes.data || [],
  //       topInfluencers: topInfluencersRes.data || [],
  //       travelOffers: travelOffersRes.data || [],
  //     });
  //   };

  //   fetchAllData();
  // }, []);

  // Handle Initial Global Load
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#E60076] animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">{t("loading")}</p>
        </div>
      </div>
    );
  }
  return (
    <main className="relative w-full overflow-x-hidden">
      {/* {profile && profile?.verificationState < 5 && (
        <ProfileStepPopup userData={profile} />
      )}
      <Hero user={profile} />
      <HeroImage userData={profile} /> */}

      <div className="relative z-20 bg-white p-2 pb-20 lg:pb-2">
        {/* Constrained content */}
        <div className="flex flex-col items-center max-w-[1440px] mx-auto lg:mb-10">
          {/* Mobile Header */}
          <div className="w-full lg:hidden">
            <UserDoc />
          </div>

          <div className="flex items-center justify-center px-2 lg:pt-24 w-full">
            <ProStatusCard />
          </div>

          {/* Instagram Reconnect Banner */}
          <div className="w-full">
            <InstagramReconnectBanner />
          </div>

          {/* First-time welcome-reward celebration for new signups. Suppressed
              while the rewards programme is off — create-profile no longer
              grants the 50 RC it celebrates, so it would announce a bonus that
              was never issued. See lib/features.js. */}
          {REWARDS_ENABLED && <WelcomeRewardModal />}

          {/* Refer & Earn balance now renders inside ProStatusCard above, as a
              cell in the account summary rather than a strip under it. */}

          {/* Desktop Two-Column Layout */}
          <div className="hidden lg:flex gap-8 w-full pl-10">
            <div className="w-64 flex-shrink-0">
              <div className="mt-8 space-y-3">
                {CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full flex items-center gap-4 px-4 cursor-pointer py-4 rounded-[24px] transition-all duration-300 shadow-sm ${
                      cat.active ? "bg-white border-l-4 border-pink-500" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-2xl ${cat.active ? "bg-pink-50 text-pink-500" : "bg-slate-50 text-slate-400"}`}>{React.cloneElement(cat.icon, { size: 20 })}</div>
                    <span className={`text-sm font-bold ${cat.active ? "text-slate-900" : "text-slate-400"}`}>{t(`nav.${cat.labelKey}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <DealsLaptop />
            </div>
          </div>

          {/* Mobile Layout: Stacked */}
          <div className="lg:hidden w-full">
            <StackedDeals />
          </div>

          <div className="flex w-full px-4 lg:px-10 justify-center gap-6 lg:gap-10 flex-col lg:flex-row items-stretch">
            {!onboardingDone && (
              <div className="flex w-full order-2 lg:order-1 lg:flex-1">
                <CompleteProfileCard />
              </div>
            )}
            <div className="flex w-full order-1 lg:order-2 lg:flex-1">
              <AiMediaKitCard />
            </div>
            <div className="flex w-full order-3 lg:flex-1">
              <AiToolsGrid />
            </div>
          </div>
        </div>

        {/* "For You" (JourneyCarousel) and the PerformanceDashboard
            section that used to sit between it and "Brands You'll Love"
            were intentionally removed — the recommended campaigns flow
            covers the same ground without the dead-data placeholders. */}

        {/* Constrained content */}
        <div className="max-w-[1440px] mx-auto space-y-8">
          <BrandsCarousel />
          <div id="section-top-services">
            <TopServices />
          </div>
          <div id="section-recommended-campaigns">
            <TopPicksCarousel />
          </div>
          <StayCarousel />
          <div id="section-top-creators">
            <CreatorsCarouselWithLink />
          </div>
        </div>
      </div>
    </main>
  );
}
