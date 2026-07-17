"use client";

import Link from "next/link";

const appPoints = [
  "Real-time campaign notifications",
  "In-app creator messaging",
  "One-tap content approval",
  "Live analytics on the go",
  "Payment tracking & payouts",
  "Push alerts for new matches",
];

const demoBars = [
  { h: "34%", delay: "0.05s", bg: "#E4D9FB" },
  { h: "48%", delay: "0.12s", bg: "#E4D9FB" },
  { h: "42%", delay: "0.19s", bg: "#E4D9FB" },
  { h: "62%", delay: "0.26s", bg: "#D8B4FE" },
  { h: "55%", delay: "0.33s", bg: "#D8B4FE" },
  { h: "78%", delay: "0.4s", bg: "linear-gradient(180deg, #A855F7, #EC4899)" },
  { h: "100%", delay: "0.47s", bg: "linear-gradient(180deg, #8B5CF6, #EC4899)" },
];

export default function MobileApp() {
  return (
    <section data-screen-label="Mobile app" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
      <style>{`.ma-store:hover{background:#1E1B2E}`}</style>
      <div style={{ position: "relative", background: "linear-gradient(120deg, #F3EEFD, #FBEAF4)", borderRadius: "28px", padding: "56px 52px", display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "56px", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "220px", height: "220px", borderRadius: "50%", border: "24px solid rgba(168,85,247,0.1)", pointerEvents: "none" }}></div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.1em", color: "#7C3AED" }}>IN YOUR POCKET</div>
          <h3 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", margin: "14px 0 0", lineHeight: 1.15 }}>Run campaigns from the checkout line.</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 26px", marginTop: "24px" }}>
            {appPoints.map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", fontSize: "14.5px", color: "#4B5563", lineHeight: 1.55, fontWeight: 500 }}><span style={{ color: "#A855F7" }}>✦</span>{pt}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "30px", flexWrap: "wrap" }}>
            <Link href="/login" className="ma-store" style={{ display: "inline-flex", flexDirection: "column", background: "#111827", color: "#FFFFFF", borderRadius: "14px", padding: "9px 20px", lineHeight: 1.25 }}><span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Download on the</span><span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>App Store</span></Link>
            <Link href="/login" className="ma-store" style={{ display: "inline-flex", flexDirection: "column", background: "#111827", color: "#FFFFFF", borderRadius: "14px", padding: "9px 20px", lineHeight: 1.25 }}><span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Get it on</span><span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>Google Play</span></Link>
            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#9CA3AF", marginLeft: "6px" }}>4.8★ iOS · 4.7★ ANDROID</span>
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <div style={{ position: "relative", width: "250px", background: "#111827", borderRadius: "40px", padding: "10px", boxShadow: "0 30px 70px rgba(30,27,46,0.35)" }}>
            <div style={{ background: "linear-gradient(180deg, #F8F7FC, #FFFFFF)", borderRadius: "32px", padding: "18px 16px 22px", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "14px", background: "linear-gradient(95deg, #F472B6, #7C3AED)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>recentgossips</span>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: 800, color: "#FFFFFF" }}>P</span>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #F1F0F5", borderRadius: "16px", padding: "14px", marginTop: "14px", boxShadow: "0 8px 20px rgba(17,24,39,0.05)" }}>
                <div style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.1em", color: "#9CA3AF" }}>CAMPAIGN · SERUM LAUNCH</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}><span style={{ fontSize: "18px", fontWeight: 800 }}>2.4M reach</span><span style={{ fontSize: "10px", fontWeight: 800, color: "#10B981" }}>▲ 32%</span></div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "44px", marginTop: "10px" }}>
                  {demoBars.map((b, i) => (
                    <div key={i} style={{ flex: 1, height: b.h, background: b.bg, borderRadius: "3px", transformOrigin: "bottom" }}></div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <span style={{ flex: 1, textAlign: "center", fontSize: "10.5px", fontWeight: 800, color: "#FFFFFF", background: "linear-gradient(95deg, #8B5CF6, #EC4899)", borderRadius: "999px", padding: "8px 0" }}>Approve content</span>
                <span style={{ textAlign: "center", fontSize: "10.5px", fontWeight: 700, color: "#7C3AED", border: "1.5px solid #E4D9FB", borderRadius: "999px", padding: "8px 12px" }}>Chat</span>
              </div>
            </div>
            <div style={{ position: "absolute", top: "54px", left: "-34px", right: "-34px", background: "#FFFFFF", borderRadius: "14px", padding: "10px 14px", boxShadow: "0 16px 40px rgba(17,24,39,0.16)", display: "flex", alignItems: "center", gap: "10px", animation: "notifIn 5s ease-in-out infinite" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "10px", background: "linear-gradient(135deg, #8B5CF6, #EC4899)", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="#FFFFFF"></path></svg></span>
              <span><span style={{ display: "block", fontSize: "11px", fontWeight: 800 }}>New campaign match!</span><span style={{ display: "block", fontSize: "10px", color: "#9CA3AF", fontWeight: 600 }}>HydraGlow serum · 97% audience fit</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
