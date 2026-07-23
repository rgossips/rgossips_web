"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { WifiOff, RefreshCw } from "lucide-react";

// Full-screen "you're offline" takeover. Shows when the browser reports the
// connection is gone (offline event / navigator.onLine) and auto-dismisses
// only once the network is genuinely back — the 'online' event is verified
// with a real same-origin probe because browsers sometimes fire it while DNS
// is still dead. The Refresh button runs the same probe on demand.
export default function OfflineGate() {
  const t = useTranslations("OfflineGate");
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const probe = useCallback(async () => {
    try {
      // Same-origin tiny asset, cache-busted — no CORS, no caching lies.
      const res = await fetch(`/favicon.ico?ping=${Date.now()}`, { cache: "no-store" });
      return res.ok || res.status === 404; // any HTTP response = network is up
    } catch {
      return false;
    }
  }, []);

  const tryReconnect = useCallback(async () => {
    setChecking(true);
    const up = await probe();
    setChecking(false);
    if (up) setOffline(false);
    return up;
  }, [probe]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) setOffline(true);
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      // Verify before dismissing — only continue when the network is real.
      tryReconnect();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [tryReconnect]);

  // While the takeover is up, keep probing quietly so the page resumes the
  // moment connectivity returns even if no 'online' event fires.
  useEffect(() => {
    if (!offline) return;
    const id = setInterval(() => {
      probe().then((up) => up && setOffline(false));
    }, 4000);
    return () => clearInterval(id);
  }, [offline, probe]);

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8F9FD] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        {/* Graphic — broken-signal art */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#9810FA]/10 to-[#E60076]/10" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#9810FA]/15 to-[#E60076]/15" />
          <div
            className="absolute inset-8 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-100"
            style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
          >
            <WifiOff size={30} />
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-bounce">📡</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900">{t("title")}</h1>
        <p className="text-sm text-slate-500 leading-relaxed mt-3">{t("body")}</p>

        <button
          onClick={tryReconnect}
          disabled={checking}
          className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white text-sm font-black shadow-lg shadow-pink-100 cursor-pointer active:scale-95 transition-transform disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
        >
          <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
          {checking ? t("checking") : t("refresh")}
        </button>

        <p className="text-[11px] text-slate-400 mt-4">{t("autoNote")}</p>
      </div>
    </div>
  );
}
