"use client";

import React from "react";
import { TrendingUp, Star, Box, Compass, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { CompleteProfileCard } from "@/components/CompleteProfileCard";
import { AiMediaKitCard } from "@/components/AMediaKitCard";
import { AiToolsGrid } from "@/components/AiToolsGrid";
import CreatorsLikeYou from "@/components/CreatorsLikeYou";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import InstagramReconnectBanner from "@/components/InstagramReconnectBanner";

const CATEGORIES = [
  { id: 1, label: "Trending", icon: <TrendingUp size={20} />, active: true, action: "scroll", target: "section-trending" },
  { id: 2, label: "For You", icon: <Star size={20} />, active: false, action: "scroll", target: "section-for-you" },
  { id: 3, label: "Brands", icon: <Box size={20} />, active: false, action: "navigate", target: "/influencer/brands" },
  { id: 4, label: "Top Services", icon: <Compass size={20} />, active: false, action: "scroll", target: "section-top-services" },
  { id: 5, label: "Top Creators", icon: <Crown size={20} />, active: false, action: "scroll", target: "section-top-creators" },
];
export default function HomePage() {
  const router = useRouter();
  const { loading } = useAuth();

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
          <p className="text-sm text-slate-500 font-semibold">Loading...</p>
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
        <div className="flex flex-col gap-4 lg:gap-8 items-center max-w-[1440px] mx-auto lg:mb-10">
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
                    <span className={`text-sm font-bold ${cat.active ? "text-slate-900" : "text-slate-400"}`}>{cat.label}</span>
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
            <div className="flex w-full order-2 lg:order-1 lg:flex-1">
              <CompleteProfileCard />
            </div>
            <div className="flex w-full order-1 lg:order-2 lg:flex-1">
              <AiMediaKitCard />
            </div>
            <div className="flex w-full order-3 lg:flex-1">
              <AiToolsGrid />
            </div>
          </div>
        </div>

        {/* Full-width background sections */}
        <div id="section-trending">
          <CreatorsLikeYou />
        </div>

        <div className="max-w-[1440px] mx-auto">
          <div id="section-for-you">
            <JourneyCarousel />
          </div>
        </div>

        <PerformanceDashboard />

        {/* Constrained content */}
        <div className="max-w-[1440px] mx-auto space-y-8">
          <BrandsCarousel />
          <div id="section-top-services">
            <TopServices />
          </div>
          <TopPicksCarousel />
          <StayCarousel />
          <div id="section-top-creators">
            <CreatorsCarouselWithLink />
          </div>
        </div>
      </div>
    </main>
  );
}
