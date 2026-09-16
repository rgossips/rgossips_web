"use client";

import React, { useState } from "react";
import { Instagram, Loader2, X, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { isInstagramInsightsNotGranted, isInstagramTokenExpired } from "@/lib/instagramToken";
import { useInstagramReconnect } from "@/hooks/useInstagramReconnect";

export default function InstagramReconnectBanner() {
  const t = useTranslations("InstagramReconnectBanner");
  const { profile, instagramTokenMissing } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  // Same flow as the reconnect popup — see useInstagramReconnect.
  const { connecting, error, reconnect: handleReconnect } = useInstagramReconnect({
    messages: { denied: t("denied"), failed: t("failed") },
  });
  const expired = instagramTokenMissing || isInstagramTokenExpired(profile);
  // A working connection without the insights permission needs the same fix —
  // reconnect — but a different explanation: leave "insights" switched on.
  const insightsMissing = !expired && isInstagramInsightsNotGranted(profile);

  if ((!expired && !insightsMissing) || dismissed) return null;

  return (
    <div className="mx-4 lg:mx-10 mb-4">
      <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center">
          <Instagram size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-sm font-bold text-slate-900">{insightsMissing ? t("insightsTitle") : t("title")}</p>
          </div>
          <p className="text-xs text-slate-500">
            {insightsMissing ? t("insightsBody") : t("body")}
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>

        <button
          onClick={handleReconnect}
          disabled={connecting}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 cursor-pointer disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)" }}
        >
          {connecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            t("reconnect")
          )}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
