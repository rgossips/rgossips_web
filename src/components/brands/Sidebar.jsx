"use client";

import { LayoutGrid, Search, Megaphone, User, Settings, HelpCircle, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import logoIcon from "@/assets/logoIcon.png";

export default function Sidebar() {
  const mainMenu = [
    { name: "Explore", icon: LayoutGrid, url: "/brands" },
    { name: "Find Creators", icon: Search, url: "/brands/search" },
    {
      name: "Campaigns",
      icon: Megaphone,
      badge: "LIVE",
      url: "/brands/campaigns",
    },
    { name: "Profile", icon: User, url: "/brands/profile" },
  ];

  const accountMenu = [
    { name: "Settings", icon: Settings },
    { name: "Help & Support", icon: HelpCircle },
  ];

  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 flex flex-col justify-between z-40">
      {/* Logo */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-5">
          <Image src={logoIcon} alt="RGossips" width={32} height={32} className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-gray-900">RGossips</span>
        </div>

        {/* Main Menu */}
        <nav className="px-3 space-y-1 mt-20">
          {mainMenu.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  router.push(item.url);
                }}
                className={`flex cursor-pointer items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition ${
                  (item.url === "/brands" ? pathname === "/brands" : pathname.startsWith(item.url)) ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {item.badge && <span className="ml-auto text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Account Section */}
        <div className="mt-6">
          <p className="px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
          <nav className="px-3 space-y-1">
            {accountMenu.map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={i} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition">
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-4">
        <button className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white text-sm py-2.5 rounded-xl hover:bg-purple-700 transition font-medium">
          <Plus size={16} />
          Post Requirement
        </button>
      </div>
    </aside>
  );
}
