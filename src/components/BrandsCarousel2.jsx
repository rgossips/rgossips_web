"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import SectionTitle from "./SectionTitle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";

export default function BrandsCarousel() {
  const [brands, setBrands] = useState([]);
  const [api, setApi] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandsRef = collection(db, "brands");
        // Added limit(4) as requested
        const q = query(
          brandsRef,
          where("isActive", "==", true),
          where("manualVerified", "==", 2),
          limit(4),
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBrands(list);
      } catch (err) {
        console.error("Failed to fetch brands:", err);
      }
    };

    fetchBrands();
  }, []);

  // Auto slide only active if there are enough items to slide
  useEffect(() => {
    if (!api || brands.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  if (!brands.length) return null;

  return (
    <section className="w-full px-6 py-10 lg:py-16">
      <SectionTitle text="BRANDS YOU'LL LOVE" />

      <div className="relative w-full max-w-7xl mx-auto mt-8">
        {/* Navigation Buttons - Hidden on Laptop (since it's a grid) */}
        <button
          onClick={() => api?.scrollPrev()}
          className="lg:hidden absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl p-3 rounded-full text-slate-800"
        >
          <FaChevronLeft size={16} />
        </button>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            // watchDrag: true
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-4 lg:ml-0 lg:grid lg:grid-cols-4 lg:gap-6">
            {brands.map((b) => (
              <CarouselItem
                key={b.id}
                className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-1/6"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-md">
                    <Image
                      src={b.image}
                      alt={b.name}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <p className="text-sm mt-3 text-center">{b.name}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <button
          onClick={() => api?.scrollNext()}
          className="lg:hidden absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl p-3 rounded-full text-slate-800"
        >
          <FaChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
