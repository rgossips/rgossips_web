"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import SectionTitle from "./SectionTitle";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// 1. Realistic Dummy Data matching your structure
const DUMMY_OFFERS = [
  {
    id: "camp-001",
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600",
    category: "Beauty",
    brand: { name: "Glow Essentials" },
    metadata: {
      title: "Summer Radiance Campaign",
      location: "New York, USA",
    },
  },
  {
    id: "camp-002",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
    category: "Travel",
    brand: { name: "Blue Horizon" },
    metadata: {
      title: "Luxury Bali Retreat",
      location: "Bali, Indonesia",
    },
  },
  {
    id: "camp-003",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600",
    category: "Tech",
    brand: { name: "Sonic Audio" },
    metadata: {
      title: "Pro Headset Review",
      location: "Remote",
    },
  },
  {
    id: "camp-004",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600",
    category: "Fashion",
    brand: { name: "Urban Threads" },
    metadata: {
      title: "Streetwear Launch",
      location: "London, UK",
    },
  },
];

export default function CarouselTopPicks() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulating an API fetch delay
    const timer = setTimeout(() => {
      setOffers(DUMMY_OFFERS);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D61F69]"></div>
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="w-full relative py-6 px-3 lg:px-8">
      <div className="px-6 mb-4">
        <div className="flex justify-between items-center">
          <SectionTitle text="JOURNEY TOGETHER" />
        </div>
      </div>

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {offers.map((item) => (
              <CarouselItem
                key={item.id}
                className="pl-4 basis-[82%] sm:basis-1/2 lg:basis-1/3"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/offers/${item.id}`)}
                  className="rounded-[32px] bg-white overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-shadow hover:shadow-md"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.metadata?.title || "Offer"}
                      fill
                      className="object-cover"
                    />
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#D61F69] shadow-sm">
                      {item.category}
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-5 flex flex-col gap-1">
                    <h3 className="text-base font-black text-slate-900 line-clamp-1 leading-tight uppercase">
                      {item.metadata?.title}
                    </h3>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <p className="text-xs text-slate-500 font-bold">
                          {item.brand?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.metadata?.location?.split(",")[0]}
                        </p>
                      </div>

                      <div className="bg-[#D61F69] text-white text-[10px] font-bold px-4 py-2 rounded-full hover:bg-[#b81a5a] transition-colors">
                        APPLY
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
