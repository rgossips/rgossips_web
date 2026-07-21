"use client";

import { useState } from "react";

const painsData = [
  { title: "Finding creators is a full-time job", desc: "Thousands of profiles, wrong niches, fake followers, zero ROI.", fix: "Describe your brief in one sentence — AI shortlists verified creators in 0.4s." },
  { title: "Agencies eat the budget first", desc: "30–40% commission gone before a single post goes live.", fix: "No agencies. 5% flat escrow fee — and brands join free." },
  { title: "Creators get paid late — or never", desc: "Broken payment chains and handshake contracts.", fix: "Escrow-backed payouts within 48 hours of approval. Every time." },
  { title: "Zero visibility on performance", desc: "Vanity metrics and reports that arrive a week late.", fix: "Live dashboards for reach, engagement, and conversions." },
];

export default function PainPoints() {
  const [painsFixed, setPainsFixed] = useState([false, false, false, false]);

  const toggle = (i) => setPainsFixed((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const resetPains = () => setPainsFixed([false, false, false, false]);

  const n = painsFixed.filter(Boolean).length;
  const allPainsFixed = n === 4;
  const painsStatus =
    n === 0
      ? "RGossips kills all four — tap a card to see how."
      : n < 4
      ? `${n} of 4 fixed — keep going.`
      : "All four killed — in about ten minutes, on RGossips. ↓";

  return (
    <section data-screen-label="Pain points" className="pp-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
      <style>{`.pp-card:hover{transform:translateY(-4px);box-shadow:0 16px 36px rgba(124,58,237,0.14)}.pp-reset:hover{background:#F3EEFD}`}</style>
      <div style={{ textAlign: "center", maxWidth: "620px", margin: "0 auto" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em", color: "#EC4899" }}>THE OLD WAY</div>
        <h2 className="pp-title" style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: "14px 0 0", lineHeight: 1.12 }}>Influencer marketing shouldn't feel this hard.</h2>
        <p className="pp-sub" style={{ fontSize: "15.5px", color: "#6B7280", lineHeight: 1.7, margin: "18px 0 0" }}>Weeks of hunting. 30–40% agency commissions. Payments that never arrive. Here's what we set out to kill.</p>
      </div>
      <div className="pp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "44px" }}>
        {painsData.map((p, i) => {
          const fixed = painsFixed[i];
          const broken = !fixed;
          const cardBg = fixed
            ? "linear-gradient(120deg, #FAF7FE, #FEF5FA) padding-box, linear-gradient(135deg, rgba(52,211,153,0.65), rgba(16,185,129,0.55)) border-box"
            : "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.5), rgba(168,85,247,0.25) 45%, rgba(124,58,237,0.5)) border-box";
          const cardBorder = "transparent";
          const iconBg = fixed ? "linear-gradient(135deg, #10B981, #34D399)" : "linear-gradient(135deg, #F472B6, #EC4899)";
          const glowColor = fixed ? "rgba(16,185,129,0.45)" : "rgba(236,72,153,0.45)";
          const strike = fixed ? "line-through" : "none";
          const titleColor = fixed ? "#9CA3AF" : "#111827";
          const hint = fixed ? "TAP TO UNDO" : "TAP TO FIX IT";
          const hintColor = fixed ? "#C9CDD6" : "#A855F7";
          const hintDot = fixed ? "#C9CDD6" : "#A855F7";
          return (
            <div
              key={i}
              className="pp-card"
              onClick={() => toggle(i)}
              style={{ position: "relative", background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: "20px", padding: "26px 24px 60px", cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden", boxShadow: "0 5px 16px rgba(124,58,237,0.07)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ width: "40px", height: "40px", borderRadius: "14px", background: iconBg, color: glowColor, display: "grid", placeItems: "center", transition: "all 0.3s ease", animation: "glowPulse 2.2s ease-in-out infinite" }}>
                  {fixed && (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ animation: "riseIn 0.3s ease both" }}><path d="M5 12l5 5L20 7" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  )}
                  {broken && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4L3 19.5h18L12 4z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round"></path><path d="M12 10v4M12 16.8h.01" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"></path></svg>
                  )}
                </span>
                {fixed && (
                  <span style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.08em", color: "#FFFFFF", background: "linear-gradient(95deg, #10B981, #34D399)", borderRadius: "999px", padding: "4px 10px", animation: "riseIn 0.3s ease both" }}>FIXED</span>
                )}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.01em", marginTop: "16px", lineHeight: 1.3, textDecoration: strike, color: titleColor, transition: "all 0.3s ease" }}>{p.title}</div>
              {broken && (
                <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.65, margin: "8px 0 0" }}>{p.desc}</p>
              )}
              {fixed && (
                <p style={{ fontSize: "13px", color: "#4B5563", fontWeight: 600, lineHeight: 1.65, margin: "8px 0 0", animation: "riseIn 0.35s ease both" }}>{p.fix}</p>
              )}
              <span style={{ position: "absolute", left: "24px", right: "24px", bottom: "20px", display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", color: hintColor, transition: "color 0.3s ease" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: hintDot, animation: "pulse-dot 1.8s infinite" }}></span>{hint}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: "center", marginTop: "30px", fontSize: "14px", fontWeight: 800 }}>
        <span style={{ background: "linear-gradient(95deg, #7C3AED, #EC4899)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{painsStatus}</span>
        {allPainsFixed && (
          <button className="pp-reset" onClick={resetPains} style={{ marginLeft: "14px", border: "1.5px solid #E4D9FB", background: "transparent", cursor: "pointer", fontFamily: "'Manrope', sans-serif", fontSize: "11.5px", fontWeight: 800, color: "#7C3AED", borderRadius: "999px", padding: "6px 14px", animation: "riseIn 0.3s ease both" }}>↻ Break it again</button>
        )}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .pp-section { padding: 56px 20px 0 !important; }
          .pp-title { font-size: 28px !important; }
          .pp-sub { font-size: 14px !important; }
          .pp-grid { grid-template-columns: 1fr !important; gap: 14px !important; margin-top: 32px !important; }
          .pp-card { padding: 22px 20px 56px !important; }
        }
      `}</style>
    </section>
  );
}
