"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SlidersHorizontal, X } from "lucide-react";

// Filter options shown in the drawer. Keys that map to real DB columns drive
// filtering in the page: Categories, "Follower Count", "Creator Type", Location.
// Others (Gender, Language, etc.) are displayed but not yet wired.
export const filterData = {
  Categories: [
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
  ],
  "Follower Count": [
    "0 - 10k",
    "10k - 50k",
    "50k - 100k",
    "100k - 500k",
    "500k - 1M",
    "1M+",
  ],
  "Creator Type": ["Mega", "Macro", "Micro", "Nano"],
  "Profile Type": ["Meme page", "Celebrity"],
  Location: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Remote",
  ],
  Gender: ["Male", "Female", "Non-binary", "Prefer not to say"],
  "Content Language": [
    "English",
    "Hindi",
    "Marathi",
    "Bengali",
    "Tamil",
    "Telugu",
    "Gujarati",
  ],
};

const sortOptions = [
  "Followers (High to Low)",
  "Followers (Low to High)",
  "Alphabetical",
];

const sidebarItems = Object.keys(filterData);

const desktopQuery = "(min-width: 1024px)";
const subscribe = (cb) => {
  const mql = window.matchMedia(desktopQuery);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(desktopQuery).matches;
const getServerSnapshot = () => false;

function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { sortOptions };

export function FilterDrawer({ filters, onApply, onClear, countForDraft }) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  // Draft filters while the drawer is open; committed to parent on Apply
  const [draft, setDraft] = useState(filters);

  const handleOpenChange = (v) => {
    setOpen(v);
    if (v) setDraft(filters); // sync draft from parent on open
  };

  const toggleOption = (group, option) => {
    setDraft((prev) => {
      const current = prev[group] || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [group]: next };
    });
  };

  const handleApply = () => {
    onApply?.(draft);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(sidebarItems.map((k) => [k, []]));
    setDraft(cleared);
    onClear?.();
    setOpen(false);
  };

  const activeCount = Object.values(filters || {}).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  const triggerButton = (
    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap">
      Filter {activeCount > 0 && `(${activeCount})`}
      <SlidersHorizontal size={12} />
    </button>
  );

  const header = (
    <div className="flex flex-row items-center justify-between border-b px-6 py-4 shrink-0">
      <div className="flex flex-col text-left">
        <h3 className="text-xl font-bold text-gray-900">All Filters</h3>
        <p className="text-[10px] text-gray-400">Refine your search</p>
      </div>
      {isDesktop ? (
        <DialogClose asChild>
          <button className="p-2 -mr-2 outline-hidden cursor-pointer">
            <X size={20} className="text-gray-400" />
          </button>
        </DialogClose>
      ) : (
        <DrawerClose asChild>
          <button className="p-2 -mr-2 outline-hidden cursor-pointer">
            <X size={20} className="text-gray-400" />
          </button>
        </DrawerClose>
      )}
    </div>
  );

  // Live count for the Apply button. Only computed when the drawer is open
  // and the parent has supplied a counter — otherwise we just render
  // "Apply Filters" with no number.
  const draftCount = countForDraft && open ? countForDraft(draft) : null;

  const footer = (
    <div className="grid grid-cols-2 gap-4 p-6 border-t bg-white shrink-0">
      <button
        onClick={handleClear}
        className="py-4 bg-gray-50 text-gray-900 font-bold rounded-2xl cursor-pointer"
      >
        Clear Filters
      </button>
      <button
        onClick={handleApply}
        className="py-4 bg-[#5851DB] text-white font-bold rounded-2xl shadow-lg shadow-purple-200 cursor-pointer"
      >
        {draftCount != null ? `Apply Filters (${draftCount})` : "Apply Filters"}
      </button>
    </div>
  );

  const content = <FilterContent draft={draft} toggleOption={toggleOption} />;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[600px] max-h-[70vh] p-0 flex flex-col overflow-hidden rounded-2xl"
        >
          {header}
          {content}
          {footer}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/40 z-50" />
        <DrawerContent className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] mb-16 rounded-t-[32px] bg-white border-none flex flex-col focus:outline-none">
          {header}
          {content}
          {footer}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

const FilterContent = ({ draft, toggleOption }) => {
  const [activeTab, setActiveTab] = useState("Categories");
  const currentOptions = filterData[activeTab] || [];
  const selectedInGroup = draft?.[activeTab] || [];

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 bg-[#F8F9FE] overflow-y-auto border-r">
        {sidebarItems.map((item) => {
          const count = draft?.[item]?.length || 0;
          return (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`w-full text-left px-6 py-5 text-[11px] font-semibold transition-all cursor-pointer
                ${
                  activeTab === item
                    ? "bg-[#EBE9FE] text-[#5851DB] border-l-4 border-[#5851DB]"
                    : "text-gray-500 hover:bg-gray-100 border-l-4 border-transparent"
                }`}
            >
              {item} {count > 0 && <span className="text-[#5851DB]">({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="flex justify-between items-center mb-4 px-2">
          <h4 className="text-[13px] font-bold text-gray-900">
            Filter by {activeTab}
          </h4>
          <span className="text-[10px] text-gray-400">
            {currentOptions.length} Options
          </span>
        </div>

        <div className="space-y-1">
          {currentOptions.map((option) => (
            <label
              key={`${activeTab}-${option}`}
              className="flex items-center gap-3 p-3 hover:bg-blue-50/50 rounded-xl group cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedInGroup.includes(option)}
                onChange={() => toggleOption(activeTab, option)}
                className="w-5 h-5 rounded-md border-gray-300 text-[#5851DB] focus:ring-[#5851DB] cursor-pointer"
              />
              <span className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900">
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
