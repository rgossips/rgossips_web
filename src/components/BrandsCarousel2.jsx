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
import { collection, getDocs, query, where } from "firebase/firestore";

export default function BrandsCarousel() {
  const [brands, setBrands] = useState([]);
  const [api, setApi] = useState(null);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        // 1. Create a query with multiple filters
        const brandsRef = collection(db, "brands");
        const q = query(
          brandsRef,
          where("isActive", "==", true),
          where("manualVerified", "==", 2),
        );

        // 2. Execute the filtered query
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

  // Auto slide
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  if (!brands.length) return null;

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text="BRANDS YOU'LL LOVE" />

      <div className="relative w-full">
        {/* Left */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel
          opts={{ align: "start", loop: true }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
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

        {/* Right */}
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
