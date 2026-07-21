"use client";

const bgs = [
  "linear-gradient(135deg, #8B5CF6, #A855F7)",
  "linear-gradient(135deg, #EC4899, #F472B6)",
  "linear-gradient(135deg, #7C3AED, #EC4899)",
  "linear-gradient(135deg, #6366F1, #8B5CF6)",
];

const T = [
  { quote: "Found 50+ perfect creators for our skincare launch in 2 days. 3× the ROI of our agency route.", name: "Priya Sharma", role: "Marketing Head, GlowBeauty" },
  { quote: "Paid within 48 hours of approval. Finally a platform that treats creators like professionals.", name: "Rahul Mehra", role: "Tech creator · 250K followers" },
  { quote: "Three campaigns last month. All three beat our engagement targets.", name: "Sneha Patel", role: "Founder, EcoStyle" },
  { quote: "Tried 4 platforms before this one. The only one that works exactly as promised.", name: "Arjun Singh", role: "Lifestyle creator · 180K followers" },
].map((x, i) => ({ ...x, initial: x.name[0], bg: bgs[i % bgs.length] }));

const testimonials = [...T, ...T];

export default function Testimonials() {
  return (
    <section data-screen-label="Testimonials" className="tst-section" style={{ padding: "88px 0 0", overflow: "hidden" }}>
      <style>{`.tm-track:hover{animation-play-state:paused}.tm-card:hover{box-shadow:0 16px 40px rgba(124,58,237,0.14);transform:translateY(-3px)}`}</style>
      <div className="tst-head" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 40px", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="tst-title" style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Loved on both sides of the deal.</h2>
        <span style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>WALL OF LOVE · HOVER TO PAUSE</span>
      </div>
      <div style={{ overflow: "hidden", position: "relative", marginTop: "44px" }}>
        <div className="tm-track tst-track" style={{ display: "flex", width: "max-content", gap: "20px", padding: "6px 0", animation: "marquee 42s linear infinite" }}>
          {testimonials.map((t, i) => (
            <div key={i} className="tm-card tst-card" style={{ width: "380px", background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.5), rgba(168,85,247,0.25) 45%, rgba(124,58,237,0.5)) border-box", border: "1.5px solid transparent", borderRadius: "22px", padding: "28px", boxShadow: "0 5px 16px rgba(124,58,237,0.07)", transition: "all 0.25s ease" }}>
              <div style={{ fontSize: "13px", letterSpacing: "0.18em", color: "#A855F7", fontWeight: 800 }}>★★★★★</div>
              <p style={{ fontSize: "15px", color: "#111827", lineHeight: 1.7, fontWeight: 600, margin: "14px 0 0" }}>“{t.quote}”</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
                <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: t.bg, display: "grid", placeItems: "center", fontSize: "14px", fontWeight: 800, color: "#FFFFFF" }}>{t.initial}</span>
                <span>
                  <span style={{ display: "block", fontSize: "14px", fontWeight: 800 }}>{t.name}</span>
                  <span style={{ display: "block", fontSize: "12px", color: "#9CA3AF", fontWeight: 600 }}>{t.role}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #FFFFFF, transparent 6%, transparent 94%, #FFFFFF)", pointerEvents: "none" }}></div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .tst-section { padding: 56px 0 0 !important; }
          .tst-head { padding: 0 20px !important; }
          .tst-title { font-size: 28px !important; }
          .tst-track { gap: 16px !important; }
          .tst-card { width: min(320px, 82vw) !important; padding: 22px !important; }
        }
      `}</style>
    </section>
  );
}
