"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InstagramCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (window.opener) {
      // Desktop popup mode — send message back to parent
      window.opener.postMessage(
        {
          type: "instagram-oauth",
          code,
          error,
          errorDescription: errorDescription
            ? errorDescription.replace(/\+/g, " ")
            : null,
        },
        window.location.origin
      );
      window.close();
    } else {
      // Mobile redirect mode — store code and redirect back to login
      if (code) {
        sessionStorage.setItem("instagram_oauth_code", code);
      } else if (error) {
        sessionStorage.setItem("instagram_oauth_error", errorDescription?.replace(/\+/g, " ") || error);
      }
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0F0F1A]">
      <p className="text-white text-sm">Connecting to Instagram...</p>
    </div>
  );
}
