import { BeyondInfluencers } from "@/components/brands/BeyondInfluencer";
import BrandExploreHero from "@/components/brands/BrandExploreHero";
import { CategorySection } from "@/components/brands/CategorySection";
import { CreatorsByLocation } from "@/components/brands/CreatorsByLocation";
import CreatorStories from "@/components/CreatorStories";
import { RecentlyConnected } from "@/components/brands/RecentlyConnected";
import { TopCreatorsCarousel } from "@/components/brands/TopCreatorCarousel";
import React from "react";
import PocketFriendlyCreators from "@/components/brands/PocketFriendlyCreators";
import { CreatorCTASection } from "@/components/brands/CreatorCTASection";

// Explore — section order follows "RGossips Explore.dc.html".
//
// The design specifies six content sections between the hero and the closing
// band: categories, top creators, recently connected, creators by location and
// pocket-friendly creators. Two sections the page already had — Beyond
// Influencers and Creator Stories — are NOT in the design. They are kept and
// placed ahead of the closing band rather than deleted, because the design is a
// layout for this page, not an instruction to remove working content. Say the
// word and they come out.
const page = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <div className="mx-auto flex max-w-[1420px] flex-col gap-8 px-4 py-6 lg:gap-11 lg:px-8 lg:py-8">
        {/* One navy panel: badge, headline, AI brief box, chips, trust score,
            social proof and the live match strip. The reference merges what
            were BrandHero + BrandMatchPrompt + the mobile TrustSection. */}
        <BrandExploreHero />

        <CategorySection />
        <TopCreatorsCarousel />
        <RecentlyConnected />
        <CreatorsByLocation />
        <PocketFriendlyCreators />

        {/* Not in the Explore design — retained deliberately, see above. */}
        <BeyondInfluencers />
        <CreatorStories />

        <CreatorCTASection />
      </div>
    </div>
  );
};

export default page;
