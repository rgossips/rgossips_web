"use client";

import React, { useRef, useEffect } from "react";
import { Star, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const services = [
  {
    img: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
    tag: "LIFESTYLE",
    creator: "Emma Davis",
    role: "Lifestyle & Decor",
    title: "Premium Product Photography & Reel",
    rating: "4.9",
    reviews: "124",
    price: "350",
    featured: true,
  },
  {
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80",
    tag: "FASHION",
    creator: "Zachary Will",
    role: "Fashion Stylist",
    title: "Try-on Haul Video for TikTok",
    rating: "4.8",
    reviews: "89",
    price: "150",
  },
  {
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
    tag: "BEAUTY",
    creator: "Jessica Che",
    role: "Beauty Guru",
    title: "Detailed Makeup Tutorial & Review",
    rating: "5.0",
    reviews: "210",
    price: "250",
  },
  {
    img: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80",
    tag: "TECH",
    creator: "Alex Rivera",
    role: "Tech Reviewer",
    title: "Tech Gadget Unboxing & Setup",
    rating: "4.7",
    reviews: "56",
    price: "200",
  },
  {
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80",
    tag: "FASHION",
    creator: "Zachary Will",
    role: "Fashion Stylist",
    title: "Try-on Haul Video for TikTok",
    rating: "4.8",
    reviews: "89",
    price: "150",
  },
];

const TopServices = () => {
  const router = useRouter();
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let raf;
    let scrollPos = 0;
    const speed = 0.5; // px per frame

    const step = () => {
      scrollPos += speed;
      // loop back when we've scrolled half (duplicated list)
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      raf = requestAnimationFrame(step);
    };

    // only auto-scroll on mobile
    const mq = window.matchMedia("(max-width: 1023px)");
    const start = () => { if (mq.matches) raf = requestAnimationFrame(step); };
    const stop = () => cancelAnimationFrame(raf);

    if (mq.matches) start();
    mq.addEventListener("change", (e) => (e.matches ? start() : stop()));

    // pause on touch
    container.addEventListener("touchstart", stop);
    container.addEventListener("touchend", () => {
      scrollPos = container.scrollLeft;
      start();
    });

    return () => {
      stop();
      mq.removeEventListener("change", start);
      container.removeEventListener("touchstart", stop);
      container.removeEventListener("touchend", start);
    };
  }, []);

  return (
    <section className="w-full py-6 lg:py-10 px-4 lg:px-10 bg-white">
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
            Top Services
          </h2>
          <p className="text-sm text-slate-400">
            Popular creator services brands are booking right now
          </p>
        </div>
        <button
          onClick={() => router.push("/influencer/services")}
          className="text-sm font-bold text-[#F6339A] hover:underline flex items-center gap-1 cursor-pointer"
        >
          View All Services <span className="text-lg">›</span>
        </button>
      </div>

      {/* ── MOBILE: auto-scroll carousel ── */}
      <div
        ref={scrollRef}
        className="flex lg:hidden gap-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {/* duplicate list for seamless loop */}
        {[...services, ...services].map((s, i) => (
          <CarouselCard key={i} {...s} />
        ))}
      </div>

      {/* ── DESKTOP: original grid layout ── */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        {/* LEFT FEATURED SERVICE */}
        <div className="col-span-5 flex flex-col group cursor-pointer border border-slate-200 hover:shadow-md rounded-4xl">
          <div className="relative aspect-4/3 rounded-t-4xl overflow-hidden mb-4 border border-slate-100 shadow-sm">
            <Image
              height={200}
              width={200}
              src={services[0].img}
              alt="Premium Photography"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/90 backdrop-blur-sm text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                <span className="text-pink-500">⚡</span> TOP RATED
              </span>
              <span className="bg-[#475569]/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full">
                LIFESTYLE
              </span>
            </div>
            <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-colors">
              <Bookmark size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3 px-3">
            <Image
              height={200}
              width={200}
              src="https://i.pravatar.cc/150?u=emma"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              alt="Emma"
            />
            <div>
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                Emma Davis
              </h4>
              <p className="text-[10px] text-slate-400 font-bold">
                Lifestyle & Decor
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight p-2">
            Premium Product Photography & Reel
          </h3>
          <p className="text-sm text-slate-500 mb-6 line-clamp-2 px-3">
            I will create a high-quality aesthetic Instagram Reel and 5
            retouched product photos for your brand in a modern lifestyle
            setting.
          </p>

          <div className="mt-auto px-3 py-4 border-t border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Package Price
              </p>
              <p className="text-3xl font-black text-slate-900">$350</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-black text-yellow-700">
                  4.9{" "}
                  <span className="text-slate-400 font-bold">
                    (124 reviews)
                  </span>
                </span>
              </div>
              <button className="cursor-pointer btn-purple text-sm font-black px-10 py-3 rounded-2xl shadow-lg shadow-pink-100 hover:shadow-pink-200 transition-all">
                Book Service
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SERVICE LIST */}
        <div className="col-span-7 space-y-4">
          {services.slice(1).map((s, i) => (
            <ServiceRow key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopServices;

const CarouselCard = ({ img, tag, creator, role, title, rating, reviews, price }) => (
  <div className="min-w-[260px] max-w-[260px] shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden cursor-pointer group">
    <div className="relative h-36 overflow-hidden">
      <Image
        src={img}
        height={300}
        width={300}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        alt={title}
      />
      <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-black px-2 py-0.5 rounded-full">
        {tag}
      </span>
    </div>
    <div className="p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Image
          height={24}
          width={24}
          src={`https://i.pravatar.cc/100?u=${creator}`}
          className="w-5 h-5 rounded-full border border-slate-100"
          alt={creator}
        />
        <span className="text-[10px] font-black text-slate-900 truncate">{creator}</span>
      </div>
      <h4 className="text-sm font-black text-slate-900 leading-tight mb-2 line-clamp-2">
        {title}
      </h4>
      <div className="flex items-center gap-1 mb-3">
        <Star size={12} className="fill-yellow-400 text-yellow-400" />
        <span className="text-[10px] font-black text-slate-700">
          {rating} <span className="text-slate-400 font-bold">({reviews})</span>
        </span>
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <p className="text-lg font-black text-slate-900">${price}</p>
        <button className="btn-purple text-[10px] font-black px-4 py-1.5 rounded-xl">
          Book
        </button>
      </div>
    </div>
  </div>
);

const ServiceRow = ({
  img,
  tag,
  creator,
  role,
  title,
  rating,
  reviews,
  price,
}) => (
  <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl lg:rounded-4xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white group relative">
    {/* Image Section: Full width on mobile, fixed size on desktop */}
    <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden shrink-0">
      <Image
        src={img}
        height={400} // Increased for better quality on mobile full-width
        width={400}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        alt={title}
      />
      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] sm:text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm">
        {tag}
      </span>

      {/* Mobile Bookmark: Easier to tap in the corner of the image */}
      <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white sm:hidden">
        <Bookmark size={18} fill="currentColor" className="text-white" />
      </button>
    </div>

    {/* Content Section */}
    <div className="flex-1 flex flex-col justify-between py-1">
      <div>
        <div className="flex items-center gap-2 mb-2 sm:mb-1">
          <Image
            height={40}
            width={40}
            src={`https://i.pravatar.cc/100?u=${creator}`}
            className="w-5 h-5 rounded-full border border-slate-100"
            alt={creator}
          />
          <span className="text-[11px] sm:text-[10px] font-black text-slate-900">
            {creator}
          </span>
          <span className="text-[11px] sm:text-[10px] text-slate-400 font-bold">
            • {role}
          </span>
        </div>

        <h4 className="text-lg sm:text-base font-black text-slate-900 leading-tight mb-2 group-hover:text-[#F6339A] transition-colors line-clamp-2">
          {title}
        </h4>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-[11px] font-black text-slate-700">
              {rating}{" "}
              <span className="text-slate-400 font-bold">({reviews})</span>
            </span>
          </div>
          <span className="bg-green-100 text-green-600 text-[10px] sm:text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight">
            Available Now
          </span>
        </div>
      </div>

      {/* Mobile Pricing: Shows up below the title on small screens */}
      <div className="flex sm:hidden items-center justify-between mt-4 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Starting At
          </p>
          <p className="text-xl font-black text-slate-900">${price}</p>
        </div>
        <button className="btn-purple bg-[#8E2DE2] text-white text-xs font-black px-8 py-3 rounded-xl">
          Book
        </button>
      </div>
    </div>

    {/* Desktop Action Sidebar: Hidden on mobile */}
    <div className="hidden sm:flex flex-col items-end justify-between py-1 min-w-[110px]">
      <button className="text-slate-300 hover:text-slate-600 transition-colors">
        <Bookmark size={20} />
      </button>
      <div className="text-right">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
          Starting At
        </p>
        <p className="text-xl font-black text-slate-900 mb-2">${price}</p>
        <button className="btn-purple bg-[#8E2DE2] hover:bg-[#F6339A] text-white text-[11px] font-black px-6 py-2 rounded-xl transition-all shadow-md shadow-purple-100">
          Book
        </button>
      </div>
    </div>
  </div>
);
