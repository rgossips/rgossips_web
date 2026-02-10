import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Check,
  ChevronLeft,
  Dumbbell,
  Gamepad2,
  Globe,
  Monitor,
  Plane,
  Shirt,
  Smartphone,
  Star,
  Tv,
  Utensils,
} from "lucide-react";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

const FilterModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 mb-16 z-50 bg-white">
      <motion.div
        initial={{ x: "100%", opacity: 1 }}
        animate={{
          x: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        }}
        exit={{ x: "100%", opacity: 0 }}
        className="bg-white w-full h-full overflow-y-auto scrollbar-hide"
      >
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076] hover:bg-[#ffd6eb] transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Filters</h2>
            <button
              onClick={() => {}}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          </div>

          {/* Filter Content */}
          <div className="space-y-8">
            {/* Category */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Category</h3>
              <div className="flex flex-wrap gap-3">
                {FILTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Budget Range */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Budget Range</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Min ($)
                  </label>
                  <Input
                    type="number"
                    defaultValue={500}
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
                  />
                </div>
                <div className="text-slate-300 pt-5">-</div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Max ($)
                  </label>
                  <Input
                    type="number"
                    defaultValue={5000}
                    className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
                  />
                </div>
              </div>
            </section>

            {/* Platform */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Platform</h3>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.label}
                    className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {platform.icon}
                    {platform.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Verified Only */}
            <section className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Verified Only
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Show only verified brands
                </p>
              </div>
              <Switch className="data-[state=checked]:bg-[#E60076]" />
            </section>

            {/* Location */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Location</h3>
              <div className="space-y-2">
                {/* Selected Item */}
                <div className="flex items-center justify-between p-4 bg-[#FFEBF5]/50 border border-[#E60076]/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-green-400 flex items-center justify-center text-[10px] text-white">
                      🌍
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      All Locations
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#E60076] flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                </div>

                {/* Dropdown Items */}
                <div className="pl-2 space-y-1">
                  {LOCATIONS.map((loc) => (
                    <div
                      key={loc.name}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-lg">{loc.flag}</span>
                      <span className="text-sm font-medium text-slate-600">
                        {loc.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex gap-4">
          <Button
            variant="ghost"
            className="flex-1 h-14 rounded-2xl font-bold text-slate-800 bg-slate-50 hover:bg-slate-100"
            onClick={onClose}
          >
            Reset
          </Button>
          <Button className="flex-1 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-[#E60076]/25 hover:opacity-90 transition-opacity">
            Apply Filters
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default FilterModal;

const FILTER_CATEGORIES = [
  { label: "Fashion", icon: <Shirt size={14} className="text-[#00BA88]" /> },
  { label: "Tech", icon: <Monitor size={14} /> },
  { label: "Beauty", icon: <Star size={14} className="text-[#E60076]" /> },
  { label: "Fitness", icon: <Dumbbell size={14} className="text-amber-500" /> },
  { label: "Food", icon: <Utensils size={14} className="text-orange-500" /> },
  { label: "Travel", icon: <Plane size={14} className="text-blue-500" /> },
  { label: "Gaming", icon: <Gamepad2 size={14} /> },
  {
    label: "Lifestyle",
    icon: <Camera size={14} className="text-yellow-500" />,
  },
];

const PLATFORMS = [
  { label: "Instagram", icon: <Camera size={16} /> },
  { label: "YouTube", icon: <Tv size={16} /> },
  { label: "TikTok", icon: <Smartphone size={16} /> },
  { label: "Twitter", icon: <Globe size={16} /> },
];

const LOCATIONS = [
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Europe", flag: "🇪🇺" },
  { name: "Asia", flag: "🌏" },
];
