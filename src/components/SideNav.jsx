import React from "react";
import { FaShoppingCart } from "react-icons/fa";
import { GrGallery } from "react-icons/gr";
import { LuAppWindow } from "react-icons/lu";

const SideNav = () => {
  const navItems = [
    { label: "Home", icon: <FaShoppingCart /> },
    { label: "Services", icon: <GrGallery /> },
    { label: "Contact", icon: <LuAppWindow /> },
  ];

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
      {navItems.map((item, index) => (
        <div
          key={item + index}
          className="group relative flex items-center justify-end"
        >
          {/* Tooltip / Label */}
          <div className="h-16 lg:h-18 absolute right-full px-3 py-1 bg-yellow-400 text-white text-lg flex items-center justify-center font-medium opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 whitespace-nowrap shadow-md">
            {item.label}
          </div>

          {/* Main Button */}
          <div className="w-12 lg:w-18 h-12 lg:h-18 flex items-center justify-center bg-[#f26f44] text-white font-bold cursor-pointer hover:bg-orange-500 transition-all duration-300 shadow-md text-xl lg:text-2xl">
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SideNav;
