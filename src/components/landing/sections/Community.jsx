"use client";

const community = [
  { title: "Trending insights", desc: "Real-time trend and viral-content analysis, before it peaks.", bg: "#F3EEFD", fg: "#8B5CF6", icon: "M4 20v-6M9.3 20V4M14.7 20v-9M20 20V8" },
  { title: "Creator collabs", desc: "Team up with other creators and multiply your reach.", bg: "#FBEAF4", fg: "#EC4899", icon: "M17 8a3 3 0 11-6 0 3 3 0 016 0zM7 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" },
  { title: "Creator Academy", desc: "Free courses and webinars to level up your content game.", bg: "#EEF2FE", fg: "#6366F1", icon: "M12 3L2 8l10 5 10-5-10-5zM6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" },
  { title: "Community forum", desc: "Thousands of creators swapping tips, rates, and wins.", bg: "#ECFDF5", fg: "#10B981", icon: "M21 12a8 8 0 01-8 8H4l1.8-2.7A8 8 0 1121 12z" },
];

export default function Community() {
  return (
    <section data-screen-label="Community" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
      <style>{`.cm-card:hover{transform:translateY(-4px)}`}</style>
      <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em", color: "#A855F7" }}>THE MOVEMENT</div>
        <h2 style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: "14px 0 0", lineHeight: 1.12 }}>More than a platform.</h2>
        <p style={{ fontSize: "15.5px", color: "#6B7280", lineHeight: 1.7, margin: "18px 0 0" }}>Join India's fastest-growing creator community — the deals are just the start.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "44px" }}>
        {community.map((c, i) => (
          <div key={i} className="cm-card" style={{ background: c.bg, borderRadius: "22px", padding: "28px 24px", transition: "all 0.25s ease" }}>
            <span style={{ width: "42px", height: "42px", borderRadius: "14px", background: "#FFFFFF", display: "grid", placeItems: "center", boxShadow: "0 6px 16px rgba(17,24,39,0.06)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={c.icon} stroke={c.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </span>
            <div style={{ fontSize: "16.5px", fontWeight: 800, letterSpacing: "-0.01em", marginTop: "16px" }}>{c.title}</div>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.65, margin: "8px 0 0" }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
