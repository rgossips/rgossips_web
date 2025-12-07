import BrandsCarousel from "@/components/BrandsCarousel2";
import CreatorsCarousel from "@/components/CreatorsCarousel";
import CreatorsCarouselWithLink from "@/components/CreatorsCarouselWithLink";
import CreatorStories from "@/components/CreatorStories";
import ExploreStates from "@/components/ExploreStates";
import FoodMoodGrid from "@/components/FoodMood";
import HeroImage from "@/components/HeroImg";
import Hero from "@/components/InfluencerHero";
import SelectionMenu from "@/components/SelectionMenu";
import StayCarousel from "@/components/StayCarousel";
import TopExperiencesCarousel from "@/components/TopExperienceCarousel";
import TopPicksCarousel from "@/components/TopPicksCarousel";

export default function HomePage() {
  return (
    <main className="relative w-full bg-[#0D7753]">
      <Hero />
      <HeroImage />

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
