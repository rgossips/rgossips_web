"use client";

import Link from "next/link";
import Image from "next/image";
import { useGlobal } from "@/context/GlobalContext";

export default function Audiences() {
  // The tab is driven by the shared GlobalContext `type` so the header's
  // "For Brands" / "For Influencers" links switch it (and scroll here).
  const { type, setType } = useGlobal();
  const audience = type === "influencers" ? "creator" : "brand";

  const isBrand = audience === "brand";
  const isCreator = audience === "creator";

  const pickBrand = () => setType("brands");
  const pickCreator = () => setType("influencers");

  const audEyebrow = isBrand ? "FOR BRANDS · ALWAYS FREE" : "FOR INFLUENCERS";
  const audTitle = isBrand ? "Launch a campaign before your coffee cools." : "Real deals. Paid on time. Every time.";
  const audPoints = isBrand
    ? [
        "Describe your brief in plain language — AI shortlists verified, fraud-checked creators in seconds.",
        "Chat, negotiate, and e-sign contracts in one thread.",
        "Live dashboards for views, engagement, and conversions.",
        "Escrow holds funds until you approve the content.",
      ]
    : [
        "Get matched to campaigns that fit your niche and audience.",
        "Clear briefs, fair rates, and rate benchmarking tools.",
        "Paid within 48 hours of approval on Elite — never chase an invoice again.",
        "AI captions, media kits, and a creator academy included.",
      ];
  const audAccent = isBrand ? "#7C3AED" : "#EC4899";
  const audBg = isBrand ? "linear-gradient(120deg, #F3EEFD, #FBEAF4)" : "linear-gradient(120deg, #FBEAF4, #FDF2F0)";
  const audCtaBg = isBrand ? "linear-gradient(95deg, #8B5CF6, #A855F7)" : "#111827";
  const audCta = isBrand ? "I'm a brand — it's free" : "I'm a creator — from ₹99/mo";
  const audCtaNote = isBrand ? "No commission — just a 5% escrow fee on payouts." : "14-day free trial on Pro · cancel anytime.";
  const chip1Glyph = isBrand ? "↗" : "₹";
  const chip1Val = isBrand ? "+245%" : "48 hrs";
  const chip1Label = isBrand ? "ROI Increase" : "Payout after approval";
  const chip2Val = isBrand ? "50K+" : "₹10Cr+";
  const chip2Label = isBrand ? "Active Users" : "Paid to creators";

  const brandTabBg = isBrand ? "linear-gradient(95deg, #8B5CF6, #A855F7)" : "transparent";
  const brandTabFg = isBrand ? "#FFFFFF" : "#6B7280";
  const creatorTabBg = isCreator ? "linear-gradient(95deg, #EC4899, #F472B6)" : "transparent";
  const creatorTabFg = isCreator ? "#FFFFFF" : "#6B7280";

  return (
    <section id="brands-influencers-section" data-screen-label="Audiences" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0", scrollMarginTop: "80px" }}>
      <div style={{ position: "relative", background: audBg, borderRadius: "28px", padding: "40px 52px 52px", overflow: "hidden", transition: "background 0.5s ease" }}>
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "190px", height: "190px", borderRadius: "50%", border: "22px solid rgba(168,85,247,0.12)", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "200px", height: "200px", borderRadius: "50%", border: "1.5px dashed #EC4899", opacity: 0.4, animation: "spinSlow 30s linear infinite", pointerEvents: "none" }}></div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#FFFFFF", borderRadius: "999px", padding: "5px", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
            <button onClick={pickBrand} style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: "13.5px", fontWeight: 800, padding: "10px 22px", borderRadius: "999px", background: brandTabBg, color: brandTabFg, transition: "all 0.25s ease" }}>For Brands <span style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.06em", background: "#10B981", color: "#FFFFFF", borderRadius: "999px", padding: "3px 9px" }}>FREE</span></button>
            <button onClick={pickCreator} style={{ border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: "13.5px", fontWeight: 800, padding: "10px 22px", borderRadius: "999px", background: creatorTabBg, color: creatorTabFg, transition: "all 0.25s ease" }}>For Influencers</button>
          </div>
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "56px", alignItems: "center", marginTop: "34px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.1em", color: audAccent, transition: "color 0.3s ease" }}>{audEyebrow}</div>
            <h3 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", margin: "14px 0 0", lineHeight: 1.15 }}>{audTitle}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
              {audPoints.map((pt, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", fontSize: "14.5px", color: "#4B5563", lineHeight: 1.55, fontWeight: 500 }}><span style={{ color: audAccent, transition: "color 0.3s ease" }}>✦</span>{pt}</div>
              ))}
            </div>
            <Link href="/login" style={{ display: "inline-block", marginTop: "28px", background: audCtaBg, color: "#FFFFFF", padding: "14px 28px", borderRadius: "999px", fontWeight: 800, fontSize: "14px", boxShadow: "0 8px 20px rgba(139,92,246,0.3)", transition: "all 0.3s ease" }}>{audCta}</Link>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", marginTop: "12px" }}>{audCtaNote}</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: "-14px", borderRadius: "32px", background: "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(236,72,153,0.12))", transform: "rotate(-2deg)", pointerEvents: "none" }}></div>
            <div style={{ position: "relative", width: "100%", height: "380px", borderRadius: "24px", overflow: "hidden", background: "linear-gradient(135deg,#EDE9FE,#FCE7F3)" }}>
              {/* Tab-driven product mock — swaps with the For Brands / For
                  Influencers toggle. Both PNGs are 1134×760. */}
              <Image
                src={isBrand ? "/landing/for-brands.png" : "/landing/for-influencers.png"}
                alt={isBrand ? "RGossips for brands — AI creator matching, live results and escrow" : "RGossips for influencers — brand invites, earnings and on-time payouts"}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                style={{ objectFit: "cover", objectPosition: "top", transition: "opacity 0.3s ease" }}
                priority={false}
              />
            </div>
            <div style={{ position: "absolute", top: "30px", left: "-22px", background: "#FFFFFF", borderRadius: "16px", padding: "12px 18px", boxShadow: "0 16px 40px rgba(17,24,39,0.12)", display: "flex", alignItems: "center", gap: "12px", animation: "floatA 5s ease-in-out infinite" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#ECFDF5", display: "grid", placeItems: "center", color: "#10B981", fontSize: "16px", fontWeight: 800 }}>{chip1Glyph}</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>{chip1Val}</div>
                <div style={{ fontSize: "11.5px", color: "#9CA3AF", fontWeight: 600 }}>{chip1Label}</div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "34px", right: "-18px", background: "#FFFFFF", borderRadius: "16px", padding: "12px 18px", boxShadow: "0 16px 40px rgba(17,24,39,0.12)", display: "flex", alignItems: "center", gap: "12px", animation: "floatB 6s ease-in-out infinite" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#F3EEFD", display: "grid", placeItems: "center", color: "#8B5CF6", fontSize: "16px", fontWeight: 800 }}>✦</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>{chip2Val}</div>
                <div style={{ fontSize: "11.5px", color: "#9CA3AF", fontWeight: 600 }}>{chip2Label}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
