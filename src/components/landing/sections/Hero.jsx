"use client";

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
          background: "radial-gradient(circle, rgba(168,85,247,0.14), rgba(168,85,247,0))",
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
          background: "radial-gradient(circle, rgba(244,114,182,0.12), rgba(244,114,182,0))",
          pointerEvents: "none",
        }}
      ></div>
      <div
        className="hero-container"
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
            className="hero-badge"
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
            className="hero-headline"
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
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .hero-container {
            padding: 44px 20px 40px !important;
          }
          .hero-badge {
            font-size: 11.5px !important;
            padding: 7px 14px !important;
            max-width: 100% !important;
            text-align: left !important;
          }
          .hero-headline {
            font-size: 33px !important;
            line-height: 1.15 !important;
            margin-top: 20px !important;
            max-width: 100% !important;
          }
          .hero-subtitle {
            font-size: 14.5px !important;
            line-height: 1.65 !important;
            margin-top: 16px !important;
            max-width: 100% !important;
          }
        
          
        }
      `}</style>
    </section>
  );
}
