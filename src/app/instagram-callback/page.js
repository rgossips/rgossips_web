"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function InstagramCallback() {
  const t = useTranslations("InstagramCallback");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // If opened as a popup (reconnect flow), post message back to opener
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "instagram-oauth",
          code: code || null,
          error: error
            ? errorDescription
              ? errorDescription.replace(/\+/g, " ")
              : error
            : null,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    // Otherwise, save to localStorage and redirect (signup/signin flow)
    if (code) {
      localStorage.setItem("instagram_oauth_code", code);
    } else if (error) {
      localStorage.setItem(
        "instagram_oauth_error",
        errorDescription ? errorDescription.replace(/\+/g, " ") : error
      );
    }

    window.location.href = "/login";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0F0F1A] gap-3">
      <Loader2 size={28} className="text-pink-500 animate-spin" />
      <p className="text-white text-sm font-medium">{t("connecting")}</p>
    </div>
  );
}
