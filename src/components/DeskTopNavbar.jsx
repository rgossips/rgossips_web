"use client";

import React from "react";
import {
  Home,
  Compass,
  Briefcase,
  User,
  MessageSquare,
  Bell,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logo from "@/assets/logo2.png";
import Image from "next/image";

const DESKTOP_NAV_ITEMS = [
  { label: "Home", icon: <Home size={20} />, href: "/influencer" },
  {
    label: "Discover",
    icon: <Compass size={20} />,
    href: "/influencer/discover",
  },
  {
    label: "Campaigns",
    icon: <Briefcase size={20} />,
    href: "/influencer/campaigns",
  },
  { label: "Profile", icon: <User size={20} />, href: "/influencer/profile" },
];

export const DesktopNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();

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
      <div className="hidden lg:flex items-center gap-3 flex-1 lg:max-w-2xl">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search campaigns, brands..."
            className="w-full bg-white py-4 lg:py-3.5 pl-12 pr-4 rounded-2xl text-sm font-medium border-none shadow-sm focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons (Notification/Filter) */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              router.push("/influencer/notifications");
            }}
            className="hidden cursor-pointer lg:flex p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors"
          >
            <Bell size={22} />
          </button>
          <button
            onClick={() => {
              router.push("/influencer/chats");
            }}
            className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 border border-slate-100"
          >
            <MessageSquare size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
};
