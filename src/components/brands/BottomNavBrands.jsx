"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Briefcase, User, Bell } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, path: "/brands" },
  { label: "Search", icon: Search, path: "/brands/search" },
  { label: "Campaigns", icon: Briefcase, path: "/brands/campaigns" },
  { label: "Alerts", icon: Bell, path: "/brands/notifications" },
  { label: "Profile", icon: User, path: "/brands/profile" },
];

const BottomNavBrands = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed lg:hidden bottom-0 left-0 right-0 z-[150] bg-white border-t border-[#E4E9F4] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        {navItems.map((item) => {
          // Active when path matches exactly OR a sub-route (except /brands which matches too many)
          const isActive =
            item.path === "/brands"
              ? pathname === "/brands"
              : pathname === item.path || pathname.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 relative group active:scale-95 transition-transform"
            >
              {isActive && (
                <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-linear-to-b from-[#4C75BE] to-[#31508F]" />
              )}

              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 pt-1 ${
                  isActive
                    ? "text-[#31508F] scale-110"
                    : "text-[#64748B]"
                }`}
              />

              <span
                className={`text-[10px] mt-1 font-semibold transition-colors duration-300 ${
                  isActive ? "text-[#31508F]" : "text-[#94A3B8]"
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

export default BottomNavBrands;
