"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Smartphone, Globe } from "lucide-react";
import { cameFromApp } from "@/lib/app-handoff";

// Shown once per session when the web portal's login/signup page is opened
// on a phone: nudge toward the mobile app, with a graceful "continue on
// web". "Use mobile app" deep-links into the installed app and falls back
// to the store when it isn't installed:
//   - Android: an intent:// URL with S.browser_fallback_url — Chrome opens
//     the app if present, else navigates to the Play Store. No timers.
//   - iOS: try the custom scheme, and if the page is still visible after
//     ~1.6s (i.e. nothing handled it), jump to the App Store.
const ANDROID_PACKAGE = "com.rgossips";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// TODO: replace with the real App Store id once the iOS app is published.
const APP_STORE_URL = "https://apps.apple.com/app/rgossips/id0000000000";
const DEEP_LINK_PATH = "login"; // rgossips://login → app's Login screen

const DISMISS_KEY = "rg-open-in-app-dismissed";

const getMobileOS = () => {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
  return null;
};

export default function OpenInAppGate() {
  const t = useTranslations("OpenInAppGate");
  const [os, setOs] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const detected = getMobileOS();
    if (!detected) return;
    // Arrived here from the mobile app (e.g. "Manage plan" hand-off) — they
    // already have the app, so nudging them to install it is just confusing.
    if (cameFromApp()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    setOs(detected);
    setOpen(true);
  }, []);

  if (!open || !os) return null;

  const continueWeb = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const openApp = () => {
    // Either way the user leaves this tab (app or store) — don't re-prompt
    // when they come back.
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    if (os === "android") {
      window.location.href =
        `intent://${DEEP_LINK_PATH}#Intent;scheme=rgossips;package=${ANDROID_PACKAGE};` +
        `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
      return;
    }
    // iOS: attempt the scheme; if nothing grabbed it, go to the App Store.
    // Empty path — the app's linking config maps "" to its Login screen.
    const start = Date.now();
    window.location.href = "rgossips://";
    setTimeout(() => {
      // If the app opened, the page was backgrounded and the timer either
      // never fires or fires late — both checks guard the store redirect.
      if (!document.hidden && Date.now() - start < 2600) {
        window.location.href = APP_STORE_URL;
      }
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-white rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 text-center">
        <div
          className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-100"
          style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
        >
          <Smartphone size={26} />
        </div>
        <h3 className="text-lg font-black text-slate-900">{t("title")}</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed mt-2">{t("body")}</p>

        <div className="mt-6 space-y-3">
          <button
            onClick={openApp}
            className="w-full h-12 rounded-2xl text-white text-sm font-black shadow-lg shadow-pink-100 cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
          >
            {t("useApp")}
          </button>
          <button
            onClick={continueWeb}
            className="w-full h-12 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <Globe size={15} /> {t("continueWeb")}
          </button>
        </div>
      </div>
    </div>
  );
}
