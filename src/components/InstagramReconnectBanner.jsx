"use client";

import React, { useState, useEffect } from "react";
import { Instagram, Loader2, X, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function InstagramReconnectBanner() {
  const t = useTranslations("InstagramReconnectBanner");
  const { user, instagramTokenMissing, setInstagramTokenMissing, refreshProfile, refreshInstagram } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "instagram-oauth") return;

      if (event.data.error) {
        setError(t("denied"));
        setConnecting(false);
        return;
      }

      if (event.data.code) {
        await exchangeCode(event.data.code);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const exchangeCode = async (code) => {
    setConnecting(true);
    setError("");
    try {
      const redirectUri = `${window.location.origin}/instagram-callback`;
      const { data, error: funcError } = await supabase.functions.invoke(
        "instagram-connect",
        { body: { code, redirectUri } }
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      // Save the token to the profile
      const { data: updateData, error: updateError } = await supabase.functions.invoke(
        "update-profile",
        {
          body: {
            userId: user.id,
            table: "influencer_profiles",
            instagramAccessToken: data.accessToken,
            instagramTokenExpiresAt: data.tokenExpiresAt,
          },
        }
      );
      if (updateError) throw new Error(updateError.message);
      if (updateData?.error) throw new Error(updateData.error);

      setInstagramTokenMissing(false);
      // Trigger Instagram data + analytics refresh, then reload profile
      await refreshInstagram(user.id);
    } catch (err) {
      setError(err.message || t("failed"));
    } finally {
      setConnecting(false);
    }
  };

  const handleReconnect = () => {
    setError("");

    // Use intermediate route to prevent mobile deep linking to Instagram app
    const reconnectUrl = `/api/auth/instagram?mode=reconnect&popup=1`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      reconnectUrl,
      "instagram-oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  if (!instagramTokenMissing || dismissed) return null;

  return (
    <div className="mx-4 lg:mx-10 mb-4">
      <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center">
          <Instagram size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-sm font-bold text-slate-900">{t("title")}</p>
          </div>
          <p className="text-xs text-slate-500">
            {t("body")}
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
