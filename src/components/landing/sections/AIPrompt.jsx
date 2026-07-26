"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import CampaignPickerModal from "@/components/brands/CampaignPickerModal";

const chipsData = [
  { label: "Skincare launch in Mumbai", dot: "#F9A8D4" },
  { label: "Tech unboxing creators, 100K+", dot: "#C4B5FD" },
  { label: "Fitness creators for a barter deal", dot: "#6EE7B7" },
];

// Honest, generic progress copy — the real work (LLM parse + creator scan)
// happens behind this while the request is in flight.
const scanSteps = ["Reading your brief…", "Scanning verified creators…", "Matching niche & audience…", "Ranking best fits…"];
const heroStats = [
  { value: "200K+", label: "Verified creators" },
  { value: "₹10Cr+", label: "Paid to creators" },
  { value: "98%", label: "On-time payouts" },
];

const AVATAR_BG = ["linear-gradient(135deg, #8B5CF6, #A855F7)", "linear-gradient(135deg, #EC4899, #F472B6)", "linear-gradient(135deg, #7C3AED, #EC4899)"];

const liveCount = "200,412";

// Free runs a visitor gets in one browser session before we nudge to sign up.
// Mirrors SESSION_MAX in the landing-match edge function (server is the real gate).
const SESSION_LIMIT = 5;

function fmtFollowers(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return Math.round(num / 1_000) + "K";
  return String(num);
}

function getSessionId() {
  try {
    let id = window.sessionStorage.getItem("rg_landing_session");
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).replace(
        /[^a-zA-Z0-9_-]/g,
        "",
      );
      window.sessionStorage.setItem("rg_landing_session", id);
    }
    return id;
  } catch {
    return "";
  }
}

