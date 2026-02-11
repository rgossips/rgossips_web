/* ---------------------------------- */
/* Firebase Helpers                   */
/* ---------------------------------- */

import { FaChevronLeft, FaChevronRight, FaInstagram } from "react-icons/fa";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import SectionTitle from "./SectionTitle";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const fetchStays = async () => {
  try {
    const q = query(
      collection(db, "offers"),
      where("category", "==", "hotels"),
      where("isActive", "==", true),
      limit(5),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure nested fields have fallbacks to prevent UI crashes
        displayTitle: data.title || data.metadata?.title || "Luxury Stay",
        location: data.metadata?.location || "Location TBD",
        nights: data.metadata?.nights || "Flexible Duration",
        priceType: data.metadata?.priceType || "FREE",
      };
    });
  } catch (error) {
    console.error("Error fetching stays:", error);
    return [];
  }
};

export default function StayCarousel() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchStays();
      setStays(data);
      setLoading(false);
    };
    init();
  }, []);

  // ... (Auto slide and Sync dots effects remain same)

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        Loading Stays...
      </div>
    );
  }

  return (
    <section className="w-full px-2 py-8 flex flex-col items-center">
      <SectionTitle text="PLAN YOUR STAY WITH US" />
      <div className="w-full flex justify-center mt-4">
        <div className="relative w-full max-w-2xl">
          {/* Navigation Buttons (overlayed) */}
          <button
            onClick={() => api?.scrollPrev()}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <FaChevronLeft size={22} />
          </button>
          <Carousel opts={{ align: "center", loop: true }} setApi={setApi}>
            <CarouselContent>
              {stays.map((stay) => (
                <CarouselItem
                  key={stay.id}
                  className="flex justify-center cursor-pointer"
                  onClick={() => router.push(`/offers/${stay.id}`)}
                >
                  <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-xl border overflow-hidden hover:shadow-2xl transition-shadow flex flex-col">
                    {/* Image Container */}
                    <div className="relative w-full h-[260px] md:h-[320px] lg:h-[340px] overflow-hidden">
                      <Image
                        src={stay.imageUrl || "/placeholder-hotel.jpg"}
                        alt={stay.displayTitle}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                      />
                      {/* Badge for Duration */}
                      <div className="absolute top-4 left-4 bg-white/95 px-4 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                        Day Luxury
                      </div>
                    </div>
                    {/* Card Content */}
                    <div className="p-6 pb-4">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {stay.displayTitle}
                      </h3>
                      <div className="text-slate-500 text-sm mb-4">
                        {stay.location}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 font-semibold text-base">
                          <FaInstagram className="text-pink-500" size={18} />
                          <span>
                            {stay.brand?.instagramFollowers || "30K+"}
                          </span>
                        </div>
                        <span className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-xs uppercase tracking-wider font-bold px-6 py-2 rounded-full">
                          {stay.priceType}
                        </span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <button
            onClick={() => api?.scrollNext()}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <FaChevronRight size={22} />
          </button>
        </div>
      </div>
      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 gap-2">
        {stays.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === i
                ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] w-6"
                : "bg-gray-300 w-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
