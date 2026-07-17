"use client";

const B = [
  "Nykaa",
  "boAt",
  "Mamaearth",
  "CRED",
  "Swiggy",
  "Lenskart",
  "Wakefit",
  "Plum",
  "mCaffeine",
  "Sugar Cosmetics",
];
const brands = [...B, ...B];

export default function Brands() {
  return (
    <section
      data-screen-label="Brands"
      style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 40px 0" }}
    >
      <style>{`
        .brand-word:hover { color: #7C3AED; }
      `}</style>
      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.16em",
          color: "#9CA3AF",
          marginBottom: "20px",
        }}
      >
        TRUSTED BY LEADING GLOBAL BRANDS
      </div>
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            gap: "68px",
            alignItems: "center",
            animation: "marquee 26s linear infinite",
          }}
        >
          {brands.map((b, i) => (
            <span
              key={i}
              className="brand-word"
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontWeight: 700,
                fontSize: "32px",
                color: "#AFB4C2",
                whiteSpace: "nowrap",
                transition: "color 0.25s ease",
              }}
            >
              {b}
            </span>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, #FFFFFF, transparent 12%, transparent 88%, #FFFFFF)",
            pointerEvents: "none",
          }}
        ></div>
      </div>
    </section>
  );
}