export default function AIPrompt() {
  const [phase, setPhase] = useState("idle"); // idle | matching | done
  const [scanStep, setScanStep] = useState(0);
  const [shortlist, setShortlist] = useState({});
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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

  useEffect(() => () => timerRef.current && clearInterval(timerRef.current), []);

  const isScanning = phase === "matching";
  const showResults = phase === "done";
  const scanStepText = scanSteps[scanStep];
  const scanPct = Math.round(((scanStep + 1) / scanSteps.length) * 100 - 8) + "%";
  const matchLabel = isScanning ? "Matching" : "Find creators";
  const inputBorder = focused || isScanning ? "#F9A8D4" : "rgba(255,255,255,0.14)";

  async function runMatch() {
    const text = prompt.trim();
    if (!text) {
      promptRef.current?.focus();
      return;
    }
    if (exhausted || isScanning) return;
    setErrorMsg("");
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("matching");
    setScanStep(0);
    let step = 0;
    timerRef.current = setInterval(() => {
      step = (step + 1) % scanSteps.length;
      setScanStep(step);
    }, 550);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("landing-match", {
        body: { prompt: text, sessionId: getSessionId() },
      });
      if (error) throw error;

      if (data?.error === "rate_limited") {
        setExhausted(true);
        setRemaining(0);
        setPhase(results.length ? "done" : "idle");
        return;
      }
      if (data?.error) {
        setErrorMsg(data.error === "empty_prompt" ? "Add a few words about who you're looking for." : "Couldn't run the match right now. Please try again.");
        setPhase(results.length ? "done" : "idle");
        return;
      }

      const rows = Array.isArray(data?.influencers) ? data.influencers : [];
      setResults(rows);
      setTotal(Math.max(Number(data?.total || 0), rows.length));
      setSummary(data?.summary || "");
      setShortlist({});
      if (typeof data?.remaining === "number") {
        setRemaining(data.remaining);
        if (data.remaining <= 0) setExhausted(true);
      }
      setPhase("done");
    } catch {
      setErrorMsg("Couldn't reach the matching engine. Please try again.");
      setPhase(results.length ? "done" : "idle");
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function onPromptKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runMatch();
    }
  }

  function toggleShortlist(id) {
    setShortlist((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Detect a logged-in BRAND so the shortlist "Invite to campaign" bar can send
  // real invites (guests still route to /login). A user with a brand_profiles
  // row is a brand; influencers don't invite.
  const [brandUser, setBrandUser] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteToast, setInviteToast] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: bp } = await supabase.from("brand_profiles").select("brand_id").eq("brand_id", user.id).maybeSingle();
        if (!cancelled && bp) setBrandUser({ id: user.id });
      } catch {
        /* guest — keep the /login CTA */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shortlistCount = Object.values(shortlist).filter(Boolean).length;
  const hasShortlist = shortlistCount >= 1;
  const shortlistLabel = `${shortlistCount} creator${shortlistCount === 1 ? "" : "s"} shortlisted`;
  // Real creators only (drop pre-launch inv_* stubs, which can't be invited).
  const invitableIds = Object.keys(shortlist).filter((id) => shortlist[id] && !String(id).startsWith("inv_"));
  const resultsHeader =
    total > results.length
      ? `TOP ${results.length} OF ${total.toLocaleString()} MATCHES`
      : `${results.length} MATCH${results.length === 1 ? "" : "ES"}`;
  const showRemainingNote = !exhausted && typeof remaining === "number" && remaining <= 3 && remaining > 0;
  const remainingUrgent = showRemainingNote && remaining <= 2;

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
            disabled={isScanning || exhausted}
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
              cursor: isScanning || exhausted ? "not-allowed" : "pointer",
              opacity: isScanning || exhausted ? 0.6 : 1,
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

        {/* Error / session-limit notices */}
        {errorMsg && (
          <div style={{ position: "relative", marginTop: "14px", fontSize: "13px", fontWeight: 600, color: "#FCA5A5" }}>{errorMsg}</div>
        )}
        {exhausted && (
          <div
            style={{
              position: "relative",
              marginTop: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              background: "rgba(249,168,212,0.08)",
              border: "1px solid rgba(249,168,212,0.3)",
              borderRadius: "16px",
              padding: "13px 18px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#F9A8D4" }}>
              You&rsquo;ve used your free searches for this session.
            </span>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "13px",
                fontWeight: 800,
                color: "#FFFFFF",
                background: "linear-gradient(95deg, #8B5CF6, #EC4899)",
                borderRadius: "999px",
                padding: "9px 20px",
              }}
            >
              Sign up to keep matching
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h16m0 0l-6-6m6 6l-6 6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </a>
          </div>
        )}
        {showRemainingNote &&
          (remainingUrgent ? (
            <div
              style={{
                position: "relative",
                marginTop: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                fontSize: "13px",
                fontWeight: 800,
                color: "#FDE68A",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.4)",
                borderRadius: "999px",
                padding: "8px 16px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" fill="#FBBF24" />
              </svg>
              Only {remaining} free {remaining === 1 ? "search" : "searches"} left this session
            </div>
          ) : (
            <div style={{ position: "relative", marginTop: "12px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
              {remaining} free searches left this session
            </div>
          ))}

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
        {showResults && results.length > 0 && (
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
                disabled={isScanning || exhausted}
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
                  cursor: isScanning || exhausted ? "not-allowed" : "pointer",
                  opacity: isScanning || exhausted ? 0.5 : 1,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11a8 8 0 10.9 4.9M20 5v6h-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                Re-run
              </button>
            </div>
            {summary && (
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: "rgba(255,255,255,0.72)", marginBottom: "14px" }}>{summary}</div>
            )}
            <div
              className="aip-results-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {results.map((r, i) => {
                const picked = !!shortlist[r.id];
                const displayName = r.name || r.handle || "Creator";
                const initial = (displayName.replace(/^@/, "")[0] || "?").toUpperCase();
                const bg = AVATAR_BG[i % 3];
                const border = picked ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.14)";
                const pickGlyph = picked ? "✓" : "+";
                const pickBg = picked ? "linear-gradient(95deg, #10B981, #34D399)" : "rgba(255,255,255,0.08)";
                const pickFg = picked ? "#FFFFFF" : "rgba(255,255,255,0.7)";
                const subtitle = [r.category, r.city].filter(Boolean).join(" · ");
                const atHandle = r.handle ? (r.handle.startsWith("@") ? r.handle : "@" + r.handle) : "";
                return (
                  <div
                    key={r.id}
                    className="aip-card"
                    onClick={() => toggleShortlist(r.id)}
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
                          overflow: "hidden",
                          flexShrink: 0,
                          boxShadow: "0 0 0 2px rgba(255,255,255,0.18)",
                        }}
                      >
                        {r.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.photo}
                            alt={displayName}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          initial
                        )}
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
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {displayName}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "rgba(255,255,255,0.5)",
                            marginTop: "1px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {atHandle || subtitle || "Creator"}
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
                        flexWrap: "wrap",
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
                        {fmtFollowers(r.followers)} followers
                      </span>
                      {r.city && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21c4-4 7-7.2 7-11a7 7 0 10-14 0c0 3.8 3 7 7 11z" stroke="#F9A8D4" strokeWidth="2" strokeLinejoin="round"></path>
                            <circle cx="12" cy="10" r="2.4" stroke="#F9A8D4" strokeWidth="2"></circle>
                          </svg>
                          {r.city}
                        </span>
                      )}
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
                          {r.fit}%
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
                            width: `${r.fit}%`,
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
                  {brandUser && invitableIds.length < shortlistCount && (
                    <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}> · {invitableIds.length} invitable</span>
                  )}
                </span>
                {brandUser ? (
                  <button
                    onClick={() => setPickerOpen(true)}
                    disabled={invitableIds.length === 0}
                    className="aip-invite"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      background: "linear-gradient(95deg, #10B981, #34D399)",
                      border: "none",
                      borderRadius: "999px",
                      padding: "9px 20px",
                      cursor: invitableIds.length === 0 ? "not-allowed" : "pointer",
                      opacity: invitableIds.length === 0 ? 0.6 : 1,
                    }}
                  >
                    Invite to campaign
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12h16m0 0l-6-6m6 6l-6 6" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                ) : (
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
                )}
              </div>
            )}
          </div>
        )}

        {inviteToast && (
          <div
            style={{
              position: "relative",
              marginTop: "14px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#A7F3D0",
              textAlign: "center",
            }}
          >
            {inviteToast}
          </div>
        )}

        {brandUser && (
          <CampaignPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            brandId={brandUser.id}
            influencerIds={invitableIds}
            onDone={(result) => {
              const invited = result?.invited || 0;
              setInviteToast(`Invited ${invited} creator${invited === 1 ? "" : "s"} to your campaign.`);
              setShortlist({});
              setTimeout(() => setInviteToast(""), 4000);
            }}
          />
        )}
      </div>
    </section>
  );
}
