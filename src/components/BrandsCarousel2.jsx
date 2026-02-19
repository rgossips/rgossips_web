"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import SectionTitle from "./SectionTitle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BrandsCarousel() {
  const [brands, setBrands] = useState([]);
  const [api, setApi] = useState(null);

  const DUMMY_BRANDS = [
    {
      id: 1,
      name: "D LUXE PERFUMES",
      category: "Perfume",
      minBudget: 1500,
      maxBudget: 7500,
      isVerified: true,
      platforms: ["Instagram"],
      activeCampaigns: 12,
      rating: 4.9,
      followers: "45K",
      logo: "https://lh3.googleusercontent.com/d/1y5nOHRt1P-5SB6BCzryeczgmhyoHcuSs",
      payout: "₹1,500 - ₹7,500",
    },
    {
      id: 2,
      name: "ZAUDI",
      category: "Perfume",
      minBudget: 1000,
      maxBudget: 5000,
      isVerified: false,
      platforms: ["Instagram"],
      activeCampaigns: 4,
      rating: 4.3,
      followers: "12K",
      logo: "https://lh3.googleusercontent.com/d/1PS9A-rPC48WUPo8imZjw4XAzChADsceu",
      payout: "₹1,000 - ₹5,000",
    },
    {
      id: 3,
      name: "RIAR ELUX",
      category: "Wellness",
      minBudget: 2000,
      maxBudget: 8000,
      isVerified: true,
      platforms: ["Instagram"],
      activeCampaigns: 8,
      rating: 4.7,
      followers: "28K",
      logo: "https://lh3.googleusercontent.com/d/1cUytBemciPv8OdMi6-gADzUCKzfymr1R",
      payout: "₹2,000 - ₹8,000",
    },
    {
      id: 4,
      name: "BIODANCE",
      category: "Skincare",
      minBudget: 3000,
      maxBudget: 12000,
      isVerified: false,
      platforms: ["Instagram"],
      activeCampaigns: 15,
      rating: 4.8,
      followers: "85K",
      logo: "https://lh3.googleusercontent.com/d/16kk2EEAMw_Y0D3Jo4BCUKAwF2rE8ugLG",
      payout: "₹3,000 - ₹12,000",
    },
    {
      id: 5,
      name: "SESA POWERPLUS",
      category: "Health",
      minBudget: 1200,
      maxBudget: 6000,
      isVerified: false,
      platforms: ["Instagram"],
      activeCampaigns: 6,
      rating: 4.5,
      followers: "19K",
      logo: "https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r",
      payout: "₹1,200 - ₹6,000",
    },
    {
      id: 6,
      name: "SESA AYURVEDIC",
      category: "Health",
      minBudget: 1500,
      maxBudget: 7000,
      isVerified: true,
      platforms: ["Instagram"],
      activeCampaigns: 10,
      rating: 4.6,
      followers: "52K",
      logo: "https://lh3.googleusercontent.com/d/1ua9IVd7PYxaIP44G3XHLKgauW5VgTy2r",
      payout: "₹1,500 - ₹7,000",
    },
    {
      id: 7,
      name: "JSR Group of Hotels",
      category: "Hotel",
      minBudget: 5000,
      maxBudget: 20000,
      isVerified: false,
      platforms: ["Instagram"],
      activeCampaigns: 5,
      rating: 4.8,
      followers: "34K",
      logo: "https://lh3.googleusercontent.com/d/14oE-4ohZxzmshUK6LwU8N3l5tOkh6jcT",
      payout: "₹5,000 - ₹20,000",
    },
    {
      id: 8,
      name: "Crismson Curry",
      category: "Cafe",
      minBudget: 1000,
      maxBudget: 4500,
      isVerified: true,
      platforms: ["Instagram"],
      activeCampaigns: 9,
      rating: 4.4,
      followers: "7.5K",
      logo: "https://lh3.googleusercontent.com/d/1rUYya-EIZPqE7lSZBa_TY_wKI5httO6H",
      payout: "₹1,000 - ₹4,500",
    },
    {
      id: 9,
      name: "AURIC",
      category: "Health",
      minBudget: 2500,
      maxBudget: 9000,
      isVerified: false,
      platforms: ["Instagram"],
      activeCampaigns: 14,
      rating: 4.9,
      followers: "120K",
      logo: "https://lh3.googleusercontent.com/d/1IuS3e9tDzB987BNDkQaEmVLkg6IYDiuy",
      payout: "₹2,500 - ₹9,000",
    },
  ];

  useEffect(() => {
    setBrands(DUMMY_BRANDS);
  }, []);

  // Updated Auto-slide effect
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]); // Dependencies added here

  if (!brands.length) return null;

  return (
    <section className="w-full px-6 py-10 lg:py-16">
      <SectionTitle text="BRANDS YOU'LL LOVE" />

      <div className="relative w-full max-w-7xl mx-auto mt-8">
        {/* Desktop Navigation */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl p-3 rounded-full text-slate-800 hover:scale-110 transition-all hidden lg:flex"
        >
          <FaChevronLeft size={16} />
        </button>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          {/* FIX: Removed lg:ml-0 and lg:gap-6 (gap-6 can break Embla's offset math) */}
          <CarouselContent className="-ml-4">
            {brands.map((b) => (
              <CarouselItem
                key={b.id}
                // basis-1/2 (mobile), lg:basis-1/4 (laptop)
                className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/4"
              >
                <div className="flex flex-col items-center w-full group">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-md border-2 border-transparent group-hover:border-pink-500 transition-all">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-bold mt-3 text-center text-slate-700">
                    {b.name}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <button
          onClick={() => api?.scrollNext()}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl p-3 rounded-full text-slate-800 hover:scale-110 transition-all hidden lg:flex"
        >
          <FaChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
