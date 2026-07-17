"use client";

const heroStats = [
  { value: "200K+", label: "Verified creators" },
  { value: "₹10Cr+", label: "Paid to creators" },
  { value: "98%", label: "On-time payouts" },
];

export default function Hero() {
  return (
    <section
      data-screen-label="Hero"
      style={{
        position: "relative",
        background: "linear-gradient(180deg, #F8F7FC, #FFFFFF)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-100px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.14), rgba(168,85,247,0))",
          pointerEvents: "none",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,114,182,0.12), rgba(244,114,182,0))",
          pointerEvents: "none",
        }}
      ></div>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "64px 40px 96px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#7C3AED",
              background: "#F3EEFD",
              border: "1px solid #E4D9FB",
              borderRadius: "999px",
              padding: "8px 18px",
              animation: "riseIn 0.6s ease both",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#A855F7",
                animation: "pulse-dot 1.8s infinite",
              }}
            ></span>
            Now live: AI-powered Influencer Matching
          </div>
          <h1
            style={{
              fontSize: "64px",
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              fontWeight: 800,
              margin: "26px 0 0",
              maxWidth: "880px",
              animation: "riseIn 0.6s ease 0.08s both",
            }}
          >
            Where Global Brands Meet{" "}
            <span
              style={{
                background: "linear-gradient(95deg, #7C3AED, #A855F7 60%, #EC4899)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              The Right Creators.
            </span>
          </h1>
          <p
            style={{
              fontSize: "17.5px",
              color: "#6B7280",
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "20px auto 0",
              animation: "riseIn 0.6s ease 0.16s both",
            }}
          >
            Describe your campaign in a sentence — our AI matches you with
            verified creators who actually fit. Escrow-protected payments, no
            agencies, no guesswork.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "36px",
              marginTop: "36px",
              animation: "riseIn 0.6s ease 0.32s both",
            }}
          >
            {heroStats.map((st, i) => (
              <div key={i}>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    background: "linear-gradient(95deg, #7C3AED, #EC4899)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {st.value}
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#9CA3AF",
                    marginTop: "2px",
                  }}
                >
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
