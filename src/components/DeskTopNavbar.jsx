"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Home,
  Compass,
  Briefcase,
  User,
  HeadphonesIcon,
  Bell,
  LogOut,
  CheckCircle,
  Award,
  UserPlus,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/logo2.png";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import SupportChat from "@/components/SupportChat";
import { createClient } from "@/utils/supabase/client";
import { parseUtc, navigateOrRefresh } from "@/lib/utils";

const DESKTOP_NAV_ITEMS = [
  { key: "home", icon: <Home size={20} />, href: "/influencer" },
  { key: "brands", icon: <Compass size={20} />, href: "/influencer/brands" },
  { key: "campaigns", icon: <Briefcase size={20} />, href: "/influencer/campaigns" },
  { key: "services", icon: <Sparkles size={20} />, href: "/influencer/services" },
  { key: "profile", icon: <User size={20} />, href: "/influencer/profile" },
];

const NOTIF_ICON = {
  welcome: <UserPlus size={16} className="text-purple-500" />,
  profile_incomplete: <FileText size={16} className="text-amber-500" />,
  campaign_status: <Bell size={16} className="text-pink-500" />,
  campaign_approved: <CheckCircle size={16} className="text-emerald-500" />,
};

const NOTIF_BG = {
  welcome: "bg-purple-50",
  profile_incomplete: "bg-amber-50",
  campaign_status: "bg-pink-50",
  campaign_approved: "bg-emerald-50",
};

// Prefer the link the emitter packed into the body — that's where every
// service-marketplace notification (quote ready, draft ready, completed,
// etc.) points at a specific order detail page. Fall back to a sensible
// per-type destination so old rows still route reasonably.
const getNotifLink = (notif) => {
  try {
    const data = JSON.parse(notif.body);
    if (data?.link) return data.link;
    // Any app_* notification (work accepted, revision requested, escrow
    // funded, etc.) is tied to a specific campaign — route to its offer
    // page whenever the body carries a campaignId.
    if ((notif.type?.startsWith("app_") || notif.type === "escrow_funded") && data?.campaignId) {
      return `/influencer/offers/${data.campaignId}`;
    }
    if (notif.type === "campaign_status" || notif.type === "campaign_approved") {
      if (data?.campaignId) return `/influencer/offers/${data.campaignId}`;
    }
  } catch {}
  if (notif.type === "welcome") return "/influencer";
  if (notif.type === "profile_incomplete") return "/influencer/profile";
  if (notif.type === "campaign_status" || notif.type === "campaign_approved") return "/influencer/campaigns";
  if (notif.type?.startsWith("service_")) return "/influencer/services/orders";
  if (notif.type?.startsWith("app_")) return "/influencer/campaigns";
  return "/influencer";
};

const getNotifText = (notif) => {
  try {
    const data = JSON.parse(notif.body);
    return data.text || notif.body;
  } catch {}
  return notif.body;
};

const apiCall = async (fn, body) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    body: JSON.stringify(body),
  });
  return res.json();
};

// Same mapping as the DB trigger — hides notification rows whose category
// the user has toggled off. Returning null = unmapped = always show.
const prefKeyForType = (type) => {
  if (!type) return null;
  if (type.startsWith("app_") || type === "new_application" || type === "application_status") return "applicationStatus";
  if (["service_advance_paid", "service_final_paid", "payment_released", "payment_received"].includes(type)) return "paymentAlerts";
  if (type.startsWith("deadline")) return "deadlineReminders";
  if (["campaign_match", "new_campaign"].includes(type)) return "campaignUpdates";
  return null;
};

