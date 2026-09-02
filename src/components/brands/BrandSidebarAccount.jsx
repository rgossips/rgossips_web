"use client";

import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";

/**
 * Account strip at the foot of the brands sidebar: who you are signed in as,
 * unread notifications, and sign out.
 *
 * These three controls lived in BrandNavbar, which the Explore design removes.
 * They are rehomed rather than dropped — losing sign-out and the unread count
 * from the desktop surface entirely would have been a regression the design
 * never asked for.
 *
 * The bell navigates to /brands/notifications instead of reopening the
 * navbar's popover. That page already exists and is where the mobile bottom
 * nav's bell has always gone, so desktop and mobile now behave the same way,
 * and the ~100 lines of popover markup do not get a second copy to drift.
 */
export default function BrandSidebarAccount() {
  const t = useTranslations("BrandsSidebar");
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [unread, setUnread] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Same 30s poll the navbar ran. Only the count is needed here, but the
  // function has no count-only action, so we take the list and measure it.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("notifications", {
          body: { action: "list", userId: user.id },
        });
        if (cancelled) return;
        const list = data?.notifications || [];
        setUnread(list.filter((n) => !n.is_read).length);
      } catch {
        /* transient — keep the last known count rather than flashing zero */
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, supabase]);

  const brandName =
    profile?.gstin_trade_name ||
    profile?.brand_name ||
    profile?.contact_name ||
    t("defaultBrandName");
  const logoUrl = profile?.logo_url;
  const initials = brandName.trim().charAt(0).toUpperCase() || "B";

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--bx-rule-2)] bg-white p-2">
      <button
        onClick={() => router.push("/brands/profile")}
        title={t("actions.viewProfile")}
        className="flex items-center gap-2 min-w-0 flex-1 rounded-xl px-1 py-1 hover:bg-[var(--bx-grad-soft)] transition cursor-pointer"
      >
        <span className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-[var(--bx-grad-soft)] grid place-items-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              width={36}
              height={36}
              alt={brandName}
              className="rounded-full object-cover w-9 h-9"
            />
          ) : (
            <span className="text-[13px] font-bold text-[var(--bx-accent-deep)]">
              {initials}
            </span>
          )}
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[12.5px] font-semibold truncate text-[var(--bx-ink)]">
            {brandName}
          </span>
          <span className="block text-[10px] text-[var(--bx-faint)] truncate">
            {t("actions.viewProfile")}
          </span>
        </span>
      </button>

      <button
        onClick={() => router.push("/brands/notifications")}
        title={t("notifications.title")}
        aria-label={
          unread > 0
            ? `${t("notifications.title")} (${unread})`
            : t("notifications.title")
        }
        className="relative shrink-0 p-2 rounded-xl text-[var(--bx-muted)] hover:bg-[var(--bx-grad-soft)] hover:text-[var(--bx-ink)] transition cursor-pointer"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[#E1467C] text-white text-[9px] font-bold tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <button
        onClick={() => setLogoutOpen(true)}
        title={t("actions.logout")}
        aria-label={t("actions.logout")}
        className="shrink-0 p-2 rounded-xl text-[var(--bx-muted)] hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
      >
        <LogOut size={17} />
      </button>

      <LogoutConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
