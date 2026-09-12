"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, Briefcase, Sparkles, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

// Mirrors DeskTopNavbar's nav, with one deliberate divergence: the last slot
// is Alerts here and Profile there. Desktop reaches notifications through the
// bell in the navbar, which has no mobile equivalent; mobile reaches Profile
// through the home header avatar, which desktop also has. Each breakpoint
// spends its fifth slot on the thing the other one already covers elsewhere.
const navItems = [
  { label: "Home", icon: Home, path: "/influencer" },
  { label: "Brands", icon: Compass, path: "/influencer/brands" },
  { label: "Campaigns", icon: Briefcase, path: "/influencer/campaigns" },
  { label: "Services", icon: Sparkles, path: "/influencer/services" },
  // Alerts replaced Profile here. Mobile had no route to notifications at
  // all — no bell anywhere, the bar being the only persistent chrome — so a
  // creator could not reach them except through a deep link. Profile is one
  // tap away from the avatar in the home header (UserDoc), which is where
  // people look for it anyway.
  { label: "Alerts", icon: Bell, path: "/influencer/notifications", badge: true },
];

const BottomNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const unread = useUnreadNotifications();

  // Logged out, this bar's five tabs all lead somewhere that would reject
  // the visitor, so render nothing at all rather than five dead ends. The
  // way in on mobile is the campaign page itself: Apply opens the creator
  // auth modal, which is the point where signing up actually means
  // something to them.
  if (!user) return null;

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
              {item.badge && unread > 0 && (
                <span className="absolute top-0 translate-x-4 min-w-[16px] h-4 px-1 bg-[#E60076] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}

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
