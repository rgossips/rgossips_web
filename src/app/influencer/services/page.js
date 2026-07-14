"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Search, Star, ChevronLeft, Loader2 } from "lucide-react";
import { fetchServices, formatINR, iconForName } from "@/lib/services";

const PRICE_BANDS = [
  { id: "any", test: () => true },
  { id: "under-3k", test: (p) => p < 3000 },
  { id: "3k-7k", test: (p) => p >= 3000 && p < 7000 },
  { id: "7k-15k", test: (p) => p >= 7000 && p < 15000 },
  { id: "15k-plus", test: (p) => p >= 15000 },
];

export default function ServicesPage() {
  const t = useTranslations("InfluencerServices");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceBand, setPriceBand] = useState("any");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServices();
      if (cancelled) return;
      setServices(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(services.map((s) => s.tag).filter(Boolean))),
    [services]
  );

  const toggleTag = (t) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const band = PRICE_BANDS.find((b) => b.id === priceBand) || PRICE_BANDS[0];
    return services.filter((s) => {
      if (selectedTags.length && !selectedTags.includes(s.tag)) return false;
      if (!band.test(s.price_starting || 0)) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q)
      );
    });
  }, [services, query, selectedTags, priceBand]);

  const clearFilters = () => {
    setSelectedTags([]);
    setPriceBand("any");
    setQuery("");
  };

  const hasActiveFilters = selectedTags.length > 0 || priceBand !== "any" || query.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F8F9FD] p-4 pb-24 lg:p-8 lg:pt-24 lg:pb-8 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Header — mobile only */}
        <div className="lg:hidden space-y-4 mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-full"
              aria-label={t("back")}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                {t("title")}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {t("subtitleMobile")}
              </p>
            </div>
          </div>

          {/* Mobile search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholderMobile")}
              className="w-full pl-10 h-11 bg-white border-none rounded-xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          {/* Mobile tag chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`text-[11px] font-bold px-3 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                  selectedTags.includes(t)
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT SIDEBAR (Desktop) --- */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-8">
            {/* Back + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition-colors"
                aria-label={t("back")}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  {t("subtitleDesktop")}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076]"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-12 h-14 bg-white border-none rounded-2xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {/* Categories */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-slate-800 text-base">{t("categories")}</h2>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-[11px] font-bold text-slate-400 hover:text-pink-500 cursor-pointer"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => {
                  const active = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition cursor-pointer ${
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price band */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <h2 className="font-black text-slate-800 text-base mb-4">{t("price")}</h2>
              <div className="space-y-1">
                {PRICE_BANDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setPriceBand(b.id)}
                    className={`w-full cursor-pointer flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      priceBand === b.id
                        ? "bg-gradient-to-r from-[#E60076] to-[#D500F9] text-white shadow-md shadow-pink-100"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {t(`priceBands.${b.id}`)}
                    {priceBand === b.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:text-pink-500 hover:border-pink-200 cursor-pointer"
              >
                {t("resetFilters")}
              </button>
            )}
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <main className="lg:col-span-9 space-y-6">
            {/* Desktop header */}
            <div className="hidden lg:flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedTags.length === 1 ? selectedTags[0] : t("servicesHeading")}
              </h2>
              <span className="text-sm font-bold text-slate-400">
                {t("serviceCount", { count: filtered.length })}
              </span>
            </div>

            {/* Mobile price band as horizontal chips */}
            <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {PRICE_BANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setPriceBand(b.id)}
                  className={`text-[11px] font-bold px-3 py-2 rounded-full whitespace-nowrap transition cursor-pointer ${
                    priceBand === b.id
                      ? "bg-gradient-to-r from-[#E60076] to-[#D500F9] text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {t(`priceBands.${b.id}`)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-pink-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] text-slate-400 font-bold">
                {t("empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  const t = useTranslations("InfluencerServices");
  const router = useRouter();
  const Icon = iconForName(service.icon_name);
  const open = () => router.push(`/influencer/services/${service.slug}`);
  const hasImage = !!service.featured_image_url;
  // `accent` is a combined "bg-… text-…" class. The banner uses the whole
  // thing (pastel bg + tinted icon); the category label reuses just the
  // text-… token so it reads as coloured text, not a filled pill.
  const labelColor =
    (service.accent && service.accent.match(/text-[^\s]+/)?.[0]) || "text-slate-600";
  return (
    <div
      onClick={open}
      className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all flex flex-col cursor-pointer"
    >
      {/* Banner on top — featured image when set, else the accent colour with
          the service icon centred (matches the top-services cards). */}
      <div
        className={`relative h-32 sm:h-36 flex items-center justify-center overflow-hidden ${
          hasImage ? "bg-slate-100" : service.accent
        }`}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.featured_image_url}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Icon size={40} strokeWidth={1.6} className="group-hover:scale-110 transition-transform duration-500" />
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>
            {service.tag}
          </span>
          <h3 className="text-[15px] font-black text-slate-900 leading-tight mt-1">
            {service.title}
          </h3>
          <p className="text-[12px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
            {service.description}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-black text-slate-700">
            {Number(service.rating_avg || 0).toFixed(1)}
            <span className="text-slate-400 font-bold"> ({service.reviews_count || 0})</span>
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {t("startingAt")}
            </p>
            <p className="text-lg font-black text-slate-900 leading-tight">
              {formatINR(service.price_starting)}
              {service.price_suffix && (
                <span className="text-[10px] font-bold text-slate-400">
                  {service.price_suffix}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="btn-purple px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md shadow-pink-100 cursor-pointer"
          >
            {t("getQuote")}
          </button>
        </div>
      </div>
    </div>
  );
}
