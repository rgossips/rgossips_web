"use client";

import { useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(1);

  const monthlyBg = annual ? "transparent" : "linear-gradient(95deg, #8B5CF6, #A855F7)";
  const monthlyFg = annual ? "#6B7280" : "#FFFFFF";
  const annualBg = annual ? "linear-gradient(95deg, #8B5CF6, #A855F7)" : "transparent";
  const annualFg = annual ? "#FFFFFF" : "#6B7280";

  const plans = [
    { name: "STARTER", price: annual ? "₹79" : "₹99", who: "Nano & micro · 1K–25K followers", cta: "Get started", popular: false },
    { name: "PRO", price: annual ? "₹239" : "₹299", who: "Micro to mid-tier · 10K–200K", cta: "Start free trial", popular: true },
    { name: "ELITE", price: annual ? "₹559" : "₹699", who: "Macro & mega · 200K+ & full-time pros", cta: "Go Elite", popular: false },
  ].map((p, i) => {
    const sel = selectedPlan === i;
    return {
      ...p,
      per: annual ? "/mo · annual" : "/mo",
      select: () => setSelectedPlan(i),
      headBg: sel ? "linear-gradient(180deg, #FAF7FE, #FEF5FA)" : "#FFFFFF",
      nameColor: sel ? "#7C3AED" : "#9CA3AF",
      radioBorder: sel ? "#A855F7" : "#D6D3E0",
      radioBg: sel ? "linear-gradient(135deg, #8B5CF6, #EC4899)" : "transparent",
      radioShadow: sel ? "0 0 0 3px rgba(168,85,247,0.18)" : "none",
      ctaBg: sel ? "linear-gradient(95deg, #8B5CF6, #EC4899)" : "#FFFFFF",
      ctaFg: sel ? "#FFFFFF" : "#7C3AED",
      ctaBorder: sel ? "transparent" : "#E4D9FB",
      ctaShadow: sel ? "0 8px 20px rgba(139,92,246,0.35)" : "none",
    };
  });

  const planRows = (() => {
    const sel = selectedPlan;
    const rows = [
      { group: "VISIBILITY & DEALFLOW" },
      { label: "Brand search placement", v: ["Listed", "Priority · 3× visibility", "Featured · top spot"] },
      { label: "Campaign applications", v: ["3 /mo", "Unlimited", "Unlimited + AI shortlist"] },
      { label: "Brand DMs", v: ["10 /mo", "Unlimited", "Unlimited"] },
      { label: "Early access to deals", v: [null, "48hr head start", "Priority matching"] },
      { label: "Homepage spotlight", v: [null, null, "Monthly rotation"] },
      { group: "TOOLS & INSIGHTS" },
      { label: "AI content suite", v: ["3 /mo", "50 /mo", "Unlimited"] },
      { label: "Media kit", v: ["1 PDF template", "3 templates + link", "Custom builder"] },
      { label: "Analytics", v: ["Basic dashboard", "Advanced + export", "Deep + psychographics"] },
      { label: "Audience insights", v: [null, "Age · gender · location", "+ psychographics"] },
      { label: "Fake-follower audit", v: [null, "Monthly", "Monthly"] },
      { label: "Rate benchmarking", v: [null, "✓", "✓"] },
      { group: "PAYOUTS & SUPPORT" },
      { label: "Payout speed", v: ["7–10 days", "3–5 days", "Instant · 48hr"] },
      { label: "Account manager", v: [null, "Dedicated", "WhatsApp + email"] },
      { label: "Creator Academy", v: ["Community forums", "Full access", "Full + live Q&A"] },
      { label: "Verified badge", v: ["Eligibility", "✓", "Elite badge"] },
    ];
    return rows.map((r) => {
      if (r.group) return { label: r.group, isGroup: true, isFeature: false };
      return {
        label: r.label,
        isGroup: false,
        isFeature: true,
        cells: r.v.map((val, i) => {
          const isSel = sel === i;
          if (val === null) return { text: "—", color: "#C9CDD6", weight: 600, bg: isSel ? "rgba(168,85,247,0.045)" : "#FFFFFF" };
          return {
            text: val,
            color: val === "✓" ? "#10B981" : isSel ? "#7C3AED" : "#111827",
            weight: isSel ? 800 : 600,
            bg: isSel ? "rgba(168,85,247,0.045)" : "#FFFFFF",
          };
        }),
      };
    });
  })();

  return (
    <section id="pricing" data-screen-label="Pricing" style={{ background: "linear-gradient(180deg, #F8F7FC, #FFFFFF)", scrollMarginTop: "80px" }}>
      <style>{`
        .pricing-feat-row:hover { background: #FAF7FE; }
        .pricing-brand-cta:hover { transform: translateY(-2px); }
      `}</style>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Simple, transparent pricing.</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", color: "#6B7280", fontWeight: 600 }}>Creators pay a little. Brands pay nothing — ever.</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#FFFFFF", border: "1px solid #EDECF2", borderRadius: "999px", padding: "4px", boxShadow: "0 4px 14px rgba(17,24,39,0.05)" }}>
              <button onClick={() => setAnnual(false)} style={{ border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: "13px", fontWeight: 800, padding: "8px 18px", borderRadius: "999px", background: monthlyBg, color: monthlyFg, transition: "all 0.25s ease" }}>Monthly</button>
              <button onClick={() => setAnnual(true)} style={{ display: "inline-flex", alignItems: "center", gap: "7px", border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: "13px", fontWeight: 800, padding: "8px 18px", borderRadius: "999px", background: annualBg, color: annualFg, transition: "all 0.25s ease" }}>Annual <span style={{ fontSize: "10px", fontWeight: 800, background: "#ECFDF5", color: "#10B981", borderRadius: "999px", padding: "2px 8px" }}>−20%</span></button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "48px", background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.5), rgba(168,85,247,0.25) 45%, rgba(124,58,237,0.5)) border-box", border: "1.5px solid transparent", borderRadius: "28px", overflow: "hidden", boxShadow: "0 14px 40px rgba(124,58,237,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr" }}>
            <div style={{ padding: "28px 30px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>COMPARE PLANS</div>
              <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.6, margin: "8px 0 0" }}>Every plan, feature by feature. Click a plan to see exactly what you'd get — and what you'd miss.</p>
            </div>
            {plans.map((pl, i) => (
              <div key={i} onClick={pl.select} style={{ position: "relative", padding: "24px 22px", cursor: "pointer", borderLeft: "1px solid #F1F0F5", background: pl.headBg, transition: "background 0.25s ease" }}>
                {pl.popular && (
                  <span style={{ position: "absolute", top: "14px", right: "14px", fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.08em", background: "linear-gradient(95deg, #8B5CF6, #EC4899)", color: "#FFFFFF", padding: "4px 10px", borderRadius: "999px" }}>POPULAR</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${pl.radioBorder}`, background: pl.radioBg, boxShadow: pl.radioShadow, transition: "all 0.2s ease", flexShrink: 0 }}></span>
                  <span style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.12em", color: pl.nameColor, transition: "color 0.2s ease" }}>{pl.name}</span>
                </div>
                <div style={{ marginTop: "12px" }}><span style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em" }}>{pl.price}</span><span style={{ fontSize: "12px", color: "#9CA3AF" }}>{pl.per}</span></div>
                <div style={{ fontSize: "11.5px", color: "#6B7280", lineHeight: 1.5, marginTop: "6px" }}>{pl.who}</div>
                <Link href="/login" style={{ display: "block", textAlign: "center", marginTop: "16px", padding: "10px", borderRadius: "999px", fontWeight: 800, fontSize: "12.5px", background: pl.ctaBg, color: pl.ctaFg, border: `1.5px solid ${pl.ctaBorder}`, boxShadow: pl.ctaShadow, transition: "all 0.25s ease" }}>{pl.cta}</Link>
              </div>
            ))}
          </div>
          {planRows.map((row, i) => (
            <div key={i}>
              {row.isGroup && (
                <div style={{ padding: "16px 30px 9px", borderTop: "1px solid #F1F0F5", fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.14em", color: "#A855F7", background: "#FCFBFE" }}>{row.label}</div>
              )}
              {row.isFeature && (
                <div className="pricing-feat-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", alignItems: "stretch", borderTop: "1px solid #F7F6FA", transition: "background 0.2s ease" }}>
                  <span style={{ padding: "12px 30px", fontSize: "13.5px", fontWeight: 700, color: "#4B5563", display: "flex", alignItems: "center" }}>{row.label}</span>
                  {row.cells.map((cell, ci) => (
                    <span key={ci} style={{ padding: "12px 18px", borderLeft: "1px solid #F1F0F5", background: cell.bg, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "12.5px", fontWeight: cell.weight, color: cell.color, transition: "background 0.25s ease, color 0.25s ease" }}>{cell.text}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ position: "relative", marginTop: "22px", background: "linear-gradient(115deg, #7C3AED, #A855F7 55%, #EC4899)", borderRadius: "24px", padding: "30px 36px", color: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", boxShadow: "0 18px 44px rgba(124,58,237,0.3)" }}>
          <div style={{ position: "absolute", top: "-46px", right: "22%", width: "120px", height: "120px", borderRadius: "50%", border: "16px solid rgba(255,255,255,0.12)", animation: "floatA 6s ease-in-out infinite", pointerEvents: "none" }}></div>
          <div style={{ position: "absolute", bottom: "-30px", left: "34%", width: "64px", height: "64px", background: "rgba(255,255,255,0.1)", borderRadius: "18px", transform: "rotate(20deg)", animation: "floatB 7s ease-in-out infinite", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em", background: "#FFFFFF", color: "#7C3AED", borderRadius: "999px", padding: "9px 18px", boxShadow: "0 0 0 5px rgba(255,255,255,0.18)", animation: "shimmer 2.6s ease-in-out infinite" }}>100% FREE</span>
            <span>
              <span style={{ display: "block", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>Brands join free. Forever.</span>
              <span style={{ display: "block", fontSize: "13.5px", color: "rgba(255,255,255,0.82)", marginTop: "3px" }}>No subscription, no commission — just a flat 5% escrow fee on payouts.</span>
            </span>
          </div>
          <Link href="/login" className="pricing-brand-cta" style={{ position: "relative", background: "#FFFFFF", color: "#7C3AED", fontWeight: 800, padding: "14px 28px", borderRadius: "999px", fontSize: "14px", boxShadow: "0 10px 24px rgba(30,27,46,0.2)", transition: "transform 0.2s ease" }}>Join as a brand →</Link>
        </div>
      </div>
    </section>
  );
}
