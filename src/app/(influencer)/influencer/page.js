"use client";
export const dynamic = "force-dynamic";

import BrandsCarousel from "@/components/BrandsCarousel2";
import CreatorsCarousel from "@/components/CreatorsCarousel";
import CreatorsCarouselWithLink from "@/components/CreatorsCarouselWithLink";
import CreatorStories from "@/components/CreatorStories";
import ExploreStates from "@/components/ExploreStates";
import FoodMoodGrid from "@/components/FoodMood";
import HeroImage from "@/components/HeroImg";
import Hero from "@/components/InfluencerHero";
import ProfileStepPopup from "@/components/ProfileStepPopup";
import SelectionMenu from "@/components/SelectionMenu";
import StayCarousel from "@/components/StayCarousel";
import TopExperiencesCarousel from "@/components/TopExperienceCarousel";
import TopPicksCarousel from "@/components/TopPicksCarousel";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  // Pull pre-fetched data and global loading state from Context
  const { profile, loading } = useAuth();

  // Handle Initial Global Load
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0D7753]">
        <div className="animate-pulse text-white font-bold">Loading...</div>
      </div>
    );
  }
  return (
    <main className="relative w-full bg-[#0D7753]">
      {profile && profile?.verificationState < 5 && (
        <ProfileStepPopup userData={profile} />
      )}
      <Hero user={profile} />
      <HeroImage userData={profile} />

      <div className="relative z-20 bg-white p-8">
        <SelectionMenu />
        <div className="flex flex-col gap-16 items-center">
          <TopPicksCarousel />
          <TopExperiencesCarousel />
          <ExploreStates />
          <StayCarousel />
          <CreatorStories />
          <BrandsCarousel />
          <FoodMoodGrid />
          <CreatorsCarousel />
          <CreatorsCarouselWithLink />
        </div>
      </div>
    </main>
  );
}
