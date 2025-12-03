"use client";

import {
  FiTrendingUp,
  FiStar,
  FiBox,
  FiHome,
  FiScissors,
  FiCoffee,
} from "react-icons/fi";

const items = [
  { title: "Trending", icon: FiTrendingUp },
  { title: "For You", icon: FiStar },
  { title: "Products", icon: FiBox },
  { title: "Hotels", icon: FiHome },
  { title: "Salon", icon: FiScissors },
  { title: "Restaurants", icon: FiCoffee },
];

export default function SelectionMenu() {
  return (
    <div
      className="
        w-full grid grid-cols-2 lg:flex items-center justify-start lg:justify-center gap-3 sm:gap-4
        mt-5 lg:mt-[10vh] overflow-x-auto no-scrollbar
        py-4 px-2 sm:px-4 snap-x snap-mandatory mb-16
      "
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="
              min-w-[100px] xs:min-w-[120px] sm:min-w-[150px]
              bg-white rounded-2xl shadow
              p-3 xs:p-3 sm:p-4 flex flex-col items-center gap-2 xs:gap-3
              snap-start cursor-pointer transform transition-transform duration-200 hover:scale-105
            "
          >
            {/* ICON */}
            <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon className="text-gray-700" size={22} xs={26} sm={26} />
            </div>

            {/* TITLE */}
            <p className="text-xs xs:text-sm sm:text-sm font-semibold text-gray-800 text-center">
              {item.title}
            </p>
          </div>
        );
      })}
    </div>
  );
}
