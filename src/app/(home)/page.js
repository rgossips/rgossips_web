"use client";

import HomeCarousel from "@/components/Carousel";
import FeaturedSection from "@/components/FeaturedSection";
import ShowcaseSection from "@/components/ShowCaseSection";
import {
  CiGift,
  CiDiscount1,
  CiWallet,
  CiShoppingBasket,
} from "react-icons/ci";
import BrandsCarousel from "@/components/BrandsCarousel";
import InfluencerGrid from "@/components/InfluencersGrid";
import FaqSection from "@/components/FAQ";
import HomeHero from "@/components/HomeHero";
import FeaturesSection from "@/components/FeatureSection";
import ProductSuite from "@/components/ProductSuite";
import CategoryGrid from "@/components/CategoryGrid";
import CTASection from "@/components/CTASection";
import { useGlobal } from "@/context/GlobalContext";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandForms from "@/components/BrandForms";
import Hero2 from "@/components/Hero2";
import ProductPreview from "@/components/ProductPreview";
import PainPoints from "@/components/PainPoints";
import FeatureHub from "@/components/FeatureHub";
import ImpactStats from "@/components/ImpactStats";
import HowItWorks from "@/components/HowItWorks";
import TestimonialCarousel from "@/components/TestiMonialCarousel2";
import ToolGrid from "@/components/ToolGrid";
import Pricing from "@/components/Pricing";
import ComparisonTable from "@/components/ComparisonTable";
import MovementSection from "@/components/Movement";
import AppSection from "@/components/AppComponent";
import BottomHero from "@/components/BottomHero";
import CreatorStories from "@/components/CreatorStories";

const features = [
  {
    icon: <CiGift />,
    title: "Client Bonuses",
    desc: "Egestas Integers",
  },
  {
    icon: <CiDiscount1 />,
    title: "Best Discounts",
    desc: "Ullamcorper Amet",
  },
  {
    icon: <CiWallet />,
    title: "Secure Payments",
    desc: "Mauris Faucibus",
  },
  {
    icon: <CiShoppingBasket />,
    title: "Interactive Community",
    desc: "Tempus Consectetur",
  },
];

// useSearchParams() forces CSR-bailout, so isolating it in a
// tiny child component (wrapped in <Suspense> at render time)
// keeps the rest of the marketing home statically prerenderable
// for SEO.
function InvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const invited = searchParams?.get("invited");
    if (invited) {
      router.replace(`/login?invited=${encodeURIComponent(invited)}`);
    }
  }, [searchParams, router]);

  return null;
}

export default function Home() {
  const { scrollTo, setScrollTo } = useGlobal();

  useEffect(() => {
    // 1. Check if scrollTo exists
    if (scrollTo) {
      // 2. Normalize string to match IDs (e.g., "Features" -> "features")
      const targetId = scrollTo.toLowerCase().replace(/\s+/g, "-");
      const element = document.getElementById(targetId);

      if (element) {
        // 3. Calculate position with header offset (approx 80px)
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }

      // 4. Reset state so clicking the same link twice works
      setScrollTo(null);
    }
  }, [scrollTo, setScrollTo]);

  return (
    <div className="flex flex-col items-center w-full">
      <Suspense fallback={null}>
        <InvitationRedirect />
      </Suspense>
      <HomeHero />
      {/* <HomeCarousel /> */}
      <BrandsCarousel />
      <CreatorStories />

      {/* <ShowcaseSection />

      <FeaturedSection /> */}

      <ProductSuite />
      <FeaturesSection />
      {/* <CategoryGrid /> */}
      {/* <BrandForms /> */}

      {/* <InfluencerGrid /> */}
      {/* <Hero2 /> */}
      {/* <ProductPreview /> */}
      <PainPoints />
      {/* <FeatureHub /> */}
      <HowItWorks />
      <TestimonialCarousel />
      {/* <ToolGrid /> */}
      <Pricing />
      <ComparisonTable />
      <ImpactStats />
      <MovementSection />
      <AppSection />
      <FaqSection />
      {/* <BottomHero /> */}
      <CTASection />
    </div>
  );
}
