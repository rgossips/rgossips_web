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
import { useEffect } from "react";
import BrandForms from "@/components/BrandForms";
import Hero2 from "@/components/Hero2";
import ProductPreview from "@/components/ProductPreview";
import PainPoints from "@/components/PainPoints";
import FeatureHub from "@/components/FeatureHub";
import ImpactStats from "@/components/ImpactStats";

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
      <HomeHero />
      {/* <HomeCarousel /> */}
      <BrandsCarousel />

      {/* <ShowcaseSection />

      <FeaturedSection /> */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full pl-10 pr-20 my-10 gap-8">
        {features.map((item, i) => (
          <div key={i} className="flex items-center gap-5 p-6 ">
            <div className="text-[100px]">{item.icon}</div>
            <div className="flex flex-col">
              <div className="font-semibold text-2xl text-gray-900">
                {item.title}
              </div>
              <div className="text-gray-500 text-base">{item.desc}</div>
            </div>
          </div>
        ))}
      </div> */}
      {/* <div className="relative h-screen w-full flex flex-col items-start justify-center gap-10 text-white px-10 lg:px-20 overflow-hidden">
       
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source
            src="https://www.pexels.com/download/video/7964466/"
            type="video/mp4"
          />
        </video>

        
        <div className="relative z-10 text-3xl font-semibold">Featured</div>

        <div className="relative z-10 text-7xl font-semibold max-w-4xl">
          We provide creative solutions
        </div>

        <div className="relative z-10 bg-black px-5 py-3 text-2xl cursor-pointer">
          Read More
        </div>
      </div> */}
      <ProductSuite />
      <FeaturesSection />
      <CategoryGrid />
      <BrandForms />

      {/* <InfluencerGrid /> */}
      <Hero2 />
      <ProductPreview />
      <PainPoints />
      <FeatureHub />
      <ImpactStats />
      <FaqSection />
      <CTASection />
    </div>
  );
}
