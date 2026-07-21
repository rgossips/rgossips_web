"use client";

const rows = [
  { label: "Setup time", agency: "2–4 weeks", others: "1–2 weeks", rg: "10 minutes" },
  { label: "Commission & fees", agency: "30–40%", others: "15–25%", rg: "5% flat" },
  { label: "AI matching", agency: "—", others: "Basic", rg: "Advanced" },
  { label: "Payment protection", agency: "—", others: "Limited", rg: "Full escrow" },
  { label: "Analytics", agency: "Monthly PDFs", others: "Delayed", rg: "Live" },
  { label: "Creator verification", agency: "Manual", others: "Basic", rg: "AI + human" },
  { label: "Support", agency: "Email only", others: "Email", rg: "24/7 chat" },
  { label: "Multi-platform", agency: "Limited", others: "Yes", rg: "Yes" },
];

const comparisons = rows.map((c, i) => ({ ...c, border: i === rows.length - 1 ? "transparent" : "#F1F0F5" }));

export default function Comparison() {
  return (
    <section data-screen-label="Comparison" className="cmp-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
      <style>{`.cmp-row:hover{background:#FAF7FE}`}</style>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="cmp-title" style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Agencies had a good run.</h2>
        <span style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>WHY RGOSSIPS · SIDE BY SIDE</span>
      </div>
      <div className="cmp-card" style={{ marginTop: "40px", background: "linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.5), rgba(168,85,247,0.25) 45%, rgba(124,58,237,0.5)) border-box", border: "1.5px solid transparent", borderRadius: "24px", overflow: "hidden", boxShadow: "0 10px 30px rgba(124,58,237,0.09)" }}>
        <div className="cmp-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.15fr", padding: "18px 30px", borderBottom: "1px solid #F1F0F5", alignItems: "center" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>FEATURE</span>
          <span style={{ fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF", textAlign: "center" }}>TRADITIONAL AGENCY</span>
          <span style={{ fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF", textAlign: "center" }}>OTHER PLATFORMS</span>
          <span style={{ textAlign: "center" }}><span style={{ display: "inline-block", fontSize: "11.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#FFFFFF", background: "linear-gradient(95deg, #8B5CF6, #EC4899)", borderRadius: "999px", padding: "6px 16px" }}>RGOSSIPS</span></span>
        </div>
        {comparisons.map((c, i) => (
          <div key={i} className="cmp-row cmp-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.15fr", padding: "15px 30px", borderBottom: `1px solid ${c.border}`, alignItems: "center", transition: "background 0.2s ease" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#111827" }}>{c.label}</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#9CA3AF", textAlign: "center" }}>{c.agency}</span>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#6B7280", textAlign: "center" }}>{c.others}</span>
            <span style={{ textAlign: "center" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", fontWeight: 800, background: "linear-gradient(95deg, #7C3AED, #EC4899)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>✓ {c.rg}</span></span>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .cmp-section { padding: 64px 20px 0 !important; }
          .cmp-title { font-size: 28px !important; }
          .cmp-card { overflow-x: auto !important; overflow-y: hidden !important; -webkit-overflow-scrolling: touch; }
          .cmp-grid { min-width: 640px !important; padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </section>
  );
}
