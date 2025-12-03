import HomeCarousel from "@/components/Carousel";
import FeaturedSection from "@/components/FeaturedSection";
import ShowcaseSection from "@/components/ShowCaseSection";
import {
  CiGift,
  CiDiscount1,
  CiWallet,
  CiShoppingBasket,
} from "react-icons/ci";
import BrandsCarousel from "@/components/BrandsCarousel";
import InfluencerGrid from "@/components/InfluencersGrid";
import FaqSection from "@/components/FAQ";

const features = [
  {
    icon: <CiGift />,
    title: "Client Bonuses",
    desc: "Egestas Integers",
  },
  {
    icon: <CiDiscount1 />,
    title: "Best Discounts",
    desc: "Ullamcorper Amet",
  },
  {
    icon: <CiWallet />,
    title: "Secure Payments",
    desc: "Mauris Faucibus",
  },
  {
    icon: <CiShoppingBasket />,
    title: "Interactive Community",
    desc: "Tempus Consectetur",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      <HomeCarousel />
      <BrandsCarousel />

      <ShowcaseSection />
      <FeaturedSection />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full pl-10 pr-20 my-10 gap-8">
        {features.map((item, i) => (
          <div key={i} className="flex items-center gap-5 p-6 ">
            <div className="text-[100px]">{item.icon}</div>
            <div className="flex flex-col">
              <div className="font-semibold text-2xl text-gray-900">
                {item.title}
              </div>
              <div className="text-gray-500 text-base">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="relative h-screen w-full flex flex-col items-start justify-center gap-10 text-white px-10 lg:px-20 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source
            src="https://www.pexels.com/download/video/7964466/"
            type="video/mp4"
          />
        </video>

        {/* Content */}
        <div className="relative z-10 text-3xl font-semibold">Featured</div>

        <div className="relative z-10 text-7xl font-semibold max-w-4xl">
          We provide creative solutions
        </div>

        <div className="relative z-10 bg-black px-5 py-3 text-2xl cursor-pointer">
          Read More
        </div>
      </div>

      <InfluencerGrid />
      <FaqSection />
    </div>
  );
}
