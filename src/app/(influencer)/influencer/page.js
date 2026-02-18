"use client";
export const dynamic = "force-dynamic";

import React from "react";
import { TrendingUp, Star, Box } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BrandsCarousel from "@/components/BrandsCarousel2";
import CounterBanner from "@/components/CounterBanner";
import CreatorsCarousel from "@/components/CreatorsCarousel";
import CreatorsCarouselWithLink from "@/components/CreatorsCarouselWithLink";
import CreatorStories from "@/components/CreatorStories";
import ExploreStates from "@/components/ExploreStates";
import FoodMoodGrid from "@/components/FoodMood";
import HeroImage from "@/components/HeroImg";
import HotelRecommendations from "@/components/HotelRecommendation";
import Hero from "@/components/InfluencerHero";
import JourneyCarousel from "@/components/JourneyCarousel";
import ProfileStepPopup from "@/components/ProfileStepPopup";
import SelectionMenu from "@/components/SelectionMenu";
import StackedDeals from "@/components/StackedDeals";
import StayCarousel from "@/components/StayCarousel";
import TopExperiencesCarousel from "@/components/TopExperienceCarousel";
import TopPicksCarousel from "@/components/TopPicksCarousel";
import TopRatedInfluencers from "@/components/TopRatedInfluencer";
import TopServices from "@/components/TopServices";
import UserDoc from "@/components/UserDoc";
import { useAuth } from "@/context/AuthContext";
import DealsLaptop from "@/components/DealsLaptop";

const CATEGORIES = [
  { id: 1, label: "Trending", icon: <TrendingUp size={20} />, active: true },
  { id: 2, label: "For You", icon: <Star size={20} />, active: false },
  { id: 3, label: "Products", icon: <Box size={20} />, active: false },
  { id: 4, label: "Trending", icon: <TrendingUp size={20} />, active: false },
  { id: 5, label: "Trending", icon: <TrendingUp size={20} />, active: false },
];

export default function HomePage() {
  // Pull pre-fetched data and global loading state from Context
  const { profile, loading } = useAuth();

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
      <div className="w-full h-screen flex items-center justify-center bg-[#0D7753]">
        <div className="animate-pulse text-white font-bold">Loading...</div>
      </div>
    );
  }
  return (
    <main className="relative w-full">
      {/* {profile && profile?.verificationState < 5 && (
        <ProfileStepPopup userData={profile} />
      )}
      <Hero user={profile} />
      <HeroImage userData={profile} /> */}

      <div className="relative z-20 bg-white p-2">
        {/* <SelectionMenu /> */}
        <div className="flex flex-col gap-8 items-center lg:items-start">
          {/* Full Width Header */}
          <div className="w-full lg:max-w-[1480px] mx-auto">
            <UserDoc />
          </div>

          {/* Desktop Two-Column Layout */}
          <div className="hidden lg:flex gap-8 w-full pl-10 lg:max-w-[1480px] mx-auto">
            {/* Left Sidebar: Categories Vertical */}
            <div className="w-64 flex-shrink-0 pt-10">
              <div className="mt-20 space-y-3">
                {CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-4 px-4 cursor-pointer py-4 rounded-[24px] transition-all duration-300 shadow-sm ${
                      cat.active
                        ? "bg-white border-l-4 border-pink-500"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-2xl ${
                        cat.active
                          ? "bg-pink-50 text-pink-500"
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {React.cloneElement(cat.icon, { size: 20 })}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        cat.active ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: StackedDeals */}
            <div className="flex-1">
              {/* <StackedDeals /> */}
              <DealsLaptop />
            </div>
          </div>

          {/* Mobile Layout: Stacked */}
          <div className="lg:hidden w-full lg:max-w-[1480px] mx-auto">
            <StackedDeals />
          </div>

          {/* Rest of content */}
          <div className="w-full lg:max-w-[1480px] mx-auto space-y-8">
            <JourneyCarousel />
            <BrandsCarousel />
            <HotelRecommendations />
            <TopRatedInfluencers />
            <CounterBanner />
            <TopServices />
            <TopPicksCarousel />
            {/* <TopExperiencesCarousel />
            <ExploreStates /> */}
            <StayCarousel />
            <CreatorStories />
            {/* <FoodMoodGrid /> */}
            {/* <CreatorsCarousel /> */}
            <CreatorsCarouselWithLink />
          </div>
        </div>
      </div>
    </main>
  );
}
