/* ---------------------------------- */
/* Firebase Helpers                   */
/* ---------------------------------- */

import { FaChevronLeft, FaChevronRight, FaInstagram } from "react-icons/fa";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import SectionTitle from "./SectionTitle";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

const fetchStays = async () => {
  try {
    const q = query(
      collection(db, "offers"),
      where("category", "==", "hotels"),
      where("isActive", "==", true),
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
    <section className="w-full px-3 py-6">
      <SectionTitle text="PLAN YOUR STAY WITH US" />

      <div className="relative w-full">
        {/* Navigation Buttons */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel opts={{ align: "start", loop: true }} setApi={setApi}>
          <CarouselContent className="-ml-3">
            {stays.map((stay) => (
              <CarouselItem
                key={stay.id}
                className="pl-3 basis-11/12 sm:basis-1/2 md:basis-1/3 cursor-pointer"
                onClick={() => router.push(`/hotel/${stay.id}`)}
              >
                <div className="rounded-2xl bg-white shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image Container */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={stay.imageUrl || "/placeholder-hotel.jpg"}
                      alt={stay.displayTitle}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />

                    {/* Badge for Duration */}
                    <div className="absolute top-3 left-3 bg-white/95 px-3 py-1 rounded-full text-xs font-bold text-purple-600 shadow-sm">
                      ✨ {stay.nights}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold truncate">
                      {stay.displayTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <span className="text-xs">📍</span>
                      <span className="truncate">{stay.location}</span>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <FaInstagram className="text-pink-500" size={16} />
                        <span>
                          {stay.brand?.instagramFollowers || "Contact for info"}
                        </span>
                      </div>

                      <span className="bg-purple-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
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
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:bg-gray-50 transition-colors"
        >
          <FaChevronRight size={18} />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 gap-2">
        {stays.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === i ? "bg-purple-600 w-6" : "bg-gray-300 w-2"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
