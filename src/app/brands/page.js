import { BeyondInfluencers } from "@/components/brands/BeyondInfluencer";
import BrandHero from "@/components/brands/BrandHero";
import { CategorySection } from "@/components/brands/CategorySection";
import { CreatorsByLocation } from "@/components/brands/CreatorsByLocation";
import CreatorStories from "@/components/CreatorStories";
import { RecentlyConnected } from "@/components/brands/RecentlyConnected";
import { TopCreatorsCarousel } from "@/components/brands/TopCreatorCarousel";
import { TrustSection } from "@/components/brands/TrustSection";
import React from "react";
import PocketFriendlyCreators from "@/components/brands/PocketFriendlyCreators";
import { CreatorCTASection } from "@/components/brands/CreatorCTASection";

const page = () => {
  return (
    <div className="flex items-center flex-col gap-8 lg:gap-10 lg:px-10 lg:py-20  bg-white">
      <BrandHero />
      <TrustSection />
      <CategorySection />
      <TopCreatorsCarousel />
      <RecentlyConnected />
      <CreatorsByLocation />
      <BeyondInfluencers />
      <CreatorStories />
      <PocketFriendlyCreators />
      <CreatorCTASection />
    </div>
  );
};

export default page;
