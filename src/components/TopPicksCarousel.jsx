"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

import spa from "@/assets/spa.jpg";
import hotel from "@/assets/hotel.jpg";
import food from "@/assets/foodEating.jpg";
import { useRouter } from "next/navigation";

const topPicks = [
  {
    image: hotel,
    title: "Summer Hotel Picks",
    tag: "For Macro Influencers",
  },
  {
    image: spa,
    title: "Luxury Spa Deals",
    tag: "Relaxation Essentials",
  },
  {
    image: food,
    title: "Foodie Spots",
    tag: "Tasty Experiences",
  },
  {
    image: hotel,
    title: "Summer Hotel Picks",
    tag: "For Macro Influencers",
  },
  {
    image: spa,
    title: "Luxury Spa Deals",
    tag: "Relaxation Essentials",
  },
  {
    image: food,
    title: "Foodie Spots",
    tag: "Tasty Experiences",
  },
];

export default function CarouselTopPicks() {
  const [api, setApi] = useState(null);

  // Auto-Scroll every 3 seconds
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  const router = useRouter();

  return (
    <section className="w-full px-4 relative">
      <SectionTitle text="TOP PICKS" />

      <div className="relative py-8">
        {/* LEFT Arrow */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:scale-105 transition"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="flex gap-3">
            {topPicks.map((item, i) => (
              <CarouselItem
                key={i}
                className="
                  basis-4/5
                  sm:basis-1/2
                  lg:basis-1/3
                  pl-2
                  flex justify-center
                "
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  onClick={() => router.push(`/hotel/${i + 1}`)}
                  className="rounded-3xl bg-white shadow mb-5 p-4 overflow-hidden w-full max-w-[30rem] cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className="mt-3">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.tag}</p>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* RIGHT Arrow */}
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:scale-105 transition"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
