"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CreatorCard from "./CreatorCard";
import { createClient } from "@/utils/supabase/client";

// Built-in fallback shown until the admin publishes any rows in
// public.featured_creators. Same source-of-truth as the brand-side
// Top Creators carousel — admin manages both lists from one table.
const fallbackCreators = [
    {
      name: "sahilanandofficial",
      verified: true,
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

export default function CreatorsCarouselWithLink() {
  const supabase = createClient();
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [creators, setCreators] = useState(fallbackCreators);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("featured_creators")
        .select("username, display_name, avatar_url, followers_label, verified, instagram_url")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (cancelled) return;
      if (data && data.length > 0) {
        setCreators(
          data.map((r) => ({
            name: r.username,
            verified: !!r.verified,
            image: r.avatar_url || "",
            followers: r.followers_label || "",
            // CreatorCard renders these slots but the table doesn't carry
            // them — pass empty strings so the card hides the rows.
            posts: "",
            following: "",
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

  // Manual Auto-scroll logic
  useEffect(() => {
    if (!api) return;

    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3500); // 3.5 seconds

    return () => clearInterval(intervalId);
  }, [api]);

  // Update current index and snaps
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    setScrollSnaps(api.scrollSnapList());
    onSelect();

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // useEffect(() => {
  //   const fetchTestData = async () => {
  //     try {
  //       const data = await getLatestReelIds(); // Wait for the data
  //       console.log("Instagram Data Successfully Fetched:", data);
  //     } catch (error) {
  //       console.error("Failed to fetch test data:", error);
  //     }
  //   };

  //   fetchTestData();
  // }, []);
  return (
    <section className="w-full px-4 py-12">
      <SectionTitle text="OUR TOP CREATORS" />

      <div className="max-w-[1400px] mx-auto mt-10 relative group">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {creators.map((creator, index) => (
              <CarouselItem
                key={index}
                // basis-full = 1 item (mobile), lg:basis-1/4 = 4 items (laptop)
                className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className="flex justify-center h-full">
                  <CreatorCard {...creator} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Desktop Navigation Arrows */}
          <button
            onClick={() => api?.scrollPrev()}
            className="hidden lg:flex absolute -left-12 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full hover:bg-purple-600 hover:text-white transition-all border border-gray-100"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="hidden lg:flex absolute -right-12 top-1/2 -translate-y-1/2 bg-white shadow-lg p-3 rounded-full hover:bg-purple-600 hover:text-white transition-all border border-gray-100"
          >
            <FaChevronRight size={20} />
          </button>
        </Carousel>

        {/* Mobile Navigation Arrows */}
        <div className="flex justify-center gap-10 mt-8 lg:hidden">
          <button
            onClick={() => api?.scrollPrev()}
            className="p-3 bg-white shadow-md rounded-full border border-gray-100 active:scale-95"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="p-3 bg-white shadow-md rounded-full border border-gray-100 active:scale-95"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Unified Dots: Automatically calculates count based on visible cards */}
        <div className="flex justify-center mt-8 gap-2.5">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                current === i ? "btn-purple w-10" : "bg-gray-300 w-2.5"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
