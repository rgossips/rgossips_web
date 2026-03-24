import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Camera,
  Car,
  ChevronLeft,
  Dog,
  DollarSign,
  Dumbbell,
  Gamepad2,
  Globe,
  GraduationCap,
  Home,
  Leaf,
  Plane,
  Shirt,
  Smartphone,
  Sparkles,
  Tv,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// --- 1. The Reusable Content (Used in Sidebar & Modal) ---
export const FilterContent = ({
  activeCategory,
  setActiveCategory,
  budgetRange,
  setBudgetRange,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
}) => {
  const handleCategorySelect = (catLabel) => {
    setActiveCategory(catLabel);
  };

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  return (
    <div className="space-y-8">
      {/* Category */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Category</h3>
        <div className="flex flex-wrap gap-3">
          {[
            "All",
            "Beauty & Skincare",
            "Fashion & Lifestyle",
            "Food & Beverage",
            "Health, Fitness & Wellness",
            "Travel & Hospitality",
            "Technology & Gadgets",
            "Parenting & Family",
            "Home & Decor",
            "Finance & Personal Finance",
            "Education & Career",
            "Gaming & Entertainment",
            "Automobile & Mobility",
            "Entrepreneurship & Business",
            "Sustainable & Eco-conscious Living",
            "Pet Care & Animals",
          ].map((cat) => {
            const catData = FILTER_CATEGORIES.find((c) => c.label === cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#E60076] text-white border border-[#E60076]"
                    : "border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                {catData?.icon || null}
                {cat}
              </button>
            );
          })}
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
              value={budgetRange.min}
              onChange={(e) =>
                setBudgetRange({
                  ...budgetRange,
                  min: parseInt(e.target.value) || 0,
                })
              }
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
              value={budgetRange.max}
              onChange={(e) =>
                setBudgetRange({
                  ...budgetRange,
                  max: parseInt(e.target.value) || 10000,
                })
              }
              className="h-12 bg-slate-50 border-none rounded-xl font-bold text-slate-700"
            />
          </div>
        </div>
      </section>

      {/* Platform */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Platform</h3>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.label);
            return (
              <button
                key={platform.label}
                onClick={() => handlePlatformToggle(platform.label)}
                className={`flex items-center justify-center gap-2 h-12 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#E60076] text-white border border-[#E60076]"
                    : "border border-slate-100 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {platform.icon}
                {platform.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Verified Only */}
      <section className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Verified Only</h3>
          <p className="text-xs text-slate-400 mt-0.5">4.7+ rating brands</p>
        </div>
        <Switch
          checked={isVerifiedOnly}
          onCheckedChange={setIsVerifiedOnly}
          className="data-[state=checked]:bg-[#E60076]"
        />
      </section>
    </div>
  );
};

// --- 2. The Modal Wrapper (Desktop & Mobile) ---
const FilterModal = ({
  onClose,
  activeCategory,
  setActiveCategory,
  budgetRange,
  setBudgetRange,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
}) => {
  const handleReset = () => {
    setActiveCategory("All");
    setBudgetRange({ min: 0, max: 10000 });
    setSelectedPlatforms([]);
    setIsVerifiedOnly(false);
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile Modal - Right Slide */}
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden ">
        <motion.div
          initial={{ x: "100%", opacity: 1 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          exit={{ x: "100%", opacity: 0 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto scrollbar-hide flex flex-col"
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 sticky top-0 bg-white z-10 border-b border-slate-50">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076] hover:bg-[#ffd6eb] transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Filters</h2>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 flex-1">
            <FilterContent
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
            />
          </div>

          {/* Mobile Footer Buttons */}
          <div className="sticky bottom-16 bg-white border-t border-slate-100 p-6 flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-[#E60076]/25 hover:shadow-xl"
            >
              Apply
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Desktop Modal - Centered */}
      <div className="hidden lg:fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        >
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-8 sticky top-0 bg-white z-10 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">Filter Brands</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Desktop Content */}
          <div className="p-8 flex-1">
            <FilterContent
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
            />
          </div>

          {/* Desktop Footer Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-8 flex gap-4">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100"
              onClick={handleReset}
            >
              Reset Filters
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-[#E60076]/25 hover:shadow-xl"
            >
              Apply Filters
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FilterModal;

// Data Constants
const FILTER_CATEGORIES = [
  { label: "Beauty & Skincare", icon: <Sparkles size={14} className="text-pink-500" /> },
  { label: "Fashion & Lifestyle", icon: <Shirt size={14} className="text-purple-500" /> },
  { label: "Food & Beverage", icon: <Utensils size={14} className="text-orange-500" /> },
  { label: "Health, Fitness & Wellness", icon: <Dumbbell size={14} className="text-green-500" /> },
  { label: "Travel & Hospitality", icon: <Plane size={14} className="text-blue-500" /> },
  { label: "Technology & Gadgets", icon: <Smartphone size={14} className="text-slate-600" /> },
  { label: "Parenting & Family", icon: <Users size={14} className="text-amber-500" /> },
  { label: "Home & Decor", icon: <Home size={14} className="text-indigo-500" /> },
  { label: "Finance & Personal Finance", icon: <DollarSign size={14} className="text-emerald-500" /> },
  { label: "Education & Career", icon: <GraduationCap size={14} className="text-blue-600" /> },
  { label: "Gaming & Entertainment", icon: <Gamepad2 size={14} className="text-red-500" /> },
  { label: "Automobile & Mobility", icon: <Car size={14} className="text-cyan-500" /> },
  { label: "Entrepreneurship & Business", icon: <Briefcase size={14} className="text-violet-500" /> },
  { label: "Sustainable & Eco-conscious Living", icon: <Leaf size={14} className="text-green-600" /> },
  { label: "Pet Care & Animals", icon: <Dog size={14} className="text-amber-600" /> },
];

const PLATFORMS = [
  { label: "Instagram", icon: <Camera size={16} /> },
  { label: "YouTube", icon: <Tv size={16} /> },
  { label: "TikTok", icon: <Smartphone size={16} /> },
  { label: "Twitter", icon: <Globe size={16} /> },
];
