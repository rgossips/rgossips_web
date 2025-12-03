"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { FaChevronLeft, FaChevronRight, FaInstagram } from "react-icons/fa";
import SectionTitle from "./SectionTitle";
import Image from "next/image";

import { motion } from "framer-motion";

export default function CreatorsCarousel() {
  const [api, setApi] = useState(null);

  const creators = [
    {
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "kishushroff",
      followers: "1.4M+",
    },
    {
      image:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "kritikadagar21",
      followers: "1.9M+",
    },
    {
      image:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "iammukul",
      followers: "1.3M+",
    },
    {
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "stylequeen",
      followers: "2.0M+",
    },
    {
      image:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "urbanvibes",
      followers: "950K+",
    },
    {
      image:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600",
      username: "travelwithme",
      followers: "2.3M+",
    },
  ];

  // Auto-scroll every 3 seconds
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="w-full py-14 px-4 bg-[#F4E5FF]">
      <div className="mx-auto ">
        <SectionTitle text="OUR TOP CREATORS" />

        <div className="relative mt-10">
          {/* LEFT ARROW */}
          <button
            onClick={() => api?.scrollPrev()}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white p-3 shadow-lg rounded-full hover:scale-105 transition"
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
            <CarouselContent className="flex gap-4">
              {creators.map((creator, i) => (
                <CarouselItem
                  key={i}
                  className="
                    basis-1/5
                    max-lg:basis-1/3
                    max-md:basis-1/2
                    max-sm:basis-full
                    flex justify-center
                  "
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-white rounded-3xl p-6 w-52 flex flex-col items-center shadow-md"
                  >
                    {/* Gradient Ring */}
                    <div className="p-[3px] rounded-full bg-gradient-to-r from-pink-500 to-yellow-400">
                      <Image
                        height={200}
                        width={200}
                        alt={creator.username}
                        src={creator.image}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    </div>

                    <p className="text-base font-semibold mt-3 text-center">
                      @{creator.username}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-gray-700 text-sm">
                      <FaInstagram className="text-pink-600" />
                      <span>{creator.followers}</span>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* RIGHT ARROW */}
          <button
            onClick={() => api?.scrollNext()}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white p-3 shadow-lg rounded-full hover:scale-105 transition"
          >
            <FaChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
