"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function InstagramCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // Save the OAuth result to sessionStorage
    if (code) {
      sessionStorage.setItem("instagram_oauth_code", code);
    } else if (error) {
      sessionStorage.setItem(
        "instagram_oauth_error",
        errorDescription ? errorDescription.replace(/\+/g, " ") : error
      );
    }

    // Redirect back to login page
    window.location.href = "/login";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0F0F1A] gap-3">
      <Loader2 size={28} className="text-pink-500 animate-spin" />
      <p className="text-white text-sm font-medium">Connecting to Instagram...</p>
    </div>
  );
}
