"use client";

import { useState } from "react";

const reelsData = [
  { handle: "@sahilanand", views: "4.2M views", bg: "linear-gradient(160deg, #8B5CF6, #4C1D95)" },
  { handle: "@nonaberrry", views: "2.8M views", bg: "linear-gradient(160deg, #EC4899, #831843)" },
  { handle: "@aditirajput", views: "3.1M views", bg: "linear-gradient(160deg, #A855F7, #6D28D9)" },
  { handle: "@alifestyle", views: "1.9M views", bg: "linear-gradient(160deg, #6366F1, #312E81)" },
  { handle: "@theyayawar", views: "5.6M views", bg: "linear-gradient(160deg, #F472B6, #9D174D)" },
  { handle: "@karishma.t", views: "2.2M views", bg: "linear-gradient(160deg, #7C3AED, #EC4899)" },
  { handle: "@vees_corner", views: "1.4M views", bg: "linear-gradient(160deg, #2D2350, #8B5CF6)" },
  { handle: "@nawab_adnan", views: "3.8M views", bg: "linear-gradient(160deg, #DB2777, #7C3AED)" },
];

export default function CreatorStories() {
  const [playingReel, setPlayingReel] = useState(-1);

  const reelOpen = playingReel >= 0;
  const closeReel = () => setPlayingReel(-1);
  const eatClick = (e) => e.stopPropagation();

  const ar = reelOpen ? reelsData[playingReel] : null;
  const arBg = ar ? ar.bg : "";
  const arHandle = ar ? ar.handle : "";
  const arViews = ar ? ar.views : "";
  const arInitial = ar ? ar.handle[1].toUpperCase() : "";

  return (
    <section data-screen-label="Creator stories" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0" }}>
      <style>{`.cs-reel:hover{transform:translateY(-5px)}.cs-close:hover{background:rgba(255,255,255,0.35)}`}</style>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>Reels people couldn't scroll past.</h2>
        <span style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>TOP CREATOR STORIES · TAP TO EXPAND</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "14px", marginTop: "40px" }}>
        {reelsData.map((r, i) => {
          const initial = r.handle[1].toUpperCase();
          const progDelay = (i * 0.7) + "s";
          const playing = playingReel === i;
          const shadow = playing ? "0 18px 40px rgba(124,58,237,0.35)" : "0 8px 24px rgba(17,24,39,0.1)";
          return (
            <div
              key={i}
              className="cs-reel"
              onClick={() => setPlayingReel(i)}
              style={{ position: "relative", aspectRatio: "9 / 16", borderRadius: "18px", overflow: "hidden", background: r.bg, cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: shadow }}
            >
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-52%, -60%)", fontFamily: "'Baloo 2', sans-serif", fontSize: "72px", fontWeight: 800, color: "rgba(255,255,255,0.16)", pointerEvents: "none" }}>{initial}</span>
              <span style={{ position: "absolute", top: "10px", left: "10px", right: "10px", height: "3px", background: "rgba(255,255,255,0.25)", borderRadius: "2px", overflow: "hidden" }}><span style={{ display: "block", height: "100%", background: "#FFFFFF", borderRadius: "2px", animation: "reelProg 6s linear infinite", animationDelay: progDelay }}></span></span>
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 10px 10px", background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.72))", display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.45)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800, color: "#FFFFFF", flexShrink: 0 }}>{initial}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.handle}</span>
                  <span style={{ display: "block", fontSize: "9.5px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{r.views}</span>
                </span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: "2px", height: "12px", flexShrink: 0 }}>
                  <span style={{ width: "3px", height: "100%", background: "#F9A8D4", borderRadius: "1px", animation: "eq 0.8s ease-in-out infinite", transformOrigin: "bottom" }}></span>
                  <span style={{ width: "3px", height: "100%", background: "#F9A8D4", borderRadius: "1px", animation: "eq 0.8s ease-in-out 0.2s infinite", transformOrigin: "bottom" }}></span>
                  <span style={{ width: "3px", height: "100%", background: "#F9A8D4", borderRadius: "1px", animation: "eq 0.8s ease-in-out 0.4s infinite", transformOrigin: "bottom" }}></span>
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {reelOpen && (
        <div onClick={closeReel} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(30,27,46,0.72)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", padding: "24px", animation: "riseIn 0.25s ease both" }}>
          <div onClick={eatClick} style={{ position: "relative", width: "min(360px, 86vw, 46vh)", aspectRatio: "9 / 16", borderRadius: "28px", overflow: "hidden", background: arBg, boxShadow: "0 40px 100px rgba(0,0,0,0.5)", animation: "riseIn 0.3s ease both" }}>
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-52%, -60%)", fontFamily: "'Baloo 2', sans-serif", fontSize: "150px", fontWeight: 800, color: "rgba(255,255,255,0.16)", pointerEvents: "none" }}>{arInitial}</span>
            <span style={{ position: "absolute", top: "16px", left: "16px", right: "60px", height: "4px", background: "rgba(255,255,255,0.25)", borderRadius: "2px", overflow: "hidden" }}><span style={{ display: "block", height: "100%", background: "#FFFFFF", borderRadius: "2px", animation: "reelProg 6s linear infinite" }}></span></span>
            <button className="cs-close" onClick={closeReel} style={{ position: "absolute", top: "10px", right: "10px", width: "34px", height: "34px", borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round"></path></svg>
            </button>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px 18px", background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.8))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.5)", display: "grid", placeItems: "center", fontSize: "14px", fontWeight: 800, color: "#FFFFFF", flexShrink: 0 }}>{arInitial}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>{arHandle}</span>
                  <span style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{arViews} · via RGossips campaign</span>
                </span>
                <span style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "18px", flexShrink: 0 }}>
                  <span style={{ width: "4px", height: "100%", background: "#F9A8D4", borderRadius: "2px", animation: "eq 0.8s ease-in-out infinite", transformOrigin: "bottom" }}></span>
                  <span style={{ width: "4px", height: "100%", background: "#F9A8D4", borderRadius: "2px", animation: "eq 0.8s ease-in-out 0.2s infinite", transformOrigin: "bottom" }}></span>
                  <span style={{ width: "4px", height: "100%", background: "#F9A8D4", borderRadius: "2px", animation: "eq 0.8s ease-in-out 0.4s infinite", transformOrigin: "bottom" }}></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
