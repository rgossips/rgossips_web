"use client";

import { useEffect } from "react";

export default function InstagramCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (window.opener) {
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
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0F0F1A]">
      <p className="text-white text-sm">Connecting to Instagram...</p>
    </div>
  );
}
