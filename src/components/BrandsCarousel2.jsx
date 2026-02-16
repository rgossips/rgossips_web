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
      name: "Glow Beauty",
      image:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=400",
    },
    {
      id: 2,
      name: "TechNova",
      image:
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=400",
    },
    {
      id: 3,
      name: "FitFuel",
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400",
    },
    {
      id: 4,
      name: "Urban Edge",
      image:
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=400",
    },
    {
      id: 5,
      name: "Style Hub",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=400",
    },
    {
      id: 6,
      name: "Pure Care",
      image:
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400",
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
                      src={b.image}
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
