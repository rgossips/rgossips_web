"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle,
  ChevronLeft,
  FileText,
  Loader2,
  UserPlus,
  Upload,
  IndianRupee,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { parseUtc, navigateOrRefresh } from "@/lib/utils";

const ICON_MAP = {
  welcome: <UserPlus className="w-5 h-5 text-purple-500" />,
  new_application: <UserPlus className="w-5 h-5 text-blue-500" />,
  deliverables_submitted: <Upload className="w-5 h-5 text-indigo-500" />,
  live_submitted: <Upload className="w-5 h-5 text-cyan-500" />,
  app_completed: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  app_accepted: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  app_approved: <CheckCircle className="w-5 h-5 text-blue-500" />,
  app_rejected: <XCircle className="w-5 h-5 text-red-500" />,
  app_revision_needed: <RotateCcw className="w-5 h-5 text-orange-500" />,
  app_payment: <IndianRupee className="w-5 h-5 text-amber-500" />,
};

const BG_MAP = {
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

const parseBody = (notif) => {
  try {
    const data = JSON.parse(notif.body);
    return { text: data.text || notif.body, link: data.link || null, campaignId: data.campaignId || null };
  } catch {
    return { text: notif.body || "", link: null, campaignId: null };
  }
};

const getLink = (notif) => {
  const { link, campaignId } = parseBody(notif);
  if (link) return link;
  if (campaignId) return `/brands/campaign/${campaignId}`;
  if (
    notif.type === "new_application" ||
    notif.type === "deliverables_submitted" ||
    notif.type === "live_submitted" ||
    (typeof notif.type === "string" && notif.type.startsWith("app_"))
  ) {
    return "/brands/campaigns";
  }
  return "/brands";
};

const getText = (notif) => parseBody(notif).text;

export default function BrandNotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations("BrandsNotifications");
  const supabase = createClient();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke("notifications", {
        body: { action: "list", userId: user.id },
      });
      if (!error && data?.notifications) setNotifications(data.notifications);
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
    if (!user?.id) return;
    try {
      await supabase.functions.invoke("notifications", {
        body: { action: "markRead", userId: user.id, notificationIds: "all" },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const formatTime = (dateStr) => {
    const date = parseUtc(dateStr);
    if (!date) return "";
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return t("time.justNow");
    if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
    if (diffHr < 24) return t("time.hoursAgo", { count: diffHr });
    if (diffDay < 7) return t("time.daysAgo", { count: diffDay });
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F8F9FE]">
      <header className="sticky top-0 z-30 bg-white px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm border-b border-slate-100">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-[#EBE9FE] hover:bg-[#dfddfb] transition-colors active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[#5851DB]" />
        </button>
        <h1 className="text-lg font-black text-slate-800">{t("title")}</h1>
        {unreadCount > 0 ? (
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] font-bold text-[#5851DB] cursor-pointer hover:underline"
          >
            {t("markAllRead")}
          </button>
        ) : (
          <div className="w-16" />
        )}
      </header>

      <main className="max-w-2xl mx-auto mt-4 px-4 pb-10 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-[#5851DB]" />
            <p className="text-sm font-bold text-slate-400">{t("loading")}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">{t("empty.title")}</p>
            <p className="text-xs text-slate-300 mt-1">
              {t("empty.subtitle")}
            </p>
          </div>
        ) : (
          notifications.map((item, index) => (
            <motion.div
              key={item.created_at + index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigateOrRefresh(router, pathname, getLink(item))}
              className={`relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                item.is_read
                  ? "bg-white/60 border-transparent"
                  : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-xl ${
                  BG_MAP[item.type] || "bg-slate-50"
                } flex items-center justify-center`}
              >
                {ICON_MAP[item.type] || <Bell className="w-5 h-5 text-slate-400" />}
              </div>

              <div className="flex-grow min-w-0 space-y-0.5">
                <div className="flex justify-between items-start gap-2">
                  <h3
                    className={`text-sm font-bold leading-tight ${
                      item.is_read ? "text-slate-500" : "text-slate-800"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                    {formatTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {getText(item)}
                </p>
              </div>

              {!item.is_read && (
                <div className="absolute top-4 right-3 w-2 h-2 bg-[#5851DB] rounded-full" />
              )}
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
