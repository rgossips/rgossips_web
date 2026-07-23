"use client";

import { useEffect, useRef, useState } from "react";

const chipsData = [
  { label: "Skincare launch in Mumbai", dot: "#F9A8D4" },
  { label: "Tech unboxing, 100K+", dot: "#C4B5FD" },
  { label: "Fitness creators, barter", dot: "#6EE7B7" },
];

const scanSteps = ["Parsing your brief…", "Scanning 200,412 verified profiles…", "Auditing for fake followers…", "Ranking by audience fit…"];
const heroStats = [
  { value: "200K+", label: "Verified creators" },
  { value: "₹10Cr+", label: "Paid to creators" },
  { value: "98%", label: "On-time payouts" },
];

const resultsData = [
  { handle: "@glowbyaisha", niche: "Beauty · Mumbai", followers: "86K", er: "6.2%", score: 97 },
  { handle: "@skinwithsana", niche: "Skincare · Delhi", followers: "42K", er: "7.8%", score: 94 },
  { handle: "@dermadiaries.in", niche: "Beauty · Bengaluru", followers: "128K", er: "4.9%", score: 91 },
];

const AVATAR_BG = ["linear-gradient(135deg, #8B5CF6, #A855F7)", "linear-gradient(135deg, #EC4899, #F472B6)", "linear-gradient(135deg, #7C3AED, #EC4899)"];

const liveCount = "200,412";
const resultsHeader = "TOP MATCHES — 200,412 PROFILES SCANNED IN 0.4s";

