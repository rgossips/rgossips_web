"use client";

import React from "react";
import { Home, Compass, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DESKTOP_NAV_ITEMS = [
  { label: "Home", icon: <Home size={20} />, href: "/" },
  { label: "Discover", icon: <Compass size={20} />, href: "/discover" },
  {
    label: "My Campaigns",
    icon: <Briefcase size={20} />,
    href: "/my-campaigns",
  },
  { label: "Profile", icon: <User size={20} />, href: "/profile" },
];

export const DesktopNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-50 px-12 items-center justify-center shadow-sm">
      {/* Brand Logo - Left Side */}
      {/* <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-r from-[#9810FA] to-[#E60076] rounded-xl flex items-center justify-center text-white font-black text-xl">
          G
        </div>
        <span className="font-black text-slate-900 text-xl tracking-tight">
          Gemini<span className="text-[#E60076]">Social</span>
        </span>
      </div> */}

      {/* Navigation Links - Center */}
      <div className="flex items-center gap-8">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-[#FFF0F7] text-[#E60076] font-bold"
                  : "text-slate-400 font-medium hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {React.cloneElement(item.icon, {
                className: isActive ? "text-[#E60076]" : "text-slate-400",
              })}
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
