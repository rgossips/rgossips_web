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

import { where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { collection, getDocs, addDoc, query, limit } from "firebase/firestore";

const initialOffers = [
  {
    title: "Summer Hotel Picks",
    tag: "For Macro Influencers",
    imageUrl:
      "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg",
    category: "hotels",
    brand: {
      id: "brand_hotel",
      name: "Grand Hotel",
      logoUrl:
        "https://images.pexels.com/photos/9367103/pexels-photo-9367103.jpeg",
    },
    applications: [],
    isActive: true,
  },
  {
    title: "Luxury Spa Deals",
    tag: "Relaxation Essentials",
    imageUrl:
      "https://images.pexels.com/photos/4004119/pexels-photo-4004119.jpeg",
    category: "service",
    brand: {
      id: "brand_spa",
      name: "Heaven Spa",
      logoUrl:
        "https://images.pexels.com/photos/8385212/pexels-photo-8385212.jpeg",
    },
    applications: [],
    isActive: true,
  },
  {
    title: "Foodie Spots",
    tag: "Tasty Experiences",
    imageUrl:
      "https://images.pexels.com/photos/5881729/pexels-photo-5881729.jpeg",
    category: "restaurant",
    brand: {
      id: "brand_food",
      name: "Foodies Hub",
      logoUrl:
        "https://images.pexels.com/photos/29230056/pexels-photo-29230056.jpeg",
    },
    applications: [],
    isActive: true,
  },
];

const seedOffersIfEmpty = async () => {
  const offersRef = collection(db, "offers");

  const snapshot = await getDocs(query(offersRef, limit(1)));

  // Already seeded → skip
  if (!snapshot.empty) return;

  for (const offer of initialOffers) {
    await addDoc(offersRef, {
      ...offer,
      createdAt: new Date(),
    });
  }

  console.log("✅ Offers seeded");
};

const fetchOffers = async () => {
  const snapshot = await getDocs(
    query(collection(db, "offers"), where("isActive", "==", true))
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

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
  const [offers, setOffers] = useState([]);
  const router = useRouter();

  // Auto-scroll
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Seed + Fetch
  useEffect(() => {
    const init = async () => {
      await seedOffersIfEmpty();
      const data = await fetchOffers();
      setOffers(data);
    };
    init();
  }, []);

  return (
    <section className="w-full px-4 relative">
      <SectionTitle text="TOP PICKS" />

      <div className="relative py-8">
        {/* LEFT */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
        >
          <FaChevronLeft size={18} />
        </button>

        <Carousel opts={{ align: "start", loop: true }} setApi={setApi}>
          <CarouselContent className="flex gap-3">
            {[...offers, ...offers].map((item, idx) => (
              <CarouselItem
                key={idx}
                className="basis-4/5 sm:basis-1/2 lg:basis-1/3 pl-2 flex justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  onClick={() => router.push(`/hotel/${item.id}`)}
                  className="rounded-3xl bg-white shadow mb-5 p-4 w-full max-w-[30rem] cursor-pointer"
                >
                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-3">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.tag}</p>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* RIGHT */}
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 z-20 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
        >
          <FaChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
