"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, Briefcase, Sparkles, User } from "lucide-react";

// Mirrors DeskTopNavbar's nav exactly (same 5 entries, same icons, same
// order). Keeping them in sync means a user has the same mental model
// regardless of breakpoint.
const navItems = [
  { label: "Home", icon: Home, path: "/influencer" },
  { label: "Brands", icon: Compass, path: "/influencer/brands" },
  { label: "Campaigns", icon: Briefcase, path: "/influencer/campaigns" },
  { label: "Services", icon: Sparkles, path: "/influencer/services" },
  { label: "Profile", icon: User, path: "/influencer/profile" },
];

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <div className="fixed lg:hidden bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        {navItems.map((item) => {
          // Home is exact-match only (otherwise it'd light up for every
          // /influencer/* sub-route). Everything else uses prefix match
          // so sub-pages keep their parent tab highlighted — same rule
          // DeskTopNavbar uses.
          const isActive =
            item.path === "/influencer"
              ? pathname === "/influencer"
              : pathname === item.path || pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.label}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 relative group"
            >
              {isActive && (
                <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] animate-in fade-in slide-in-from-top-1 duration-300" />
              )}

              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 pt-1 ${
                  isActive
                    ? "text-[#F6339A] scale-110"
                    : "text-[#64748B] group-active:scale-90"
                }`}
              />

              <span
                className={`text-[10px] mt-1 font-semibold transition-colors duration-300 ${
                  isActive ? "text-[#F6339A]" : "text-[#94A3B8]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
