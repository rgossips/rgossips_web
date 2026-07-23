"use client";

import { LayoutGrid, Search, Megaphone, User, HelpCircle, MessageSquare, Plus, Receipt } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import logoIcon from "@/assets/logoIcon.png";
import { useState } from "react";
import { useTranslations } from "next-intl";
import BrandHelpAndSupport from "@/components/brands/BrandHelpAndSupport";
import BrandSupportChat from "@/components/brands/BrandSupportChat";

export default function Sidebar() {
  const t = useTranslations("BrandsSidebar");
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const mainMenu = [
    { name: t("menu.explore"), icon: LayoutGrid, url: "/brands" },
    { name: t("menu.findCreators"), icon: Search, url: "/brands/search" },
    {
      name: t("menu.campaigns"),
      icon: Megaphone,
      badge: t("badge.live"),
      url: "/brands/campaigns",
    },
    { name: t("menu.profile"), icon: User, url: "/brands/profile" },
    { name: t("menu.transactions"), icon: Receipt, url: "/brands/transactions" },
  ];

  // Settings was removed — every preference today lives inside the profile
  // page, and there's no separate destination worth keeping a top-level
  // entry for. Help & Support opens a slide-out drawer.
  const accountMenu = [
    { name: t("account.helpSupport"), icon: HelpCircle, onClick: () => setHelpOpen(true) },
    { name: t("account.chatSupport"), icon: MessageSquare, onClick: () => setChatOpen(true) },
  ];

  return (
    // Sidebar fills its parent container in the layout — no `fixed` here
    // (the parent is already fixed) and no extra `border-r` (the parent
    // already has one) so we don't get a double-border / black line.
    <aside className="h-full w-full bg-white flex flex-col justify-between">
      {/* Logo */}
      <div className="overflow-y-auto">
        <div className="flex items-center gap-2 px-5 py-5">
          <Image src={logoIcon} alt="RGossips" width={32} height={32} className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-gray-900">RGossips</span>
        </div>

        {/* Main Menu */}
        <nav className="px-3 space-y-1 mt-10">
          {mainMenu.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  router.push(item.url);
                }}
                className={`flex cursor-pointer items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition ${
                  (item.url === "/brands" ? pathname === "/brands" : pathname.startsWith(item.url)) ? "bg-[#5B3DF5] text-white" : "text-gray-600 hover:bg-gray-100"
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
          <p className="px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("accountLabel")}</p>
          <nav className="px-3 space-y-1">
            {accountMenu.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <BrandHelpAndSupport
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onOpenChat={() => {
          setHelpOpen(false);
          setChatOpen(true);
        }}
      />
      <BrandSupportChat open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Bottom CTA — navigates to campaigns list with ?new=1 which auto-opens the create dialog */}
      <div className="p-4">
        <button
          onClick={() => router.push("/brands/campaigns?new=1")}
          className="flex cursor-pointer items-center justify-center gap-2 w-full bg-[#5B3DF5] text-white text-sm py-2.5 rounded-xl hover:brightness-110 transition font-medium"
        >
          <Plus size={16} />
          {t("postRequirement")}
        </button>
      </div>
    </aside>
  );
}
