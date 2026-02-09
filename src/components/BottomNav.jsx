"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Briefcase, User } from "lucide-react";

const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Navigation configuration matching your screenshot
  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Discover", icon: Search, path: "/discover" },
    { label: "My Campaigns", icon: Briefcase, path: "/my-campaigns" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
        {navItems.map((item) => {
          // Check if current path matches to apply active styles
          const isActive = pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center flex-1 relative group"
            >
              {/* Active Indicator Line at the top of the button */}
              {isActive && (
                <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] animate-in fade-in slide-in-from-top-1 duration-300" />
              )}

              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${
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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
