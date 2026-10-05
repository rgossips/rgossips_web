"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { createClient } from "@/utils/supabase/client";
import EliteBadge from "@/components/EliteBadge";
import { fetchEliteSpotlight, mergeSpotlight } from "@/lib/spotlight";

// Instagram's Login API returns a 206x206 profile picture and
// refresh-instagram mirrors exactly that into storage, so most spotlight
// photos are tiny. Stretched across the card they were visibly soft.
//
// The width was doing the damage, not the height: object-cover scales by the
// LARGER ratio, so a ~430px-wide card upscaled a 206px photo 2.1x however
// short the card became. Shrinking the image area therefore means capping the
// photo at its own size, not just lowering the box — a small photo renders
// centred at 1:1 over a soft wash, while a real upload (the profile cropper
// allows up to 1600px) still fills the card edge to edge.
const FULL_BLEED_MIN_WIDTH = 640;

function CreatorPhoto({ src, alt }) {
  // 0 until the browser reports the real size. Held hidden until then so the
  // card does not flash one treatment and snap to the other.
  const [naturalWidth, setNaturalWidth] = useState(0);
  const fullBleed = naturalWidth >= FULL_BLEED_MIN_WIDTH;

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
        onLoad={(e) => setNaturalWidth(e.currentTarget.naturalWidth || 0)}
        className={`transition-opacity duration-200 ${naturalWidth ? "opacity-100" : "opacity-0"} ${
          fullBleed
            ? "object-cover group-hover:scale-105 transition-transform duration-500"
            : // Contained and centred: never drawn larger than it really is.
              "object-contain p-6"
        }`}
      />
    </div>
  );
}

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
  const t = useTranslations("BrandsTopCreatorCarousel");
  const supabase = createClient();
  const [topCreators, setTopCreators] = useState(fallbackTopCreators);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Elite spotlight and the admin's picks load together; Elite leads.
      const [{ data }, elite] = await Promise.all([
        supabase
          .from("featured_creators")
          .select("username, display_name, avatar_url, followers_label, rating, verified, instagram_url")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        fetchEliteSpotlight(supabase),
      ]);
      if (cancelled) return;
      const curated =
        data && data.length > 0
          ? data.map((r) => ({
              name: r.username,
              verified: r.verified,
              rating: r.rating ? String(r.rating) : "—",
              image: r.avatar_url || "",
              followers: r.followers_label || "",
              bio: r.display_name || "",
              link: r.instagram_url,
            }))
          : fallbackTopCreators;
      setTopCreators(mergeSpotlight(elite, curated));
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <section className="w-full px-4 lg:px-6 bg-white py-8 lg:py-10">
      {/* Header Section */}
      <div className="px-6 mb-6">
        <h2 className="bx-h2">{t("title")}</h2>
        <p className="text-[#6B6785] font-medium text-sm">
          {t("subtitle")}
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
                <div className="bg-white rounded-4xl border border-[#E4E9F4] shadow-sm overflow-hidden group">
                  {/* Image Container */}
                  <div className="relative h-44 w-full">
                    {creator.image ? (
                      <CreatorPhoto src={creator.image} alt={creator.name} />
                    ) : (
                      // next/image throws on an empty src — an Elite creator
                      // may not have a photo yet.
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 grid place-items-center text-white text-6xl font-black">
                        {(creator.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Elite spotlight rows carry the badge in place of a
                        rating — there is no rating on a live profile. */}
                    {creator.elite ? (
                      <EliteBadge size="md" className="absolute top-4 right-4 shadow-sm" />
                    ) : (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                      <Star
                        size={14}
                        className="fill-orange-400 text-orange-400"
                      />
                      <span className="text-xs font-black text-[#16224E]">
                        {creator.rating}
                      </span>
                    </div>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-[#16224E] text-lg leading-tight">
                          {creator.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[#9C97B8] text-xs font-bold">
                          <MapPin size={12} />
                          <span>
                            {t("followersLine", {
                              location: creator.location,
                              followers: creator.followers,
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="text-[#6A66C9] font-black text-sm">
                        {creator.priceRange}
                      </span>
                    </div>

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
