"use client";

import React from "react";

// Circular gradient info badge used next to "Your Trust Score" labels.
// Solid purple→pink fill with a white lowercase "i", subtle drop shadow.
// Sized via the `size` prop so it can sit alongside small captions on
// the homepage as well as the larger profile-page label.
export default function InfoBadge({ size = 16, className = "" }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full text-white font-extrabold leading-none shadow-[0_1px_3px_rgba(168,85,247,0.45)] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.6),
        // Lucide-style optical alignment — the lowercase "i" sits a touch
        // high inside the circle by default, this compensates.
        lineHeight: 1,
        paddingTop: 1,
      }}
    >
      i
    </span>
  );
}
