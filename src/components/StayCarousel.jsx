"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import SectionTitle from "./SectionTitle";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Fallback shown while featured_campaigns has no active rows.
const FALLBACK_STAYS = [
  {
    id: "stay-1",
    displayTitle: "The Azure Glass Resort",
    brandName: "Azure Hospitality",
    description: "Luxury overwater villa partnerships",
    location: "Maldives, Indian Ocean",
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800",
    priceType: "Full Collab",
    brand: { instagramFollowers: "120K" },
  },
  {
    id: "stay-2",
    displayTitle: "Urban Oasis Suites",
    brandName: "Urban Oasis",
    description: "City escapes for lifestyle creators",
    location: "Downtown Tokyo, Japan",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
    priceType: "Gifting",
    brand: { instagramFollowers: "45K" },
  },
  {
    id: "stay-3",
    displayTitle: "Alpine Heritage Lodge",
    brandName: "Heritage Alps",
    description: "Boutique alpine retreats",
    location: "Zermatt, Switzerland",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
    priceType: "Paid Stay",
    brand: { instagramFollowers: "88K" },
  },
  {
    id: "stay-4",
    displayTitle: "Terrace Palms Boutique",
    brandName: "Terrace Palms",
    description: "Moroccan riad collabs",
    location: "Marrakech, Morocco",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800",
    priceType: "Full Collab",
    brand: { instagramFollowers: "250K" },
  },
];

export default function StayCarousel() {
  const t = useTranslations("StayCarousel");
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(t("defaultTitle"));
  const router = useRouter();

  // Same list-featured-campaigns response feeds Stay + the Deal Of The Day
  // carousels above so the influencer home stays internally consistent.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-featured-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ section: "stay" }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data?.sectionTitle) setSectionTitle(data.sectionTitle);
        if (Array.isArray(data?.campaigns) && data.campaigns.length > 0) {
          setStays(
            data.campaigns.map((c) => ({
              id: c.id,
              displayTitle: c.title,
              brandName: c.brandName || "",
              // Short description fed into the badge — trimmed so it fits
              // the pill without wrapping. Falls back to the campaign
              // category if no description is set.
              description: (c.description || "").slice(0, 60) || c.category || t("brandCollab"),
              location: c.location,
              imageUrl: c.bannerImage || c.brandLogo || "",
              priceType: c.priceType,
              brand: { instagramFollowers: c.brandInstagram ? `@${c.brandInstagram}` : "" },
            })),
          );
        } else {
          setStays(FALLBACK_STAYS);
        }
      } catch {
        if (!cancelled) setStays(FALLBACK_STAYS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync current state with carousel
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // AUTO SCROLL LOGIC
  useEffect(() => {
    if (!api || isHovered) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api, isHovered]);

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        <p className="text-slate-400 font-medium animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  return (
    <section className="w-full px-4 py-12 flex flex-col items-center overflow-hidden">
      <SectionTitle text={sectionTitle} />

      <div className="w-full flex justify-center mt-10" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="relative w-full max-w-[1480px]">
          {/* Navigation Buttons - Hidden on Mobile for better UX */}
          <button
            onClick={() => api?.scrollPrev()}
            className="hidden cursor-pointer md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-30 bg-white shadow-2xl p-4 rounded-full hover:scale-110 transition-all text-slate-800"
          >
            <FaChevronLeft size={18} />
          </button>

          <Carousel
            opts={{ align: "center", loop: true }}
            setApi={setApi}
            // Inner padding gives the centred card's shadow room to breathe.
            // The wrapping section has overflow-hidden (needed for the side
            // peek effect), which otherwise clips the bottom of the card's
            // shadow.
            className="w-full py-6"
          >
            <CarouselContent className="-ml-2 md:-ml-4" style={{ paddingBottom: 20 }}>
              {stays.map((stay, i) => (
                <CarouselItem key={stay.id} className="pl-2 md:pl-4 basis-[92%] sm:basis-2/3 lg:basis-[60%]">
                  <div
                    onClick={() => router.push(`/influencer/offers/${stay.id}`)}
                    className={`relative w-full rounded-[40px] bg-white border border-slate-100 overflow-hidden transition-all duration-500 cursor-pointer shadow-lg
                      ${current === i ? "scale-100 opacity-100 shadow-2xl" : "scale-95 opacity-60 grayscale-[40%]"}
                    `}
                  >
                    {/* Image Container */}
                    <div className="relative w-full h-[280px] md:h-[380px] overflow-hidden">
                      <Image src={stay.imageUrl || "/placeholder-hotel.jpg"} alt={stay.displayTitle} fill className="object-cover transition-transform duration-[2000ms] hover:scale-110" />
                      {/* Glassmorphism Badge — brand name only.
                          The short description is rendered below the
                          title in the body, not in the badge. */}
                      <div className="absolute top-6 left-6 max-w-[80%] bg-white/20 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full text-white shadow-xl">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-tight line-clamp-1">{stay.brandName || stay.displayTitle}</p>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-8">
                      <div className="mb-4">
                        <h3 className="text-2xl line-clamp-1 text-ellipsis font-black text-slate-800 uppercase tracking-tighter">{stay.displayTitle}</h3>
                        {stay.description && <p className="text-slate-600 text-sm font-medium mt-1 line-clamp-2">{stay.description}</p>}
                        <p className="text-slate-500 text-xs font-semibold mt-2">{stay.location}</p>
                      </div>

                      <div className="flex justify-start items-center border-t border-slate-50 pt-6 mt-2">
                        <span
                          onClick={() => {
                            router.push(`/offers/${stay?.id}`);
                          }}
                          className="bg-gradient-to-r cursor-pointer from-[#8E2DE2] to-[#F6339A] text-white text-[10px] uppercase tracking-[0.2em] font-black px-7 py-3 rounded-full shadow-lg shadow-pink-200"
                        >
                          {t("applyNow")}
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
            className="hidden cursor-pointer md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-30 bg-white shadow-2xl p-4 rounded-full hover:scale-110 transition-all text-slate-800"
          >
            <FaChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Progress Line Dot Indicator */}
      <div className="flex justify-center mt-10 gap-3">
        {stays.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-700 ${current === i ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] w-12" : "bg-slate-200 w-3 hover:bg-slate-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
