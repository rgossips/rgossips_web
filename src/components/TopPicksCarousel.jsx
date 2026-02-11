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

// Firebase imports
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CarouselTopPicks() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getOffers = async () => {
      setLoading(true);
      try {
        const offersRef = collection(db, "offers");
        const q = query(offersRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOffers(data);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    getOffers();
  }, []);

  if (loading || offers.length === 0) return null;

  return (
    <section className="w-full relative py-6 px-3 lg:px-8">
      {/* Container for title to match horizontal padding */}
      <div className="px-6 mb-4">
        <div className="flex justify-between items-center">
          <SectionTitle text="JOURNEY TOGETHER" />
        </div>
      </div>

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps", // Ensures it doesn't scroll past the last item
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {offers.map((item) => (
              <CarouselItem
                key={item.id}
                // basis-4/5 gives that "peek" effect (80% width)
                // basis-full on tiny screens, basis-1/3 on desktop
                className="pl-4 basis-[82%] sm:basis-1/2 lg:basis-1/3"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/offers/${item.id}`)}
                  className="rounded-[32px] bg-white overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={
                        item.imageUrl || "https://via.placeholder.com/400x300"
                      }
                      alt={item.metadata?.title || "Offer"}
                      fill
                      className="object-cover"
                    />
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#D61F69] shadow-sm">
                      {item.category || "Lifestyle"}
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
                          {item.brand?.name || "Brand Name"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.metadata?.location?.split(",")[0]}
                        </p>
                      </div>

                      {/* CTA Button Style as seen in image */}
                      <div className="bg-[#D61F69] text-white text-[10px] font-bold px-4 py-2 rounded-full">
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
