"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FaInstagram, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import SectionTitle from "./SectionTitle";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ---------------------------------- */
/* Seed Data                           */
/* ---------------------------------- */

const initialStays = [
  {
    title: "Villa Nautica",
    tag: "Luxury Stay",
    imageUrl:
      "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg",
    category: "hotels",
    brand: {
      id: "villa_nautica",
      name: "Villa Nautica",
      instagramFollowers: "100K+",
    },
    metadata: {
      nights: "2 Nights 3 Days",
      location: "Lankanfinolhu, Maldives",
      avgPrice: "₹",
      priceType: "FREE",
    },
    applications: [],
    isActive: true,
  },
  {
    title: "Geetanjali Salon",
    tag: "Luxury Salon",
    imageUrl:
      "https://images.pexels.com/photos/318236/pexels-photo-318236.jpeg",
    category: "hotels",
    brand: {
      id: "geetanjali",
      name: "Geetanjali Salon",
      instagramFollowers: "30K+",
    },
    metadata: {
      nights: "1 Day Luxury",
      location: "Gurugram, India",
      avgPrice: "₹₹",
      priceType: "FREE",
    },
    applications: [],
    isActive: true,
  },
  {
    title: "Taj Exotica",
    tag: "Luxury Resort",
    imageUrl:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg",
    category: "hotels",
    brand: {
      id: "taj_exotica",
      name: "Taj Exotica",
      instagramFollowers: "200K+",
    },
    metadata: {
      nights: "3 Nights 4 Days",
      location: "South Male Atoll",
      avgPrice: "₹₹₹",
      priceType: "FREE",
    },
    applications: [],
    isActive: true,
  },
];

/* ---------------------------------- */
/* Firebase Helpers                    */
/* ---------------------------------- */

const seedStaysIfEmpty = async () => {
  const q = query(
    collection(db, "offers"),
    where("category", "==", "hotels"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  // if (!snapshot.empty) return;

  for (const stay of initialStays) {
    await addDoc(collection(db, "offers"), {
      ...stay,
      createdAt: new Date(),
    });
  }

  console.log("✅ Stays seeded");
};

const fetchStays = async () => {
  const snapshot = await getDocs(
    query(
      collection(db, "offers"),
      where("category", "==", "hotels"),
      where("isActive", "==", true)
    )
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* ---------------------------------- */
/* Component                           */
/* ---------------------------------- */

export default function StayCarousel() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [stays, setStays] = useState([]);
  const router = useRouter();

  // Seed + fetch
  useEffect(() => {
    const init = async () => {
      // await seedStaysIfEmpty();
      const data = await fetchStays();
      setStays(data);
    };
    init();
  }, []);

  // Auto slide
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Sync dots
  useEffect(() => {
    if (!api) return;
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <section className="w-full px-3 py-6">
      <SectionTitle text="PLAN YOUR STAY WITH US" />

      <div className="relative w-full">
        {/* Left */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel opts={{ align: "start", loop: true }} setApi={setApi}>
          <CarouselContent className="-ml-3">
            {stays.map((stay, index) => (
              <CarouselItem
                key={stay.id}
                className="pl-3 basis-11/12 sm:basis-1/2 md:basis-1/3 cursor-pointer"
                onClick={() => router.push(`/hotel/${stay.id}`)}
              >
                <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
                  {/* Image */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={stay.imageUrl}
                      alt={stay.title}
                      fill
                      className="object-cover"
                    />

                    <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold text-purple-600">
                      ✨ {stay?.metadata?.nights}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{stay.title}</h3>

                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <span>📍</span>
                      <span>{stay?.metadata?.location}</span>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2 font-medium">
                        <FaInstagram className="text-pink-500" />
                        {stay?.brand?.instagramFollowers}
                      </div>

                      <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                        {stay?.metadata?.priceType}
                      </span>
                    </div>
                  </div>
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

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {stays.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              current === i ? "bg-purple-600 w-4" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
