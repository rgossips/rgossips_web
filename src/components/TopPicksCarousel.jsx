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
import { useRouter } from "next/navigation";

// Firebase imports
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CarouselTopPicks() {
  const [api, setApi] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getOffers = async () => {
      setLoading(true);
      try {
        // Fetching from 'offers' collection where isActive is true
        // Note: If you haven't added 'isActive: true' in your Form,
        // remove this where clause or add it to the Form's handleSubmit.
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
    <section className="w-full px-4 relative">
      <SectionTitle text="TOP PICKS" />

      <div className="relative py-8">
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel opts={{ align: "start", loop: true }} setApi={setApi}>
          <CarouselContent className="flex gap-1">
            {offers.map((item) => (
              <CarouselItem
                key={item.id}
                className="basis-[85%] sm:basis-1/2 lg:basis-1/3 pl-2 flex justify-center"
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  // Navigating to the dynamic ID from Firestore
                  onClick={() => router.push(`/offers/${item.id}`)}
                  className="rounded-3xl bg-white shadow-sm border border-gray-100 mb-5 p-4 w-full cursor-pointer"
                >
                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-gray-100">
                    {/* Using the imageUrl field from your Form */}
                    <Image
                      src={
                        item.imageUrl || "https://via.placeholder.com/400x300"
                      }
                      alt={item.metadata?.title || "Offer"}
                      fill
                      className="object-cover"
                    />
                    {/* Category Tag instead of generic tag */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight text-blue-600 shadow-sm">
                      {item.category}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-start gap-2">
                    <div className="flex-1">
                      {/* Accessing title from metadata as defined in your Form */}
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1 leading-tight">
                        {item.metadata?.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {item.brand?.name} •{" "}
                        {item.metadata?.location?.split(",")[0]}
                      </p>
                    </div>

                    {/* Deliverables Summary Badge */}
                    <div className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-[10px] text-center">
                      <span className="block font-bold text-gray-700">
                        {item.deliverables?.reels || 0}
                      </span>
                      <span className="text-gray-400 uppercase">Reels</span>
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-all"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