export const DesktopNavbar = () => {
  const t = useTranslations("DeskTopNavbar");
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load notification prefs once so the popover hides categories the user
  // has turned off (without hammering the DB on every refresh).
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_preferences")
      .select("notification_prefs")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setPrefs(data?.notification_prefs || {}));
  }, [user?.id, supabase]);

  const visibleNotifications = notifications.filter((n) => {
    if (!prefs) return true;
    const key = prefKeyForType(n.type);
    if (!key) return true;
    return prefs[key] !== false;
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetchCounts = async () => {
      try {
        const [notifData, chatData] = await Promise.all([
          apiCall("notifications", { action: "list", userId: user.id }),
          apiCall("chat", { action: "listConversations", userId: user.id }),
        ]);
        const notifs = notifData?.notifications || [];
        setNotifications(notifs);
        setUnreadChats((chatData?.conversations || []).reduce((s, c) => s + (c.unread || 0), 0));
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Recompute unread count whenever notifications OR prefs change so toggling
  // a category in settings updates the badge immediately.
  useEffect(() => {
    setUnreadCount(visibleNotifications.filter((n) => !n.is_read).length);
  }, [notifications, prefs]);

  const handleMarkAllRead = async () => {
    await apiCall("notifications", { action: "markRead", userId: user.id, notificationIds: "all" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (notif) => {
    setShowPopover(false);
    navigateOrRefresh(router, pathname, getNotifLink(notif));
  };

  const formatTime = (dateStr) => {
    const date = parseUtc(dateStr);
    if (!date) return "";
    const diff = Date.now() - date.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return t("time.now");
    if (min < 60) return t("time.minutes", { n: min });
    const hr = Math.floor(diff / 3600000);
    if (hr < 24) return t("time.hours", { n: hr });
    const day = Math.floor(diff / 86400000);
    return t("time.days", { n: day });
  };

  return (
    <nav className="hidden lg:grid grid-cols-3 fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-50 px-12 items-center shadow-sm">
      <div>
        <Link href="/" aria-label={t("goToHomepage")} className="inline-block">
          <Image src={logo} alt="logo" height={200} width={200} className="cursor-pointer" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/influencer"
              ? pathname === "/influencer"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.key} href={item.href} className="flex flex-col items-center justify-center relative group px-6 py-2">
              {isActive && <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A]" />}
              {React.cloneElement(item.icon, {
                strokeWidth: isActive ? 2.5 : 2,
                className: `transition-all duration-300 ${isActive ? "text-[#F6339A] scale-110" : "text-[#64748B] group-active:scale-90"}`,
              })}
              <span className={`text-sm mt-1 font-semibold transition-colors duration-300 ${isActive ? "text-[#F6339A]" : "text-[#94A3B8]"}`}>{t(`nav.${item.key}`)}</span>
            </Link>
          );
        })}
      </div>
      <div className="hidden lg:flex items-center justify-end gap-3 flex-1">
        <div className="flex gap-2">
          {/* Notification Bell with Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowPopover(!showPopover)}
              className="hidden cursor-pointer lg:flex p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors relative"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60076] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Popover */}
            {showPopover && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-800">{t("notifications")}</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#E60076] cursor-pointer hover:underline">
                      {t("markAllRead")}
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {visibleNotifications.length === 0 ? (
                    <div className="text-center py-10">
                      <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-bold">{t("noNotifications")}</p>
                    </div>
                  ) : (
                    visibleNotifications.slice(0, 8).map((n, i) => (
                      <div
                        key={n.created_at + i}
                        onClick={() => handleNotifClick(n)}
                        className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-none ${
                          !n.is_read ? "bg-pink-50/30" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${NOTIF_BG[n.type] || "bg-slate-50"} flex items-center justify-center shrink-0 mt-0.5`}>
                          {NOTIF_ICON[n.type] || <Bell size={14} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-bold leading-tight ${!n.is_read ? "text-slate-800" : "text-slate-500"}`}>{n.title}</p>
                            <span className="text-[9px] text-slate-400 font-medium shrink-0">{formatTime(n.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{getNotifText(n)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 bg-[#E60076] rounded-full shrink-0 mt-2" />}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 p-3">
                  <button
                    onClick={() => { setShowPopover(false); router.push("/influencer/notifications"); }}
                    className="w-full py-2.5 text-xs font-bold text-[#E60076] hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                  >
                    {t("showAllNotifications")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSupportOpen(true)}
            className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 hover:text-pink-500 border border-slate-100 transition-colors"
            title={t("support")}
          >
            <HeadphonesIcon size={22} />
          </button>
          <button
            onClick={() => setLogoutOpen(true)}
            className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-red-500 hover:bg-red-50 border border-slate-100 transition-colors"
            title={t("logOut")}
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
      <LogoutConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
      <SupportChat open={supportOpen} onClose={() => setSupportOpen(false)} />
    </nav>
  );
};
