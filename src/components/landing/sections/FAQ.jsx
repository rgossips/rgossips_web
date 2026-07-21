"use client";

import { useState } from "react";

const faqs = [
  { q: "How does RGossips work?", a: "Describe your campaign, our AI matches you with verified creators, and you chat, negotiate, and e-sign in one thread. Escrow releases payment when you approve the content. Ten minutes, start to live." },
  { q: "What types of creators are on the platform?", a: "200,000+ verified creators across beauty, tech, fitness, food, travel and more — from nano (1K followers) to mega (1M+). Every profile is fraud-checked before it can be matched." },
  { q: "How much does it cost?", a: "Brands join free and pay only a 5% escrow fee on payouts — no commissions, no hidden fees. Creators pay from ₹99/mo, with a 14-day free trial on Pro." },
  { q: "How do you verify creator authenticity?", a: "Every profile passes an AI fake-follower and engagement audit, plus a manual review, before earning the verified badge. Paid tiers get monthly re-audits." },
  { q: "Can I track campaign performance?", a: "Yes — live dashboards for views, engagement, clicks, and conversions across every platform, updating in real time. No vanity metrics, no week-old PDFs." },
  { q: "Which platforms do you support?", a: "Instagram, YouTube, Twitter/X, and more — with one unified inbox, platform-specific briefs, and cross-platform analytics in a single view." },
  { q: "How are payments handled?", a: "Funds go into escrow when a campaign starts and release automatically when you approve the content. Creators are paid in as fast as 48 hours — in 50+ countries." },
  { q: "Is a contract required?", a: "Yes — and we handle it. A digital contract with e-signatures is generated for every collaboration, so both sides are protected from day one." },
];

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState(-1);

  return (
    <section id="faq" data-screen-label="FAQ" className="faq-section" style={{ maxWidth: "920px", margin: "0 auto", padding: "88px 40px 0", scrollMarginTop: "80px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em", color: "#A855F7" }}>FAQ</div>
        <h2 className="faq-title" style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: "14px 0 0" }}>Questions, answered.</h2>
      </div>
      <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {faqs.map((q, i) => {
          const open = openFaq === i;
          const maxH = open ? "220px" : "0px";
          const border = "transparent";
          const bg = open
            ? "linear-gradient(95deg, #FAF7FE, #FEF5FA) padding-box, linear-gradient(135deg, #F472B6, #A855F7 50%, #7C3AED) border-box"
            : "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.45), rgba(168,85,247,0.22) 45%, rgba(124,58,237,0.45)) border-box";
          const rot = open ? "rotate(180deg)" : "rotate(0deg)";
          const chevBg = open ? "linear-gradient(135deg, #8B5CF6, #EC4899)" : "#F3EEFD";
          const chevFg = open ? "#FFFFFF" : "#7C3AED";
          return (
            <div key={i} style={{ border: `1.5px solid ${border}`, borderRadius: "18px", background: bg, overflow: "hidden", boxShadow: "0 4px 14px rgba(124,58,237,0.06)", transition: "all 0.25s ease" }}>
              <button onClick={() => setOpenFaq(open ? -1 : i)} className="faq-btn" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "19px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Manrope', sans-serif" }}>
                <span className="faq-q" style={{ fontSize: "15.5px", fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>{q.q}</span>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: chevBg, display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.3s ease", transform: rot }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={chevFg} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
              </button>
              <div style={{ maxHeight: maxH, overflow: "hidden", transition: "max-height 0.35s ease" }}>
                <p className="faq-ans" style={{ padding: "0 56px 20px 24px", margin: 0, fontSize: "14px", color: "#6B7280", lineHeight: 1.75 }}>{q.a}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="faq-contact" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "22px", marginTop: "30px", flexWrap: "wrap", fontSize: "13.5px", fontWeight: 700 }}>
        <span style={{ color: "#6B7280", fontWeight: 600 }}>Still stuck? We reply within hours —</span>
        <a href="mailto:grievance@rgossips.com" style={{ color: "#7C3AED" }}>Email</a>
        <a href="https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146" style={{ color: "#7C3AED" }}>WhatsApp</a>
        <a href="https://www.instagram.com/rgossips.agency/" style={{ color: "#7C3AED" }}>@rgossips.agency</a>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .faq-section { padding: 64px 20px 0 !important; }
          .faq-title { font-size: 28px !important; }
          .faq-btn { padding: 18px 16px !important; gap: 12px !important; }
          .faq-q { font-size: 15px !important; }
          .faq-ans { padding: 0 16px 18px !important; font-size: 13.5px !important; }
          .faq-contact { gap: 10px 16px !important; text-align: center !important; }
        }
      `}</style>
    </section>
  );
}
