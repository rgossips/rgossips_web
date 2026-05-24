"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { createClient } from "@/utils/supabase/client";

// Hand-curated fallback shown when the admin hasn't published any rows in
// public.featured_creators yet. As soon as admin adds entries, those take
// over via the useEffect query below.
const fallbackTopCreators = [
  {
    name: "sahilanandofficial",
    verified: true,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL",
    posts: "1454",
    followers: "1.4M",
    following: "1123",
    bio: "Sahil Nanda | Male",
    link: "https://www.instagram.com/sahilanandofficial/",
  },
  {
    name: "nonaberrry",
    verified: true,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5",
    posts: "860",
    followers: "798K",
    following: "1181",
    bio: "Naina Singh | Female",
    link: "https://www.instagram.com/nonaberrry/",
  },
  {
    name: "aditirajputofficial",
    verified: false,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo",
    posts: "319",
    followers: "166K",
    following: "102",
    bio: "Aditi Rajput | Female",
    link: "https://www.instagram.com/aditirajputofficial/",
  },
  {
    name: "alifestyledition",
    verified: false,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/1cCyYWXM-rJ8SV3s6EX3xYxvXCOYKmYNu",
    posts: "792",
    followers: "12.4K",
    following: "7103",
    bio: "Hassan Ali | Male",
    link: "https://www.instagram.com/alifestyledition/",
  },
  {
    name: "theyayawar",
    verified: false,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/1Gw5GOW8qUE0kXI6gj0ak23tN7oVIFtV7",
    posts: "652",
    followers: "29.4K",
    following: "453",
    bio: "Harsh Rawat | Male",
    link: "https://www.instagram.com/theyayawar/",
  },
  {
    name: "karishmatalwar93",
    verified: false,
    rating: "4.2",
    image:
      "https://lh3.googleusercontent.com/d/10tTiJ3qm15UAS8KUDr5Hs7EFdGPo7pvG",
    posts: "1606",
    followers: "366K",
    following: "1345",
    bio: "Karishma Talwar | Female",
    link: "https://www.instagram.com/karishmatalwar93",
  },
  {
    name: "vees_corner57",
    rating: "4.2",
    verified: false,
    image:
      "https://lh3.googleusercontent.com/d/1m2g3DGzTjlWrXoxibPvFsqq2wc5xy8Ni",
    posts: "1048",
    followers: "131K",
    following: "455",
    bio: "Vandna chopra | Female",
    link: "https://www.instagram.com/vees_corner57/",
  },
  {
    name: "nawab__adnan",
    rating: "4.2",
    verified: false,
    image:
      "https://lh3.googleusercontent.com/d/19CMc1g0nMAFE61V_aeYk9G6gGT2A9mMX",
    posts: "355",
    followers: "114K",
    following: "1136",
    bio: "Nawab Adnan | Male",
    link: "https://www.instagram.com/nawab__adnan/",
  },
  {
    name: "theshilpa_official",
    rating: "4.2",
    verified: false,
    image:
      "https://lh3.googleusercontent.com/d/173V34LvsTJ4n-UB6qE2S49cSm3junhkR",
    posts: "659",
    followers: "235K",
    following: "450",
    bio: "Shilpa Choudhary | Female",
    link: "https://www.instagram.com/theshilpa_official/",
  },
  {
    name: "roohh_lifetstyle",
    rating: "4.2",
    verified: false,
    image:
      "https://lh3.googleusercontent.com/d/1FBc3erStqqFdaH-C1wpCWtc11KIPJsmK",
    posts: "192",
    followers: "93K",
    following: "297",
    bio: "Rooh Sharma | Female",
    link: "https://www.instagram.com/roohh_lifestyle/",
  },
];

export const TopCreatorsCarousel = () => {
  const supabase = createClient();
  const [topCreators, setTopCreators] = useState(fallbackTopCreators);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("featured_creators")
        .select("username, display_name, avatar_url, followers_label, rating, verified, instagram_url")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (cancelled) return;
      if (data && data.length > 0) {
        setTopCreators(
          data.map((r) => ({
            name: r.username,
            verified: r.verified,
            rating: r.rating ? String(r.rating) : "—",
            image: r.avatar_url || "",
            followers: r.followers_label || "",
            bio: r.display_name || "",
            link: r.instagram_url,
          }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <section className="w-full px-4 lg:px-6 bg-white py-8 lg:py-10">
      {/* Header Section */}
      <div className="px-6 mb-6">
        <h2 className="text-2xl font-black text-[#1C115A]">Top Creators</h2>
        <p className="text-slate-500 font-medium text-sm">
          High impact, low cost
        </p>
      </div>

      {/* Carousel Section */}
      <div className="px-6">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {topCreators.map((creator, index) => (
              <CarouselItem
                key={index}
                className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
              >
                <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden group">
                  {/* Image Container */}
                  <div className="relative h-64 w-full">
                    <Image
                      src={creator.image}
                      alt={creator.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                      <Star
                        size={14}
                        className="fill-orange-400 text-orange-400"
                      />
                      <span className="text-xs font-black text-slate-800">
                        {creator.rating}
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-[#1C115A] text-lg leading-tight">
                          {creator.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                          <MapPin size={12} />
                          <span>
                            {creator.location} • {creator.followers} followers
                          </span>
                        </div>
                      </div>
                      <span className="text-[#5B3DF5] font-black text-sm">
                        {creator.priceRange}
                      </span>
                    </div>

                    {/* Action Button — opens the creator's Instagram in a
                        new tab. "View Profile" is shorthand for "see them on
                        the channel you'll book them from". */}
                    <a
                      href={creator.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full py-3.5 rounded-2xl bg-slate-50 text-[#1C115A] font-black text-sm hover:bg-[#5B3DF5] hover:text-white transition-all duration-300 cursor-pointer"
                    >
                      View on Instagram
                    </a>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};
