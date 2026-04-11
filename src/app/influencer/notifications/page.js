"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, CheckCircle, Award, UserPlus, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP = {
  welcome: <UserPlus className="w-5 h-5 text-purple-500" />,
  profile_incomplete: <FileText className="w-5 h-5 text-amber-500" />,
  campaign_status: <Bell className="w-5 h-5 text-pink-500" />,
  campaign_approved: <CheckCircle className="w-5 h-5 text-emerald-500" />,
};

const getNotifLink = (notif) => {
  if (notif.type === "welcome") return "/influencer";
  if (notif.type === "profile_incomplete") return "/influencer/profile";
  if (notif.type === "campaign_status" || notif.type === "campaign_approved") {
    try {
      const data = JSON.parse(notif.body);
      if (data.campaignId) return `/influencer/offers/${data.campaignId}`;
    } catch {}
    return "/influencer/campaigns";
  }
  return "/influencer";
};

const getNotifText = (notif) => {
  try {
    const data = JSON.parse(notif.body);
    return data.text || notif.body;
  } catch {}
  return notif.body;
};

const BG_MAP = {
  welcome: "bg-purple-50",
  profile_incomplete: "bg-amber-50",
  campaign_applied: "bg-blue-50",
  campaign_status: "bg-pink-50",
  campaign_approved: "bg-emerald-50",
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "list", userId: user.id }),
      });
      const data = await res.json();
      if (data?.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      await fetch(`${supabaseUrl}/functions/v1/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ action: "markRead", userId: user.id, notificationIds: "all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-10 lg:pt-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white lg:bg-[#F8F9FD] px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm lg:shadow-none border-b border-slate-100 lg:border-none">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[#E60076]" />
        </button>
        <h1 className="text-lg font-black text-slate-800">Notifications</h1>
        {unreadCount > 0 ? (
          <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#E60076] cursor-pointer hover:underline">
            Mark all read
          </button>
        ) : (
          <div className="w-16" />
        )}
      </header>

      {/* Notification List */}
      <main className="max-w-2xl mx-auto mt-4 px-4 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-purple-500" />
            <p className="text-sm font-bold text-slate-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No notifications yet</p>
            <p className="text-xs text-slate-300 mt-1">You'll be notified about campaign updates and more</p>
          </div>
        ) : (
          notifications.map((item, index) => (
            <motion.div
              key={item.created_at + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(getNotifLink(item))}
              className={`relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                item.is_read
                  ? "bg-white/60 border-transparent"
                  : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${BG_MAP[item.type] || "bg-slate-50"} flex items-center justify-center`}>
                {ICON_MAP[item.type] || <Bell className="w-5 h-5 text-slate-400" />}
              </div>

              <div className="flex-grow min-w-0 space-y-0.5">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`text-sm font-bold leading-tight ${item.is_read ? "text-slate-500" : "text-slate-800"}`}>
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {formatTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{getNotifText(item)}</p>
              </div>

              {!item.is_read && (
                <div className="absolute top-4 right-3 w-2 h-2 bg-[#E60076] rounded-full" />
              )}
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
