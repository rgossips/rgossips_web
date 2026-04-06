import React, { useEffect, useState, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
];

const _OLD_journeyData = [
  {
    id: 1,
    title: "Luxury Perfume Launch",
    location: "Mumbai, India",
    rating: 4.9,
    price: 150,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
  },
  {
    id: 2,
    title: "Wellness Spa Retreat",
    location: "Goa, India",
    rating: 4.8,
    price: 250,
    duration: "3 Weeks",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
  },
  {
    id: 3,
    title: "Skincare Brand Collab",
    location: "Delhi, India",
    rating: 4.7,
    price: 200,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
  },
  {
    id: 4,
    title: "Luxury Hotel Stay",
    location: "Udaipur, India",
    rating: 4.8,
    price: 320,
    duration: "4 Days",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
  },
  {
    id: 5,
    title: "Cafe Tasting Campaign",
    location: "Bangalore, India",
    rating: 4.6,
    price: 120,
    duration: "1 Week",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
  },
  {
    id: 6,
    title: "Organic Tea Promotion",
    location: "Darjeeling, India",
    rating: 4.7,
    price: 90,
    duration: "10 Days",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
  },
  {
    id: 7,
    title: "Clothing Brand Shoot",
    location: "Jaipur, India",
    rating: 4.8,
    price: 220,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
  },
  {
    id: 8,
    title: "Aroma Diffuser Campaign",
    location: "Pune, India",
    rating: 4.5,
    price: 140,
    duration: "10 Days",
    image: "https://images.unsplash.com/photo-1616627781431-23a9c7cfd0b7?w=800",
  },
  {
    id: 9,
    title: "Phone Accessories Launch",
    location: "Hyderabad, India",
    rating: 4.6,
    price: 160,
    duration: "1 Week",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
  },
  {
    id: 10,
    title: "Haircare Product Review",
    location: "Chandigarh, India",
    rating: 4.7,
    price: 180,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
  },
  {
    id: 11,
    title: "Luxury Bag Promotion",
    location: "Mumbai, India",
    rating: 4.8,
    price: 260,
    duration: "3 Weeks",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
  },
  {
    id: 12,
    title: "Beach Resort Collaboration",
    location: "Goa, India",
    rating: 4.9,
    price: 400,
    duration: "4 Days",
    image: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2102c?w=800",
  },
  {
    id: 13,
    title: "Salon Makeover Campaign",
    location: "Delhi, India",
    rating: 4.6,
    price: 130,
    duration: "1 Week",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800",
  },
  {
    id: 14,
    title: "Skylounge Night Event",
    location: "Mumbai, India",
    rating: 4.7,
    price: 210,
    duration: "3 Days",
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800",
  },
  {
    id: 15,
    title: "Jewellery Collection Launch",
    location: "Surat, India",
    rating: 4.8,
    price: 300,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800",
  },
  {
    id: 16,
    title: "Adventure Park Promotion",
    location: "Manali, India",
    rating: 4.7,
    price: 180,
    duration: "1 Week",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
  },
  {
    id: 17,
    title: "Luxury Airbnb Stay",
    location: "Shimla, India",
    rating: 4.8,
    price: 350,
    duration: "3 Days",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
  },
  {
    id: 18,
    title: "Organic Milk Brand",
    location: "Punjab, India",
    rating: 4.5,
    price: 110,
    duration: "10 Days",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800",
  },
  {
    id: 19,
    title: "Home Appliance Launch",
    location: "Gurgaon, India",
    rating: 4.6,
    price: 240,
    duration: "2 Weeks",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
  },
];

const JourneyCarousel = () => {
  const [api, setApi] = useState(null);
  const [journeyData, setJourneyData] = useState([]);
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: "{}",
        });
        const data = await res.json();
        if (data?.campaigns) {
          const active = data.campaigns.filter((c) => c.status === "Active").slice(0, 20);
          setJourneyData(
            active.map((c, i) => ({
              id: c.id,
              title: c.title,
              location: c.location || "Pan India",
              rating: 4.5 + Math.random() * 0.5,
              price: parseInt(c.budget?.replace(/[^\d]/g, "")) || 0,
              duration: c.daysLeft ? `${c.daysLeft} left` : "Open",
              image: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="w-full py-6 lg:px-10 bg-white overflow-hidden">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-4 px-6 lg:px-0">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">For You</h2>
        <button
          onClick={() => {
            const cat = profile?.categories?.[0] || "";
            router.push(`/influencer/campaigns${cat ? `?category=${encodeURIComponent(cat)}` : ""}`);
          }}
          className="text-sm font-bold text-pink-500 hover:opacity-80 transition-all cursor-pointer hover:underline"
        >
          See all
        </button>
      </div>

      {/* Carousel */}
      <div className="relative">
        <button
          onClick={() => api?.scrollPrev()}
          className="hidden lg:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg p-3 rounded-full hover:scale-110 transition-all text-slate-800 cursor-pointer"
        >
          <FaChevronLeft size={14} />
        </button>

        <Carousel opts={{ align: "start", loop: true, dragFree: true }} setApi={setApi} className="w-full">
          <CarouselContent className="-ml-3 px-6 lg:px-0">
            {journeyData.map((item) => (
              <CarouselItem key={item.id} className="pl-3 basis-[75%] sm:basis-1/2 lg:basis-1/4">
                <div
                  onClick={() => router.push(`/influencer/offers/${item.id}`)}
                  className="bg-white rounded-[32px] overflow-hidden border border-slate-100 flex flex-col h-full active:scale-[0.98] transition-transform cursor-pointer hover:shadow-lg"
                >
                  {/* Image Section */}
                  <div className="relative w-full h-48">
                    <Image height={200} width={200} src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{item.title}</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide shrink-0 ml-2">{item.location}</p>
                    </div>

                    {/* Footer: Price and Duration */}
                    <div className="flex justify-between items-end mt-5">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Budget</p>
                        <p className="text-lg font-black text-slate-900">₹{item.price?.toLocaleString("en-IN") || 0}</p>
                      </div>

                      {/* Duration Badge with Gradient */}
                      <div className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-[10px] font-black px-5 py-2 rounded-full shadow-lg shadow-pink-100">{item.duration}</div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <button
          onClick={() => api?.scrollNext()}
          className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg p-3 rounded-full hover:scale-110 transition-all text-slate-800 cursor-pointer"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </section>
  );
};

export default JourneyCarousel;
