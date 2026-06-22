"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import SectionTitle from "./SectionTitle";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";

// Fallback list — replaced at runtime by rows in public.creator_stories
// when the admin has published any. The shape mirrors the DB row so the
// carousel doesn't care where the data came from.
const fallbackStories = [
  {
    name: "sahilanandofficial",
    image:
      "https://lh3.googleusercontent.com/d/1gpAUlvG4g-c8fCqx_YJUPZYDwUTDSSfL",
    link: "/creatorReels/sahil.mp4",
  },
  {
    name: "nonaberrry",
    image:
      "https://lh3.googleusercontent.com/d/17FV8146Zu6KAYNxfTEj-SGxj40nlyo_5",
    link: "/creatorReels/nonaberry.mp4",
  },
  {
    name: "aditirajputofficial",
    image:
      "https://lh3.googleusercontent.com/d/18IKmd6vgmGBOz9T5KVBAm8Oozl5iQyyo",
    link: "/creatorReels/aditi.mp4",
  },
  {
    name: "alifestyledition",
    image:
      "https://lh3.googleusercontent.com/d/1cCyYWXM-rJ8SV3s6EX3xYxvXCOYKmYNu",
    link: "/creatorReels/ali.mp4",
  },
  {
    name: "theyayawar",
    image:
      "https://lh3.googleusercontent.com/d/1Gw5GOW8qUE0kXI6gj0ak23tN7oVIFtV7",

    link: "/creatorReels/yaya.mp4",
  },
  {
    name: "karishmatalwar93",
    image:
      "https://lh3.googleusercontent.com/d/10tTiJ3qm15UAS8KUDr5Hs7EFdGPo7pvG",
    link: "/creatorReels/karishma.mp4",
  },
  {
    name: "vees_corner57",
    image:
      "https://lh3.googleusercontent.com/d/1m2g3DGzTjlWrXoxibPvFsqq2wc5xy8Ni",
    link: "/creatorReels/veers.mp4",
  },
  {
    name: "nawab__adnan",
    image:
      "https://lh3.googleusercontent.com/d/19CMc1g0nMAFE61V_aeYk9G6gGT2A9mMX",
    link: "/creatorReels/nawab.mp4",
  },
];

const DEFAULT_TITLE = "TOP CREATOR STORIES";

export default function CreatorStories() {
  const supabase = createClient();
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [stories, setStories] = useState(fallbackStories);
  const [sectionTitle, setSectionTitle] = useState(DEFAULT_TITLE);

  // Pull admin-published stories + the editable section title. When the
  // stories table is empty we stay on the hardcoded fallback so the
  // section never renders blank.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storiesRes, titleRes] = await Promise.all([
        supabase
          .from("creator_stories")
          .select("username, avatar_url, video_url, poster_url")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        supabase
          .from("homepage_settings")
          .select("value")
          .eq("key", "creator_stories_section_title")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (storiesRes.data && storiesRes.data.length > 0) {
        setStories(
          storiesRes.data.map((r) => ({
            name: r.username,
            image: r.avatar_url || r.poster_url || "",
            link: r.video_url,
          }))
        );
      }
      if (titleRes.data?.value) setSectionTitle(titleRes.data.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Auto slide every 3 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

  // Update dot index
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const getEmbedLink = (url) => {
    const baseUrl = url.split("?")[0]; // remove queries
    const normalizedUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    return `${normalizedUrl}embed`;
  };

  return (
    <section className="w-full px-3 py-6 lg:px-8">
      {/* Heading */}
      <SectionTitle text={sectionTitle} />

      {/* Carousel */}
      {/* Carousel Wrapper with Arrows */}
      <div className="relative w-full">
        {/* Left Arrow */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:scale-105"
        >
          <FaChevronLeft size={18} />
        </button>

        {/* Carousel */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {stories.map((item, index) => (
              <CarouselItem
                key={index}
                className="pl-3 basis-3/4 sm:basis-1/3 md:basis-1/4"
              >
                <div className="rounded-2xl overflow-hidden shadow-md relative aspect-[9/16] bg-black">
                  {/* video */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-zinc-900 border border-white/10">
                    {/* 2. THE IFRAME (Scaled and moved to hide the header/footer) */}
                    {/* <div className="absolute inset-0 w-full h-[120%] max-h-[415px] lg:max-h-[500px] -top-[10%]">
                      <iframe
                        src={`${item.link.split("?")[0]}embed/captioned/`}
                        className="w-full h-full border-0"
                        scrolling="no"
                        allowTransparency="true"
                      ></iframe>
                    </div> */}
                    <video
                      key={item.link} // Forces re-render to trigger autoplay on slide
                      autoPlay
                      loop
                      muted
                      playsInline // Required for iOS/Mobile autoplay
                      preload="auto"
                      className="w-full h-full object-cover"
                    >
                      <source src={item.link} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* 3. CLICK SHIELD (Prevents clicking into the IG app, allows swiping) */}
                    <div
                      className="absolute inset-0 z-10 bg-transparent cursor-pointer"
                      onClick={() => window.open(item.link, "_blank")}
                    />

                    {/* 4. CLEAN OVERLAY (Your own custom UI) */}
                    {/* <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
                        <img
                          src={item.image}
                          alt=""
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="text-white text-xs font-semibold shadow-black drop-shadow-md">
                        @{item.name}
                      </span>
                    </div> */}
                  </div>
                  {/* creator & brand */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                      <Image
                        src={item.image}
                        alt="creator"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* <span className="text-white font-semibold text-md">X</span> */}

                    {/* <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                      <Image
                        src={item.brandImg}
                        alt="brand"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </div> */}
                  </div>

                  {/* creator username */}
                  <div className="absolute bottom-2 right-4 text-white text-sm opacity-90">
                    {item.name}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Right Arrow */}
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md p-2 rounded-full hover:scale-105"
        >
          <FaChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {stories.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all ${
              current === i ? "btn-purple w-4" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
