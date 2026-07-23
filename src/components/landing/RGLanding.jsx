"use client";

// Marketing landing — an exact React transcription of the "Recent Gossips
// Landing" design reference, rebuilt section-by-section. Each section lives in
// ./sections/*.jsx (self-contained, own state). This file composes them in the
// reference order and defines the shared @keyframes + base font wrapper.
// Rendered inside the (home) layout (which provides Header/Footer + the
// Baloo 2 / Manrope Google Fonts).

import { useEffect } from "react";
import { useGlobal } from "@/context/GlobalContext";
import Hero from "./sections/Hero";
import AIPrompt from "./sections/AIPrompt";
import Brands from "./sections/Brands";
import CreatorStories from "./sections/CreatorStories";
import Audiences from "./sections/Audiences";
import PainPoints from "./sections/PainPoints";
import Platform from "./sections/Platform";
import HowItWorks from "./sections/HowItWorks";
import Testimonials from "./sections/Testimonials";
import Pricing from "./sections/Pricing";
import Comparison from "./sections/Comparison";
import Stats from "./sections/Stats";
import Community from "./sections/Community";
import MobileApp from "./sections/MobileApp";
import FAQ from "./sections/FAQ";
import CTA from "./sections/CTA";
const heroStats = [
  { value: "200K+", label: "Verified creators" },
  { value: "₹10Cr+", label: "Paid to creators" },
  { value: "98%", label: "On-time payouts" },
];
// Exact keyframes from the reference stylesheet.
const KEYFRAMES = `
@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes riseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes floatB { 0%,100% { transform: translateY(0) rotate(3deg); } 50% { transform: translateY(-9px) rotate(-2deg); } }
@keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes shimmer { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
@keyframes growUp { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes reelProg { from { width: 0; } to { width: 100%; } }
@keyframes glowPulse { 0%, 100% { box-shadow: 0 0 8px 0 currentColor; } 50% { box-shadow: 0 0 22px 3px currentColor; } }
@keyframes eq { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
@keyframes notifIn { 0%, 100% { opacity: 0; transform: translateY(-14px); } 8%, 78% { opacity: 1; transform: translateY(0); } 90% { opacity: 0; transform: translateY(-14px); } }
`;

export default function RGLanding() {
  // Header nav sets `scrollTo` (a section id) on GlobalContext; scroll to it
  // once and clear. `scroll-margin-top` on each target keeps it clear of the
  // sticky header. (For Brands/Influencers also set `type`, which the
  // Audiences section reads to switch its tab.)
  const { scrollTo, setScrollTo } = useGlobal();
  useEffect(() => {
    if (!scrollTo) return;
    const id = scrollTo;
    // Defer so this wins the race with ScrollReset's scroll-to-top when the
    // intent arrives via a cross-page nav (e.g. footer link from /brands).
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollTo(null);
    }, 120);
    return () => clearTimeout(timer);
  }, [scrollTo, setScrollTo]);

  return (
    <div
      style={{
        width: "100%",
        background: "#FFFFFF",
        color: "#111827",
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{KEYFRAMES}</style>
      <Hero />
      <AIPrompt />
      <Brands />
      <CreatorStories />
      <div
        className="hero-stats"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "100px",
          marginTop: "60px",
          animation: "riseIn 0.6s ease 0.32s both",
        }}
      >
        {heroStats.map((st, i) => (
          <div key={i}>
            <div
              className="hero-stat-value"
              style={{
                fontSize: "50px",
                fontWeight: 800,
                background: "linear-gradient(95deg, #7C3AED, #EC4899)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textAlign: "center",
              }}
            >
              {st.value}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#9CA3AF",
                marginTop: "2px",
                textAlign: "center",
              }}
            >
              {st.label}
            </div>
          </div>
        ))}
      </div>
      <Audiences />
      <PainPoints />
      <Platform />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Comparison />
      <Stats />
      <Community />
      <MobileApp />
      <FAQ />
      <CTA />
    </div>
  );
}
