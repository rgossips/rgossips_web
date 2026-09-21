"use client";

import { useEffect, useState } from "react";
import { Instagram, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { isInstagramTokenExpired } from "@/lib/instagramToken";
import { useInstagramReconnect } from "@/hooks/useInstagramReconnect";

// Ask a returning creator to reconnect Instagram the moment we know their
// token is dead — as a popup, not only the inline banner on two pages, because
// a dead token silently freezes their media kit for every brand who opens it.
//
// Shown when the profile says the token is expired/rejected, or when this
// visit's background refresh-instagram reports it (instagramTokenMissing).
//
// "Later" hides it for this browser session only, so it asks again on the next
// visit — and again in the same tab if they come back after being away for
// REASK_AFTER_MS. Mounted once by ProtectedRoute on influencer routes; the
// hard InstagramRequiredGate still owns the never-connected case.
const DISMISS_KEY = "rg_ig_reconnect_dismissed_at";
const REASK_AFTER_MS = 30 * 60 * 1000;

function readDismissedAt() {
  try {
    return Number(sessionStorage.getItem(DISMISS_KEY)) || 0;
  } catch {
    return 0;
  }
}

export default function InstagramReconnectModal() {
  const t = useTranslations("InstagramReconnectModal");
  const { profile, instagramTokenMissing } = useAuth();
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);
  const { connecting, error, reconnect } = useInstagramReconnect({
    messages: { denied: t("denied"), failed: t("failed") },
  });

  // Coming back to the tab after a while counts as coming back to the
  // platform: forget an old "Later".
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const at = readDismissedAt();
      if (at && Date.now() - at > REASK_AFTER_MS) {
        try {
          sessionStorage.removeItem(DISMISS_KEY);
        } catch {
          /* storage blocked — state below still resets */
        }
        setDismissedAt(0);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const expired = !!profile?.instagram_connected && (instagramTokenMissing || isInstagramTokenExpired(profile));
  if (!expired || dismissedAt) return null;

  const later = () => {
    const now = Date.now();
    try {
      sessionStorage.setItem(DISMISS_KEY, String(now));
    } catch {
      /* private mode — dismiss for this render tree only */
    }
    setDismissedAt(now);
  };

  return (
    <div
      data-scroll-lock
      className="fixed inset-0 z-[410] flex items-end sm:items-center justify-center bg-black/50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-reconnect-title"
    >
      <div className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[90dvh] overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-2xl p-6 sm:p-7">
        <button
          onClick={later}
          aria-label={t("later")}
          className="absolute top-3 right-3 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center mb-4">
          <Instagram size={28} className="text-white" />
        </div>

        <h2 id="ig-reconnect-title" className="text-lg font-black text-slate-900 leading-snug pr-8">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t("body")}</p>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={later}
            className="sm:flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t("later")}
          </button>
          <button
            onClick={reconnect}
            disabled={connecting}
            className="sm:flex-1 h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)" }}
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
            {connecting ? t("connecting") : t("reconnect")}
          </button>
        </div>
      </div>
    </div>
  );
}
