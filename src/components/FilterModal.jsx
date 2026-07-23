import React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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

// --- 1. The Full Filter Content (Used in Modal popup) ---
export const FilterContent = ({
  selectedCategories,
  setSelectedCategories,
  budgetRange,
  setBudgetRange,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
  brands,
  selectedBrands,
  setSelectedBrands,
}) => {
  const t = useTranslations("FilterModal");
  const handleBrandToggle = (name) => {
    if (!setSelectedBrands) return;
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };
  const handleCategoryToggle = (catLabel) => {
    if (catLabel === "All") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) =>
        prev.includes(catLabel)
          ? prev.filter((c) => c !== catLabel)
          : [...prev, catLabel]
      );
    }
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">{t("category")}</h3>
          {selectedCategories.length > 0 && (
            <span className="text-[10px] font-bold text-[#E60076]">{t("selectedCount", { count: selectedCategories.length })}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleCategoryToggle("All")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategories.length === 0
                ? "bg-[#E60076] text-white border border-[#E60076]"
                : "border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            {t("all")}
          </button>
          {CATEGORY_LIST.map((cat) => {
            const catData = FILTER_CATEGORIES.find((c) => c.label === cat);
            const isActive = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
        <h3 className="text-sm font-bold text-slate-800">{t("budgetRange")}</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              {t("minLabel")}
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
              {t("maxLabel")}
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
      {selectedPlatforms && setSelectedPlatforms && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">{t("platform")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.label);
              return (
                <button
                  key={platform.label}
                  onClick={() => handlePlatformToggle(platform.label)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
      )}

      {/* Brand */}
      {brands && setSelectedBrands && brands.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">{t("brand")}</h3>
            {selectedBrands?.length > 0 && (
              <button
                onClick={() => setSelectedBrands([])}
                className="text-[11px] font-bold text-slate-400 hover:text-[#E60076] cursor-pointer"
              >
                {t("clear")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
            {brands.map((name) => {
              const isSelected = selectedBrands?.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => handleBrandToggle(name)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#E60076] text-white border border-[#E60076]"
                      : "border border-slate-100 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Verified Only */}
      <section className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{t("verifiedOnly")}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t("verifiedOnlyHint")}</p>
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

// --- 2. Compact Sidebar Filter Summary (Grouped with Expand button) ---
export const FilterSidebar = ({
  selectedCategories,
  setSelectedCategories,
  budgetRange,
  setBudgetRange,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
  onExpand,
  brands,
  selectedBrands,
  setSelectedBrands,
}) => {
  const t = useTranslations("FilterModal");
  const activeFiltersCount =
    selectedCategories.length +
    (selectedPlatforms?.length || 0) +
    (selectedBrands?.length || 0) +
    (isVerifiedOnly ? 1 : 0) +
    (budgetRange.min > 0 || budgetRange.max < 10000 ? 1 : 0);

  const handleReset = () => {
    setSelectedCategories([]);
    setBudgetRange({ min: 0, max: 10000 });
    if (setSelectedPlatforms) setSelectedPlatforms([]);
    if (setSelectedBrands) setSelectedBrands([]);
    setIsVerifiedOnly(false);
  };

  const handleCategoryToggle = (cat) => {
    if (cat === "All") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-800 text-lg">{t("filters")}</h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className="text-xs font-bold text-slate-400 hover:text-[#E60076] cursor-pointer"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      {/* Category Group */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">{t("category")}</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleCategoryToggle("All")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategories.length === 0
                ? "bg-[#E60076] text-white"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t("all")}
          </button>
          {["Beauty & Skincare", "Fashion & Lifestyle", "Food & Beverage"].map((cat) => {
            const isActive = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E60076] text-white"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
          {/* Clickable "+N more" — opens the full filter modal. Lights up
              solid when hidden categories are actually selected. */}
          <button
            onClick={onExpand}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategories.filter((c) => !["Beauty & Skincare", "Fashion & Lifestyle", "Food & Beverage"].includes(c)).length > 0
                ? "bg-[#E60076] text-white"
                : "bg-[#E60076]/10 text-[#E60076] hover:bg-[#E60076]/20"
            }`}
          >
            {t("moreCount", { count: FILTER_CATEGORIES.length - 3 })}
          </button>
        </div>
      </div>

      {/* Platform Group */}
      {selectedPlatforms && setSelectedPlatforms && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">{t("platform")}</h3>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.slice(0, 3).map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.label);
              return (
                <button
                  key={platform.label}
                  onClick={() =>
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform.label)
                        ? prev.filter((p) => p !== platform.label)
                        : [...prev, platform.label]
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#E60076] text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {platform.icon}
                  {platform.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand Group */}
      {brands && setSelectedBrands && brands.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">{t("brand")}</h3>
          <div className="flex flex-wrap gap-1.5">
            {brands.slice(0, 4).map((name) => {
              const isSelected = selectedBrands?.includes(name);
              return (
                <button
                  key={name}
                  onClick={() =>
                    setSelectedBrands((prev) =>
                      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#E60076] text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {name}
                </button>
              );
            })}
            {brands.length > 4 && (
              <button
                onClick={onExpand}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  (selectedBrands || []).some((b) => !brands.slice(0, 4).includes(b))
                    ? "bg-[#E60076] text-white"
                    : "bg-[#E60076]/10 text-[#E60076] hover:bg-[#E60076]/20"
                }`}
              >
                {t("moreCount", { count: brands.length - 4 })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verified Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500">{t("verifiedOnly")}</span>
        <Switch
          checked={isVerifiedOnly}
          onCheckedChange={setIsVerifiedOnly}
          className="data-[state=checked]:bg-[#E60076] scale-90"
        />
      </div>

      {/* Expand Button */}
      <button
        onClick={onExpand}
        className="w-full py-2.5 rounded-2xl text-xs font-bold text-white cursor-pointer transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
      >
        {t("allFilters")} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </button>
    </div>
  );
};

// --- 2. The Modal Wrapper (Desktop & Mobile) ---
// `title` lets each parent page label the modal — e.g. "Filter Campaigns"
// from /influencer/campaigns and "Filter Brands" from /influencer/brands.
// Defaults to "Filters" when nothing is passed so older callers keep
// working.
const FilterModal = ({
  onClose,
  selectedCategories,
  setSelectedCategories,
  budgetRange,
  setBudgetRange,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
  brands,
  selectedBrands,
  setSelectedBrands,
  title,
}) => {
  const t = useTranslations("FilterModal");
  const resolvedTitle = title || t("filters");
  const handleReset = () => {
    setSelectedCategories([]);
    setBudgetRange({ min: 0, max: 10000 });
    if (setSelectedPlatforms) setSelectedPlatforms([]);
    if (setSelectedBrands) setSelectedBrands([]);
    setIsVerifiedOnly(false);
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile Modal - Right Slide */}
      <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm lg:hidden">
        <motion.div
          initial={{ x: "100%", opacity: 1 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          exit={{ x: "100%", opacity: 0 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 bg-white z-10 border-b border-slate-50">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076] hover:bg-[#ffd6eb] transition-colors cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">{resolvedTitle}</h2>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {t("clearAll")}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <FilterContent
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
              brands={brands}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
            />
          </div>

          {/* Mobile Footer Buttons */}
          <div className="bg-white border-t border-slate-100 p-4 pb-6 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer"
              onClick={handleReset}
            >
              {t("clearAll")}
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-[#E60076]/25 hover:shadow-xl cursor-pointer"
            >
              {t("apply")}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Desktop Modal - Centered */}
      <div className="hidden lg:fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm lg:flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-8 bg-white z-10 border-b border-slate-100 rounded-t-4xl">
            <h2 className="text-2xl font-bold text-slate-800">{resolvedTitle}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Desktop Content */}
          <div className="p-8 flex-1 overflow-y-auto min-h-0">
            <FilterContent
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              budgetRange={budgetRange}
              setBudgetRange={setBudgetRange}
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              isVerifiedOnly={isVerifiedOnly}
              setIsVerifiedOnly={setIsVerifiedOnly}
              brands={brands}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
            />
          </div>

          {/* Desktop Footer Buttons */}
          <div className="bg-white border-t border-slate-100 p-8 flex gap-4 rounded-b-4xl">
            <Button
              variant="ghost"
              className="flex-1 h-14 rounded-2xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer"
              onClick={handleReset}
            >
              {t("clearAll")}
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-[#E60076]/25 hover:shadow-xl cursor-pointer"
            >
              {t("applyFilters")}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FilterModal;

// Data Constants
const CATEGORY_LIST = [
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
];

const FILTER_CATEGORIES = [
  {
    label: "Beauty & Skincare",
    icon: <Sparkles size={14} className="text-pink-500" />,
  },
  {
    label: "Fashion & Lifestyle",
    icon: <Shirt size={14} className="text-purple-500" />,
  },
  {
    label: "Food & Beverage",
    icon: <Utensils size={14} className="text-orange-500" />,
  },
  {
    label: "Health, Fitness & Wellness",
    icon: <Dumbbell size={14} className="text-green-500" />,
  },
  {
    label: "Travel & Hospitality",
    icon: <Plane size={14} className="text-blue-500" />,
  },
  {
    label: "Technology & Gadgets",
    icon: <Smartphone size={14} className="text-slate-600" />,
  },
  {
    label: "Parenting & Family",
    icon: <Users size={14} className="text-amber-500" />,
  },
  {
    label: "Home & Decor",
    icon: <Home size={14} className="text-indigo-500" />,
  },
  {
    label: "Finance & Personal Finance",
    icon: <DollarSign size={14} className="text-emerald-500" />,
  },
  {
    label: "Education & Career",
    icon: <GraduationCap size={14} className="text-blue-600" />,
  },
  {
    label: "Gaming & Entertainment",
    icon: <Gamepad2 size={14} className="text-red-500" />,
  },
  {
    label: "Automobile & Mobility",
    icon: <Car size={14} className="text-cyan-500" />,
  },
  {
    label: "Entrepreneurship & Business",
    icon: <Briefcase size={14} className="text-violet-500" />,
  },
  {
    label: "Sustainable & Eco-conscious Living",
    icon: <Leaf size={14} className="text-green-600" />,
  },
  {
    label: "Pet Care & Animals",
    icon: <Dog size={14} className="text-amber-600" />,
  },
];

const PLATFORMS = [
  { label: "Instagram", icon: <Camera size={16} /> },
  { label: "YouTube", icon: <Tv size={16} /> },
  { label: "TikTok", icon: <Smartphone size={16} /> },
  { label: "Twitter", icon: <Globe size={16} /> },
];
