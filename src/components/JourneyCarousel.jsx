import React from "react";
import { Star } from "lucide-react";
import Image from "next/image";

const journeyData = [
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
  return (
    <section className="w-full py-6 lg:px-10 bg-white">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
          For You
        </h2>
        <button className="text-sm font-bold text-slate-500 hover:opacity-80 transition-all cursor-pointer hover:underline">
          See all
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex overflow-x-auto gap-4 px-6 pb-6 scrollbar-hide snap-x snap-mandatory">
        {journeyData.map((item) => (
          <div
            key={item.id}
            className="flex-none basis-[80%] sm:basis-1/2 lg:basis-1/4 snap-start"
          >
            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 flex flex-col h-full active:scale-[0.98] transition-transform">
              {/* Image Section */}
              <div className="relative w-full h-48">
                <Image
                  height={200}
                  width={200}
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Section */}
              <div className="p-5 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {item.title}
                  </h3>

                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                      {item.location}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="text-sm font-black text-slate-700">
                        {item.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Price and Duration */}
                <div className="flex justify-between items-end mt-5">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      Start from
                    </p>
                    <p className="text-lg font-black text-slate-900">
                      $ {item.price}
                      <span className="text-[10px] font-bold text-slate-400">
                        /pax
                      </span>
                    </p>
                  </div>

                  {/* Duration Badge with Gradient */}
                  <div className="bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-[10px] font-black px-5 py-2 rounded-full shadow-lg shadow-pink-100">
                    {item.duration}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default JourneyCarousel;
