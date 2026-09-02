"use client";

import {
  LayoutGrid,
  Search,
  Megaphone,
  User,
  HelpCircle,
  MessageSquare,
  Plus,
  Receipt,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { useTranslations } from "next-intl";
import BrandHelpAndSupport from "@/components/brands/BrandHelpAndSupport";
import BrandSupportChat from "@/components/brands/BrandSupportChat";
import BrandSidebarAccount from "@/components/brands/BrandSidebarAccount";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";

export default function Sidebar() {
  const t = useTranslations("BrandsSidebar");
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // Same hook the profile page and ProfileCompletionSection use, so the
  // sidebar percentage can never disagree with them.
  const { completion, loading: completionLoading } = useBrandTrustScore();
  const pct = completionLoading ? 0 : completion?.percent || 0;
  const remaining = completion?.missing?.length || 0;

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

  const isActive = (url) =>
    url === "/brands" ? pathname === "/brands" : pathname.startsWith(url);

  return (
    // Fills its fixed parent in the layout — no `fixed` and no `border-r` here
    // or we'd get a double border. The right edge is a gradient hairline
    // rather than a grey rule, per the design.
    <aside className="relative h-full w-full bg-white flex flex-col">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[3px] h-full opacity-55"
        style={{ background: "var(--bx-navy-grad)" }}
      />

      <div className="flex-1 overflow-y-auto px-4 pt-6 flex flex-col gap-6">
        {/* Logo — the wordmark now lives here rather than in a top bar. */}
        <div className="px-2">
          <Image
            src={logo}
            alt="RGossips"
            width={168}
            height={40}
            className="w-[168px] h-auto"
            priority
          />
        </div>

        <nav className="flex flex-col gap-1">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <button
                key={item.url}
                onClick={() => router.push(item.url)}
                aria-current={active ? "page" : undefined}
                className={`flex cursor-pointer items-center gap-[11px] w-full px-[13px] py-3 rounded-[13px] text-[13.5px] transition ${
                  active
                    ? "text-white font-semibold shadow-[0_8px_20px_rgba(106,102,201,.34)]"
                    : "text-[var(--bx-ink-2)] font-medium hover:bg-[var(--bx-grad-soft)] hover:text-[var(--bx-ink)]"
                }`}
                style={active ? { background: "var(--bx-grad)" } : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.name}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[9px] font-bold tracking-[.06em] px-[7px] py-[3px] rounded-md ${
                      active
                        ? "bg-white/20 text-white"
                        : "text-[var(--bx-accent-deep)] bg-[var(--bx-grad-soft)]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {active && !item.badge && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold tracking-[.12em] text-[var(--bx-faint)] px-[13px] pb-1.5">
            {t("accountLabel")}
          </div>
          {accountMenu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className="flex items-center gap-[11px] w-full px-[13px] py-[11px] rounded-xl text-[13.5px] font-medium text-[var(--bx-ink-2)] hover:bg-[var(--bx-grad-soft)] hover:text-[var(--bx-ink)] transition cursor-pointer"
              >
                <Icon size={17} className="shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
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

      <div className="px-4 pb-4 pt-2 flex flex-col gap-3">
        {/* Notifications + account. These lived in the removed top navbar; the
            design has no top bar, so they come down here rather than being
            dropped. */}
        <BrandSidebarAccount />

        {/* Profile completion — the design's sidebar card. Hidden once there is
            nothing left to finish, so it doesn't sit there reading 100%. */}
        {!completionLoading && pct < 100 && (
          <div className="rounded-2xl p-3.5 bg-[var(--bx-surface-soft)] border border-[var(--bx-rule-2)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{t("completion.title")}</span>
              <span className="text-xs font-bold bx-grad-text">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bx-rule-2)] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: "var(--bx-grad)" }}
              />
            </div>
            <button
              onClick={() => router.push("/brands/profile")}
              className="text-[11.5px] font-semibold bx-grad-text text-left cursor-pointer"
            >
              {t("completion.finish", { count: remaining })} →
            </button>
          </div>
        )}

        {/* Navigates to the campaigns list with ?new=1, which auto-opens the
            create dialog. */}
        <button
          onClick={() => router.push("/brands/campaigns?new=1")}
          className="flex cursor-pointer items-center justify-center gap-2 w-full text-white text-[13.5px] font-semibold py-3.5 rounded-[13px] hover:brightness-[1.06] transition shadow-[0_10px_24px_rgba(106,102,201,.32)]"
          style={{ background: "var(--bx-grad)" }}
        >
          <Plus size={16} />
          {t("postRequirement")}
        </button>
      </div>
    </aside>
  );
}
