"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserPlus,
  Upload,
  IndianRupee,
} from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo2.png";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";

const NOTIF_ICON = {
  welcome: <UserPlus size={14} className="text-purple-500" />,
  new_application: <UserPlus size={14} className="text-blue-500" />,
  deliverables_submitted: <Upload size={14} className="text-indigo-500" />,
  live_submitted: <Upload size={14} className="text-cyan-500" />,
  app_completed: <CheckCircle size={14} className="text-emerald-500" />,
  app_accepted: <CheckCircle size={14} className="text-emerald-500" />,
  app_approved: <CheckCircle size={14} className="text-blue-500" />,
  app_rejected: <XCircle size={14} className="text-red-500" />,
  app_revision_needed: <RotateCcw size={14} className="text-orange-500" />,
  app_payment: <IndianRupee size={14} className="text-amber-500" />,
};

const NOTIF_BG = {
  welcome: "bg-purple-50",
  new_application: "bg-blue-50",
  deliverables_submitted: "bg-indigo-50",
  live_submitted: "bg-cyan-50",
  app_completed: "bg-emerald-50",
  app_accepted: "bg-emerald-50",
  app_approved: "bg-blue-50",
  app_rejected: "bg-red-50",
  app_revision_needed: "bg-orange-50",
  app_payment: "bg-amber-50",
};

const parseBody = (n) => {
  try {
    const data = JSON.parse(n.body);
    return { text: data.text || n.body, link: data.link || null };
  } catch {
    return { text: n.body || "", link: null };
  }
};

const getNotifLink = (n) => parseBody(n).link || "/brands";
const getNotifText = (n) => parseBody(n).text;

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(diff / 3600000);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(diff / 86400000);
  return `${day}d`;
};

export function BrandNavbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showPopover, setShowPopover] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
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

  // Poll for notifications
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
        setNotifications(list);
        setUnread(list.filter((n) => !n.is_read).length);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, supabase]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await supabase.functions.invoke("notifications", {
      body: { action: "markRead", userId: user.id, notificationIds: "all" },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleNotifClick = (n) => {
    setShowPopover(false);
    router.push(getNotifLink(n));
  };

  const brandName = profile?.gstin_trade_name || profile?.brand_name || profile?.contact_name || "Brand";
  const logoUrl = profile?.logo_url;
  const initials = brandName.charAt(0).toUpperCase();

  return (
    <header className="w-full h-[72px] border-b bg-white hidden lg:flex items-center justify-between px-6 sticky top-0 z-[100]">
      {/* Left — logo doubles as a "back to home" link. */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          aria-label="Go to home page"
          className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image src={logo} alt="logo" height={100} width={200} />
        </button>
      </div>

      {/* Search — submits to the find-creators page with the query so
          Sidebar.Find Creators picks it up and filters by name / username /
          category. */}
      <form
        className="flex-1 max-w-xl mx-8"
        onSubmit={(e) => {
          e.preventDefault();
          const q = e.currentTarget.querySelector("input")?.value?.trim();
          router.push(q ? `/brands/search?q=${encodeURIComponent(q)}` : "/brands/search");
        }}
      >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            name="q"
            type="search"
            placeholder="Search creators by name, username or category…"
            className="w-full pl-9 pr-4 h-10 rounded-lg border bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </form>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Notification Bell + Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowPopover((v) => !v)}
            className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-[#E60076] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showPopover && (
            // z-[110] beats the sticky page headers / sticky filter bars on a
            // few of the brand pages that were previously rendering on top
            // of the popover.
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[110] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800">Notifications</h3>
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-[#5851DB] cursor-pointer hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-bold">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n, i) => (
                    <div
                      key={n.created_at + i}
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-none ${
                        !n.is_read ? "bg-purple-50/30" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${
                          NOTIF_BG[n.type] || "bg-slate-50"
                        } flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {NOTIF_ICON[n.type] || <Bell size={14} className="text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-bold leading-tight ${
                              !n.is_read ? "text-slate-800" : "text-slate-500"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium shrink-0">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {getNotifText(n)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-[#5851DB] rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 p-3">
                  <button
                    onClick={() => {
                      setShowPopover(false);
                      router.push("/brands/notifications");
                    }}
                    className="w-full py-2.5 text-xs font-bold text-[#5851DB] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Show All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>

        {/* Avatar & Name — opens profile */}
        <button
          onClick={() => router.push("/brands/profile")}
          className="flex items-center gap-2 cursor-pointer rounded-lg hover:bg-gray-50 px-2 py-1 transition-colors"
          title="View profile"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                width={40}
                height={40}
                className="rounded-full object-cover"
                alt={brandName}
              />
            ) : (
              <span className="text-purple-600 font-bold text-sm">{initials}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
            {brandName}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={() => setLogoutOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          title="Log Out"
        >
          <LogOut size={18} />
        </button>
      </div>
      <LogoutConfirmDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </header>
  );
}
