"use client";

import React, { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function LogoutConfirmDialog({ open, onClose, redirectTo = "/" }) {
  const t = useTranslations("LogoutConfirmDialog");
  const router = useRouter();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!open) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push(redirectTo);
    } finally {
      setLoggingOut(false);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90vw] max-w-xs flex flex-col items-center animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-500">
          <LogOut size={28} />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{t("title")}</h3>
        <p className="text-xs text-gray-500 mb-6 text-center">
          {t("confirm")}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loggingOut}
            className="flex-1 py-3 rounded-xl border border-gray-100 font-bold text-gray-600 text-xs bg-white cursor-pointer disabled:opacity-60"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-bold text-white text-xs shadow-lg shadow-pink-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : null}
            {loggingOut ? t("loggingOut") : t("logOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