export default function AIPrompt() {
  const [phase, setPhase] = useState("idle");
  const [scanStep, setScanStep] = useState(0);
  const [shortlist, setShortlist] = useState({});
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const promptRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-grow the prompt textarea with its content (and shrink back on
  // delete). Keyed on `prompt` so chip clicks and clears resize too, not
  // just keystrokes.
  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [prompt]);

  const isScanning = phase === "matching";
  const showResults = phase === "done";
  const scanStepText = scanSteps[scanStep];
  const scanPct = Math.round(((scanStep + 1) / 4) * 100 - 8) + "%";
  const matchLabel = phase === "matching" ? "Matching" : "Find creators";
  const inputBorder = focused || isScanning ? "#F9A8D4" : "rgba(255,255,255,0.14)";

  function runMatch() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("matching");
    setScanStep(0);
    let step = 0;
    const advance = () => {
      step += 1;
      if (step < scanSteps.length) {
        setScanStep(step);
        timerRef.current = setTimeout(advance, 450);
      } else {
        setPhase("done");
      }
    };
    timerRef.current = setTimeout(advance, 450);
  }

  function onPromptKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runMatch();
    }
  }

  function toggleShortlist(handle) {
    setShortlist((prev) => ({ ...prev, [handle]: !prev[handle] }));
  }

  const shortlistCount = Object.values(shortlist).filter(Boolean).length;
  const hasShortlist = shortlistCount >= 1;
  const shortlistLabel = `${shortlistCount} creator${shortlistCount === 1 ? "" : "s"} shortlisted`;

  return (
    <section data-screen-label="AI Prompt" className="aip-section" style={{ maxWidth: "1080px", margin: "0 auto", padding: "8px 40px 48px" }}>
      <style>{`
        .aip-match-btn:hover { filter: brightness(1.15); }
        .aip-chip:hover { border-color: #F9A8D4; color: #F9A8D4; transform: translateY(-1px); }
        .aip-rerun:hover { color: #F9A8D4; border-color: #F9A8D4; }
        .aip-card:hover { transform: translateY(-3px); border-color: rgba(249,168,212,0.5); }

        @media (max-width: 767px) {
          .aip-section {
            padding: 8px 20px 40px !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
          .aip-panel {
            margin-top: 0px !important;
            border-radius: 24px !important;
            padding: 26px 18px 24px !important;
          }
          .aip-glow {
            width: 200px !important;
            height: 200px !important;
          }
          .aip-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .aip-promptbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 4px !important;
            border-radius: 20px !important;
            padding: 12px 14px 12px !important;
          }
          .aip-search-icon {
            display: none !important;
          }
          .aip-input {
            width: 100% !important;
            font-size: 15px !important;
            padding: 6px 0 !important;
            /* placeholder wraps to 2 lines at 390px — the JS auto-grow only
               tracks typed content, so the placeholder needs this floor */
            min-height: 54px !important;
          }
          .aip-match-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 44px !important;
            padding: 12px 20px !important;
          }
          .aip-chip {
            padding: 9px 14px !important;
            min-height: 38px !important;
          }
          .aip-scan {
            padding: 16px !important;
          }
          .aip-results-title {
            white-space: normal !important;
            word-break: break-word !important;
            flex-wrap: wrap !important;
            line-height: 1.5 !important;
          }
          .aip-results-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .aip-card {
            padding: 16px !important;
          }
          .aip-card:hover {
            transform: none;
          }
          .aip-handle {
            white-space: normal !important;
            word-break: break-word !important;
          }
          .aip-shortlist {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 16px !important;
            text-align: center !important;
          }
          .aip-invite {
            justify-content: center !important;
            min-height: 44px !important;
          }
        }
      `}</style>

      <div
        className="aip-panel"
        style={{
          position: "relative",
          background: "linear-gradient(120deg, #1E1B2E, #2D2350)",
          borderRadius: "32px",
          padding: "44px 44px 38px",
          color: "#FFFFFF",
          overflow: "hidden",
          marginTop: "-64px",
          boxShadow: "0 30px 80px rgba(45,35,80,0.45)",
          animation: "riseIn 0.7s ease 0.24s both",
        }}
      >
        <div
          className="aip-glow"
          style={{
            position: "absolute",
            top: "-90px",
            right: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.35), rgba(168,85,247,0))",
            pointerEvents: "none",
          }}
        ></div>
        <div
          className="aip-glow"
          style={{
            position: "absolute",
            bottom: "-110px",
            left: "-50px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.25), rgba(236,72,153,0))",
            pointerEvents: "none",
          }}
        ></div>
        <div
          className="aip-header"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="url(#sparkGrad)"></path>
              <path d="M19 15l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6-2.6-.9 2.6-.9L19 15z" fill="#F9A8D4"></path>
              <defs>
                <linearGradient id="sparkGrad" x1="4" y1="2" x2="20" y2="18">
                  <stop stopColor="#C4B5FD"></stop>
                  <stop offset="1" stopColor="#F472B6"></stop>
                </linearGradient>
              </defs>
            </svg>
            <span
              style={{
                background: "linear-gradient(95deg, #C4B5FD, #F9A8D4)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ASK THE MATCHING ENGINE
            </span>
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "12.5px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "999px",
              padding: "6px 14px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#34D399",
                animation: "pulse-dot 1.6s infinite",
              }}
            ></span>
            {liveCount} creators online
          </span>
        </div>
        <div
          className="aip-promptbar"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${inputBorder}`,
            borderRadius: "999px",
            padding: "8px 8px 8px 22px",
            transition: "border-color 0.3s ease",
          }}
        >
          <svg className="aip-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}>
            <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth="2"></circle>
            <path d="M20 20l-3.5-3.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"></path>
          </svg>
          <textarea
            className="aip-input"
            ref={promptRef}
            rows="1"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try: “Launch our serum with beauty creators in Mumbai…”"
            onKeyDown={onPromptKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              background: "transparent",
              fontFamily: "'Manrope', sans-serif",
              fontSize: "17px",
              lineHeight: 1.5,
              color: "#FFFFFF",
              padding: "12px 0",
            }}
          ></textarea>
          <button
            className="aip-match-btn"
            onClick={runMatch}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "linear-gradient(95deg, #8B5CF6, #EC4899)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "999px",
              padding: "14px 26px",
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(139,92,246,0.4)",
            }}
          >
            {matchLabel}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h16m0 0l-6-6m6 6l-6 6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>
        <div
          className="aip-chips"
          style={{
            position: "relative",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "16px",
          }}
        >
          {chipsData.map((chip, i) => (
            <button
              key={i}
              className="aip-chip"
              onClick={() => setPrompt(chip.label)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Manrope', sans-serif",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "999px",
                padding: "7px 15px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: chip.dot,
                }}
              ></span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* SCANNING STATE */}
        {isScanning && (
          <div
            className="aip-scan"
            style={{
              position: "relative",
              marginTop: "26px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "22px 24px",
              animation: "riseIn 0.3s ease both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ animation: "spinSlow 1.2s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="3"></circle>
                <path d="M21 12a9 9 0 00-9-9" stroke="#F472B6" strokeWidth="3" strokeLinecap="round"></path>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>{scanStepText}</div>
                <div
                  style={{
                    height: "5px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "3px",
                    marginTop: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: scanPct,
                      background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
                      borderRadius: "3px",
                      transition: "width 0.45s ease",
                    }}
                  ></div>
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#F9A8D4" }}>{scanPct}</span>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {showResults && (
          <div
            style={{
              position: "relative",
              marginTop: "26px",
              animation: "riseIn 0.4s ease both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                className="aip-results-title"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a9 9 0 109 9" stroke="#34D399" strokeWidth="2.4" strokeLinecap="round"></path>
                  <circle cx="12" cy="12" r="2.4" fill="#34D399"></circle>
                  <path d="M12 12l6-6" stroke="#34D399" strokeWidth="2.4" strokeLinecap="round"></path>
                </svg>
                {resultsHeader}
              </span>
              <button
                className="aip-rerun"
                onClick={runMatch}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "999px",
                  padding: "5px 13px",
                  cursor: "pointer",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11a8 8 0 10.9 4.9M20 5v6h-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                Re-run
              </button>
            </div>
            <div
              className="aip-results-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {resultsData.map((r, i) => {
                const picked = !!shortlist[r.handle];
                const initial = r.handle[1].toUpperCase();
                const bg = AVATAR_BG[i % 3];
                const border = picked ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.14)";
                const pickGlyph = picked ? "✓" : "+";
                const pickBg = picked ? "linear-gradient(95deg, #10B981, #34D399)" : "rgba(255,255,255,0.08)";
                const pickFg = picked ? "#FFFFFF" : "rgba(255,255,255,0.7)";
                return (
                  <div
                    key={r.handle}
                    className="aip-card"
                    onClick={() => toggleShortlist(r.handle)}
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: `1px solid ${border}`,
                      borderRadius: "18px",
                      padding: "18px",
                      animation: "riseIn 0.45s ease both",
                      animationDelay: `${i * 0.08}s`,
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: bg,
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 800,
                          fontSize: "16px",
                          color: "#FFFFFF",
                          boxShadow: "0 0 0 2px rgba(255,255,255,0.18)",
                        }}
                      >
                        {initial}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="aip-handle"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "14px",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.handle}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M12 2l2.4 2.4H18v3.6L20.4 12 18 14.4V18h-3.6L12 20.4 9.6 18H6v-3.6L3.6 12 6 9.6V6h3.6L12 2z" fill="#60A5FA"></path>
                            <path d="M9.2 12.2l2 2 3.8-4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "rgba(255,255,255,0.5)",
                            marginTop: "1px",
                          }}
                        >
                          {r.niche}
                        </div>
                      </div>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "14px",
                          fontWeight: 800,
                          flexShrink: 0,
                          background: pickBg,
                          color: pickFg,
                          border: "1px solid rgba(255,255,255,0.25)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {pickGlyph}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        marginTop: "14px",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" stroke="#C4B5FD" strokeWidth="2"></circle>
                          <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round"></path>
                        </svg>
                        {r.followers}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 21C7 16.5 3 13.2 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.4 5 5.3 0 3.9-4 7.2-9 11.7z"
                            stroke="#F9A8D4"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                        {r.er} ER
                      </span>
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "11px",
                          fontWeight: 800,
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>AUDIENCE FIT</span>
                        <span
                          style={{
                            background: "linear-gradient(95deg, #C4B5FD, #F9A8D4)",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            color: "transparent",
                          }}
                        >
                          {r.score}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "5px",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${r.score}%`,
                            background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
                            borderRadius: "3px",
                            transition: "width 0.8s ease",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hasShortlist && (
              <div
                className="aip-shortlist"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "14px",
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: "16px",
                  padding: "13px 20px",
                  animation: "riseIn 0.3s ease both",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#A7F3D0",
                  }}
                >
                  {shortlistLabel}
                </span>
                <a
                  href="/login"
                  className="aip-invite"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    background: "linear-gradient(95deg, #10B981, #34D399)",
                    borderRadius: "999px",
                    padding: "9px 20px",
                  }}
                >
                  Invite to campaign
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h16m0 0l-6-6m6 6l-6 6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
