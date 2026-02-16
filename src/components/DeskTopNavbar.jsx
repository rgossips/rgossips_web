"use client";

import React from "react";
import { Home, Compass, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/logo2.png";
import Image from "next/image";

const DESKTOP_NAV_ITEMS = [
  { label: "Home", icon: <Home size={20} />, href: "/influencer" },
  { label: "Discover", icon: <Compass size={20} />, href: "/discover" },
  {
    label: "Campaigns",
    icon: <Briefcase size={20} />,
    href: "/campaigns",
  },
  { label: "Profile", icon: <User size={20} />, href: "/profile" },
];

export const DesktopNavbar = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:grid grid-cols-3 fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-50 px-12 items-center shadow-sm">
      {/* Navigation Links - Center */}
      <div>
        <Image src={logo} alt="logo" height={200} width={200} />
      </div>
      <div className="flex items-center gap-2">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center relative group px-6 py-2"
            >
              {/* Active Indicator Line at the top of the button */}
              {isActive && (
                <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A]" />
              )}

              {React.cloneElement(item.icon, {
                strokeWidth: isActive ? 2.5 : 2,
                className: `transition-all duration-300 ${
                  isActive
                    ? "text-[#F6339A] scale-110"
                    : "text-[#64748B] group-active:scale-90"
                }`,
              })}
              <span
                className={`text-sm mt-1 font-semibold transition-colors duration-300 ${
                  isActive ? "text-[#F6339A]" : "text-[#94A3B8]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
