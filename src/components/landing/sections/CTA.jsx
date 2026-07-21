"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section data-screen-label="CTA" className="cta-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 96px" }}>
      <div className="cta-wrap" style={{ position: "relative", background: "linear-gradient(115deg, #7C3AED, #A855F7 55%, #EC4899)", borderRadius: "28px", padding: "38px 48px", color: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "28px", flexWrap: "wrap" }}>
        <div style={{ position: "absolute", top: "-50px", left: "40%", width: "110px", height: "110px", borderRadius: "50%", border: "16px solid rgba(255,255,255,0.12)", animation: "floatA 7s ease-in-out infinite", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "-34px", right: "26%", width: "64px", height: "64px", background: "rgba(255,255,255,0.1)", borderRadius: "18px", transform: "rotate(18deg)", animation: "floatB 6s ease-in-out infinite", pointerEvents: "none" }}></div>
        <div style={{ position: "relative" }}>
          <h2 className="cta-title" style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.15 }}>Ready to transform your influencer marketing?</h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", margin: "8px 0 0" }}>14-day free trial · No credit card · Cancel anytime</p>
        </div>
        <div className="cta-actions" style={{ position: "relative", display: "flex", gap: "12px", flexShrink: 0, flexWrap: "wrap" }}>
          <Link href="/login" className="cta-btn" style={{ background: "#FFFFFF", color: "#7C3AED", fontWeight: 800, padding: "14px 28px", borderRadius: "999px", fontSize: "14.5px", whiteSpace: "nowrap" }}>Get started free</Link>
          <a href="mailto:grievance@rgossips.com?subject=Schedule%20a%20Demo" className="cta-btn" style={{ border: "1.5px solid rgba(255,255,255,0.5)", color: "#FFFFFF", padding: "14px 28px", borderRadius: "999px", fontSize: "14.5px", fontWeight: 700, whiteSpace: "nowrap" }}>Schedule a demo</a>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .cta-section { padding: 64px 20px 72px !important; }
          .cta-wrap { padding: 32px 22px !important; flex-direction: column !important; align-items: stretch !important; gap: 22px !important; }
          .cta-title { font-size: 26px !important; }
          .cta-actions { flex-direction: column !important; width: 100% !important; }
          .cta-btn { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
        }
      `}</style>
    </section>
  );
}
