"use client";

import React, { useEffect, useState } from "react";
import { Star, Video, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchServices, formatINR, iconForName } from "@/lib/services";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const TopServices = () => {
  const t = useTranslations("TopServices");
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServices();
      if (cancelled) return;
      setServices(data.slice(0, 7)); // featured + 6 in the right list
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track active slide for the dot indicator.
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  // Auto-advance one slide every 3.5s; Embla's loop wraps back to start.
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 3500);
    return () => clearInterval(interval);
  }, [api]);

  if (loading) {
    return (
      <section className="w-full py-8 lg:py-12 px-4 lg:px-10 bg-white flex justify-center">
        <Loader2 size={24} className="animate-spin text-pink-500" />
      </section>
    );
  }

  if (services.length === 0) return null;

  const featured = services[0];
  const rest = services.slice(1);

  return (
    <section className="w-full py-6 lg:py-10 px-4 lg:px-10 bg-white">
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">{t("title")}</h2>
          <p className="text-sm text-slate-400">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button onClick={() => router.push("/influencer/services")} className="text-sm font-bold text-[#F6339A] hover:underline flex items-center gap-1 cursor-pointer">
            {t("viewAll")} <span className="text-lg">›</span>
          </button>
        </div>
      </div>

      {/* ── MOBILE: one-card-at-a-time auto-flowing carousel ── */}
      <div className="lg:hidden">
        <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
          <CarouselContent className="-ml-3">
            {services.map((s) => (
              <CarouselItem key={s.id} className="pl-3 basis-[92%]">
                <CarouselCard service={s} onClick={() => router.push(`/influencer/services/${s.slug}`)} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {services.length > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${current === i ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] w-8" : "bg-slate-200 w-2"}`}
                aria-label={t("goToService", { number: i + 1 })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: featured + list ── */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        <FeaturedCard service={featured} onClick={() => router.push(`/influencer/services/${featured.slug}`)} />

        <div className="col-span-7 space-y-3">
          {rest.map((s) => (
            <ServiceRow key={s.id} service={s} onClick={() => router.push(`/influencer/services/${s.slug}`)} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopServices;

// ── Featured left-side card ─────────────────────────────────────────────
function FeaturedCard({ service, onClick }) {
  const t = useTranslations("TopServices");
  const Icon = iconForName(service.icon_name);
  const hasImage = !!service.featured_image_url;
  return (
    <div onClick={onClick} className="col-span-5 flex flex-col group cursor-pointer border border-slate-200 hover:shadow-lg rounded-4xl overflow-hidden transition-shadow">
      <div className={`relative aspect-[4/3] flex items-center justify-center overflow-hidden ${hasImage ? "bg-slate-100" : `bg-gradient-to-br ${service.hero_gradient}`}`}>
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.featured_image_url} alt={service.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
            <span className="text-pink-500">⚡</span> {t("topRated")}
          </span>
          <span className="bg-slate-900/70 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full">{service.tag}</span>
        </div>
        {!hasImage && <Icon size={84} strokeWidth={1.2} className="text-white/85 group-hover:scale-110 transition-transform duration-500 relative z-0" />}
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <h3 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight">{service.title}</h3>
        <p className="text-sm text-slate-500 leading-snug line-clamp-3 flex-1">{service.about || service.description}</p>

        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("startingAt")}</p>
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {formatINR(service.price_starting)}
              {service.price_suffix && <span className="text-xs font-bold text-slate-400">{service.price_suffix}</span>}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-black text-slate-700">
                {Number(service.rating_avg || 0).toFixed(1)}
                <span className="text-slate-400 font-bold">{t("reviewsCount", { count: service.reviews_count || 0 })}</span>
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="cursor-pointer btn-purple text-xs font-black px-5 py-2.5 rounded-2xl shadow-lg shadow-pink-100 hover:shadow-pink-200 transition-all"
          >
            {t("getQuote")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Right-side list row (matches the services list card style) ──────────
function ServiceRow({ service, onClick }) {
  const t = useTranslations("TopServices");
  const Icon = iconForName(service.icon_name);
  return (
    <div onClick={onClick} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4 cursor-pointer">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
      >
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-black text-slate-900 leading-tight truncate">{service.title}</h4>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-1">{service.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-1">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-black text-slate-700">
              {Number(service.rating_avg || 0).toFixed(1)}
              <span className="text-slate-400 font-bold">{t("reviewsCountShort", { count: service.reviews_count || 0 })}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="hidden sm:block text-right shrink-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("startingAt")}</p>
        <p className="text-base font-black text-slate-900 leading-tight">
          {formatINR(service.price_starting)}
          {service.price_suffix && <span className="text-[10px] font-bold text-slate-400">{service.price_suffix}</span>}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="mt-1 btn-purple text-[10px] font-black px-3 py-1.5 rounded-xl cursor-pointer"
        >
          {t("getQuote")}
        </button>
      </div>
    </div>
  );
}

// ── Mobile carousel card — fills the slide (one-at-a-time view) ─────────
function CarouselCard({ service, onClick }) {
  const t = useTranslations("TopServices");
  const Icon = iconForName(service.icon_name);
  const hasImage = !!service.featured_image_url;
  return (
    <div onClick={onClick} className="w-full rounded-3xl border border-slate-200 bg-white overflow-hidden cursor-pointer group">
      <div className={`relative h-48 flex items-center justify-center overflow-hidden ${hasImage ? "bg-slate-100" : `bg-gradient-to-br ${service.hero_gradient}`}`}>
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.featured_image_url} alt={service.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-black px-2.5 py-1 rounded-full z-10">{service.tag}</span>
        {!hasImage && <Icon size={56} strokeWidth={1.4} className="text-white/85 group-hover:scale-110 transition-transform duration-500" />}
      </div>
      <div className="p-4">
        <h4 className="text-base font-black text-slate-900 leading-tight mb-2 line-clamp-2">{service.title}</h4>
        <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-3">{service.about || service.description}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-black text-slate-700">
            {Number(service.rating_avg || 0).toFixed(1)}
            <span className="text-slate-400 font-bold">{t("reviewsCount", { count: service.reviews_count || 0 })}</span>
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("startingAt")}</p>
            <p className="text-lg font-black text-slate-900">
              {formatINR(service.price_starting)}
              {service.price_suffix && <span className="text-[10px] font-bold text-slate-400">{service.price_suffix}</span>}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="btn-purple text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
          >
            {t("getQuote")}
          </button>
        </div>
      </div>
    </div>
  );
}
