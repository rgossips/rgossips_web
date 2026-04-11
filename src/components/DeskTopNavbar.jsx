"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Compass,
  Briefcase,
  User,
  MessageSquare,
  Bell,
  Search,
  LogOut,
  CheckCircle,
  Award,
  UserPlus,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/logo2.png";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const DESKTOP_NAV_ITEMS = [
  { label: "Home", icon: <Home size={20} />, href: "/influencer" },
  { label: "Brands", icon: <Compass size={20} />, href: "/influencer/brands" },
  { label: "Campaigns", icon: <Briefcase size={20} />, href: "/influencer/campaigns" },
  { label: "Profile", icon: <User size={20} />, href: "/influencer/profile" },
];

const NOTIF_ICON = {
  welcome: <UserPlus size={16} className="text-purple-500" />,
  profile_incomplete: <FileText size={16} className="text-amber-500" />,
  campaign_applied: <Award size={16} className="text-blue-500" />,
  campaign_status: <Bell size={16} className="text-pink-500" />,
  campaign_approved: <CheckCircle size={16} className="text-emerald-500" />,
};

const NOTIF_BG = {
  welcome: "bg-purple-50",
  profile_incomplete: "bg-amber-50",
  campaign_applied: "bg-blue-50",
  campaign_status: "bg-pink-50",
  campaign_approved: "bg-emerald-50",
};

const NOTIF_LINK = {
  welcome: "/influencer/profile",
  profile_incomplete: "/influencer/profile",
  campaign_applied: "/influencer/campaigns",
  campaign_status: "/influencer/campaigns",
  campaign_approved: "/influencer/campaigns",
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

export const DesktopNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
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
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
        setUnreadChats((chatData?.conversations || []).reduce((s, c) => s + (c.unread || 0), 0));
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    await apiCall("notifications", { action: "markRead", userId: user.id, notificationIds: "all" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (notif) => {
    setShowPopover(false);
    const link = NOTIF_LINK[notif.type] || "/influencer/notifications";
    router.push(link);
  };

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

  return (
    <nav className="hidden lg:grid grid-cols-3 fixed top-0 left-0 right-0 h-20 bg-white border-b border-slate-100 z-50 px-12 items-center shadow-sm">
      <div>
        <Image src={logo} alt="logo" height={200} width={200} />
      </div>
      <div className="flex items-center gap-2">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/influencer"
              ? pathname === "/influencer"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center relative group px-6 py-2">
              {isActive && <div className="absolute top-0 w-12 h-[3px] rounded-b-full bg-gradient-to-r from-[#8E2DE2] to-[#F6339A]" />}
              {React.cloneElement(item.icon, {
                strokeWidth: isActive ? 2.5 : 2,
                className: `transition-all duration-300 ${isActive ? "text-[#F6339A] scale-110" : "text-[#64748B] group-active:scale-90"}`,
              })}
              <span className={`text-sm mt-1 font-semibold transition-colors duration-300 ${isActive ? "text-[#F6339A]" : "text-[#94A3B8]"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="hidden lg:flex items-center gap-3 flex-1 lg:max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search campaigns, brands..." className="w-full bg-white py-3.5 pl-12 pr-4 rounded-2xl text-sm font-medium border-none shadow-sm focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-slate-400" />
        </div>

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
                  <h3 className="text-sm font-black text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#E60076] cursor-pointer hover:underline">
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
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{n.body}</p>
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
                    Show All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link href="/influencer/chats" className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-slate-600 border border-slate-100 relative">
            <MessageSquare size={22} />
            {unreadChats > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60076] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadChats > 9 ? "9+" : unreadChats}
              </span>
            )}
          </Link>
          <button
            onClick={async () => { await signOut(); router.push("/login"); }}
            className="p-3.5 cursor-pointer lg:p-3.5 bg-white rounded-2xl shadow-sm text-red-500 hover:bg-red-50 border border-slate-100 transition-colors"
            title="Log Out"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
};
