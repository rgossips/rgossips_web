"use client";

import { useEffect, useRef, useState } from "react";

const statsData = [
  { n: 500, label: "Active brands", fmt: (v) => Math.round(v) + "+" },
  { n: 20, label: "States covered", fmt: (v) => Math.round(v) + "+" },
  { n: 10, label: "Minutes to launch", fmt: (v) => Math.round(v) + " min" },
  { n: 4.8, label: "Platform rating", fmt: (v) => v.toFixed(1) + "★" },
  { n: 2.4, label: "ROI vs agency route", fmt: (v) => v.toFixed(1) + "×" },
  { n: 5, label: "Flat escrow fee", fmt: (v) => Math.round(v) + "%" },
];

export default function Stats() {
  const statsRef = useRef(null);
  const [statProg, setStatProg] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const duration = 1200;
            const start = performance.now();
            const tick = (now) => {
              const p = Math.min((now - start) / duration, 1);
              setStatProg(p);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = statsData.map((s) => ({ ...s, display: s.fmt(s.n * statProg) }));

  return (
    <section data-screen-label="Stats" className="sts-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 40px 0" }}>
      <div ref={statsRef} className="sts-card" style={{ position: "relative", background: "linear-gradient(120deg, #1E1B2E, #2D2350)", borderRadius: "28px", padding: "46px 40px", color: "#FFFFFF", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-90px", right: "-50px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.3), rgba(168,85,247,0))", pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "-100px", left: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.22), rgba(236,72,153,0))", pointerEvents: "none" }}></div>
        <div className="sts-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "20px", textAlign: "center" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div className="sts-num" style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(95deg, #C4B5FD, #F9A8D4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{s.display}</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginTop: "5px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .sts-section { padding: 24px 20px 0 !important; }
          .sts-card { padding: 32px 20px !important; }
          .sts-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 26px 14px !important; }
          .sts-num { font-size: 28px !important; }
        }
      `}</style>
    </section>
  );
}
