import { Film, Newspaper, Handshake } from "lucide-react";
import { FaFrog } from "react-icons/fa";

export const BeyondInfluencers = () => {
  const categories = [
    {
      label: "Celebs & Actors",
      icon: <Film className="text-slate-800" size={24} />,
      bgColor: "bg-[#FFF9F1]", // Light orange
      textColor: "text-[#D97706]",
    },
    {
      label: "Publishers & Media",
      icon: <Newspaper className="text-slate-800" size={24} />,
      bgColor: "bg-[#F1F7FF]", // Light blue
      textColor: "text-[#2563EB]",
    },
    {
      label: "Talent Agencies",
      icon: <Handshake className="text-slate-800" size={24} />,
      bgColor: "bg-[#F9F5FF]", // Light purple
      textColor: "text-[#9333EA]",
    },
    {
      label: "Meme Pages & More",
      icon: <FaFrog className="text-slate-800" size={24} />,
      bgColor: "bg-[#F0FDF4]", // Light green
      textColor: "text-[#16A34A]",
    },
  ];

  return (
    <section className="w-full px-4 lg:px-6 space-y-6">
      <h2 className="px-6 text-xl font-black text-[#1C115A]">
        Beyond Influencers
      </h2>

      <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full px-4 lg:px-6">
        {categories.map((item, index) => (
          <div
            key={index}
            className={`rounded-4xl ${item.bgColor} flex flex-col justify-center gap-4 py-8 px-5 border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-sm`}
          >
            {/* Icon Wrapper */}
            <div className="w-10 h-10 flex items-center justify-start">
              {item.icon}
            </div>

            {/* Label */}
            <h3
              className={`font-black text-[15px] leading-tight ${item.textColor}`}
            >
              {item.label}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};
