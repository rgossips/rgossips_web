import { Clapperboard, Newspaper, Camera, Smile } from "lucide-react";

const categories = [
  {
    name: "Celebrities",
    icon: Clapperboard,
    color: "bg-blue-50 text-blue-600",
  },
  { name: "Publishers", icon: Newspaper, color: "bg-red-50 text-red-600" },
  { name: "Influencers", icon: Camera, color: "bg-orange-50 text-orange-600" },
  { name: "Memes", icon: Smile, color: "bg-green-50 text-green-600" },
];

export const CategoryFilters = () => (
  <div className="grid grid-cols-4 gap-3 px-6 py-6">
    {categories.map((cat) => (
      <button
        key={cat.name}
        className={`flex flex-col items-center justify-center p-3 rounded-xl ${cat.color} hover:opacity-80 transition-all cursor-pointer`}
      >
        <cat.icon size={24} strokeWidth={1.5} />
        <span className="text-[10px] font-semibold mt-2">{cat.name}</span>
      </button>
    ))}
  </div>
);
