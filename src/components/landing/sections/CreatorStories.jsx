"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Fallback reels (local clips in /public/creatorReels), shown until the admin
// publishes rows in public.creator_stories (managed at admin
// /dashboard/creator-stories). Each autoplays muted + looping in the grid;
// tapping enlarges it and plays with sound. `bg` is only a backdrop shown while
// the clip buffers.
const FALLBACK_REELS = [
  { handle: "@sahilanand", videoUrl: "/creatorReels/sahil.mp4", bg: "linear-gradient(160deg, #8B5CF6, #4C1D95)" },
  { handle: "@nonaberrry", videoUrl: "/creatorReels/nonaberry.mp4", bg: "linear-gradient(160deg, #EC4899, #831843)" },
  { handle: "@aditirajput", videoUrl: "/creatorReels/aditi.mp4", bg: "linear-gradient(160deg, #A855F7, #6D28D9)" },
  { handle: "@alifestyle", videoUrl: "/creatorReels/ali.mp4", bg: "linear-gradient(160deg, #6366F1, #312E81)" },
  { handle: "@theyayawar", videoUrl: "/creatorReels/yaya.mp4", bg: "linear-gradient(160deg, #F472B6, #9D174D)" },
  { handle: "@karishma.t", videoUrl: "/creatorReels/karishma.mp4", bg: "linear-gradient(160deg, #7C3AED, #EC4899)" },
  { handle: "@vees_corner", videoUrl: "/creatorReels/veers.mp4", bg: "linear-gradient(160deg, #2D2350, #8B5CF6)" },
  { handle: "@nawab_adnan", videoUrl: "/creatorReels/nawab.mp4", bg: "linear-gradient(160deg, #DB2777, #7C3AED)" },
];

// creator_stories has no colour column, so admin-published reels get a buffering
// backdrop from this palette by position.
const BG_PALETTE = [
  "linear-gradient(160deg, #8B5CF6, #4C1D95)",
  "linear-gradient(160deg, #EC4899, #831843)",
  "linear-gradient(160deg, #A855F7, #6D28D9)",
  "linear-gradient(160deg, #6366F1, #312E81)",
  "linear-gradient(160deg, #F472B6, #9D174D)",
  "linear-gradient(160deg, #7C3AED, #EC4899)",
  "linear-gradient(160deg, #2D2350, #8B5CF6)",
  "linear-gradient(160deg, #DB2777, #7C3AED)",
];

const DEFAULT_LABEL = "TOP CREATOR STORIES";

// React sets the `muted` ATTRIBUTE but not the DOM `muted` PROPERTY, so
// `<video muted autoPlay>` is treated as unmuted → the browser blocks autoplay
// and you only see the first frame. Set the property imperatively via the ref
// and kick off play() so the grid reels actually loop. Module-level = stable
// ref (fires on mount only, not every render).
function autoplayMuted(el) {
  if (!el) return;
  el.muted = true;
  el.defaultMuted = true;
  const p = el.play();
  if (p && p.catch) p.catch(() => {});
}

// A backend video can fail to load (e.g. an Instagram reel *page* URL is
// ORB-blocked, or a link rots). Swap that cell to a bundled static clip once so
// it degrades to a real reel instead of a black tile. Guarded so a failing
// fallback can't loop.
function fallBackToStatic(el, fallbackUrl) {
  if (!el || !fallbackUrl || el.dataset.fellBack === "1") return;
  el.dataset.fellBack = "1";
  el.src = fallbackUrl;
  el.load();
  autoplayMuted(el);
}

export default function CreatorStories() {
  const [playing, setPlaying] = useState(-1);
  const [stories, setStories] = useState(FALLBACK_REELS);
  const [label, setLabel] = useState(DEFAULT_LABEL);

  // Swap in admin-published reels + the editable section label. When
  // creator_stories is empty we stay on FALLBACK_REELS so the section never
  // renders blank. Both tables are public-read, so the anon client is fine here.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [reelsRes, titleRes] = await Promise.all([
        supabase
          .from("creator_stories")
          .select("username, video_url, poster_url, avatar_url")
          .eq("is_active", true)
          .order("position", { ascending: true }),
        supabase.from("homepage_settings").select("value").eq("key", "creator_stories_section_title").maybeSingle(),
      ]);
      if (cancelled) return;
      const rows = (reelsRes.data || []).filter((r) => r.video_url);
      if (rows.length > 0) {
        setStories(
          rows.map((r, i) => {
            const u = (r.username || "").trim();
            return {
              handle: u ? (u.startsWith("@") ? u : `@${u}`) : "@creator",
              videoUrl: r.video_url,
              poster: r.poster_url || r.avatar_url || "",
              bg: BG_PALETTE[i % BG_PALETTE.length],
              // Static clip to fall back to if this backend video won't load.
              fallbackUrl: FALLBACK_REELS[i % FALLBACK_REELS.length].videoUrl,
            };
          }),
        );
      }
      if (titleRes.data?.value) setLabel(titleRes.data.value);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeReel = () => setPlaying(-1);
  const eatClick = (e) => e.stopPropagation();
  const active = playing >= 0 ? stories[playing] : null;
  const cols = Math.min(stories.length || 1, 8);

  // Enlarged video plays WITH SOUND. The open-click is a user gesture, so
  // unmuted autoplay is allowed; only if a browser still blocks it do we fall
  // back to muted so it always plays (no controls / no interaction needed).
  const modalVideo = useRef(null);
  useEffect(() => {
    const v = modalVideo.current;
    if (!v) return;
    v.muted = false;
    v.volume = 1;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [playing]);

  return (
    <section id="creator-stories" data-screen-label="Creator stories" className="cst-section" style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 0", scrollMarginTop: "80px" }}>
      <style>{`
        .cs-reel:hover{transform:translateY(-5px)}
        .cs-close:hover{background:rgba(255,255,255,0.35)}
        @media (max-width: 1000px){ .cs-grid{ grid-template-columns: repeat(4, 1fr) !important } }
        @media (max-width: 560px){ .cs-grid{ grid-template-columns: repeat(3, 1fr) !important } }
      `}</style>
      <style>{`
        @media (max-width: 767px) {
          .cst-section {
            padding: 45px 20px 0 !important;
          }
          .cst-title {
            font-size: 26px !important;
          }
          .cst-track {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 14px !important;
            margin: 28px -20px 0 !important;
            padding: 0 20px 12px !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .cst-track::-webkit-scrollbar {
            display: none !important;
          }
          .cst-card {
            flex: 0 0 72vw !important;
            max-width: 300px !important;
            scroll-snap-align: center !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 className="cst-title" style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>
          Reels people couldn&apos;t scroll past.
        </h2>
        <span style={{ fontSize: "12.5px", fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>{label} · TAP TO EXPAND</span>
      </div>
      <div className="cs-grid cst-track" style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "14px", marginTop: "40px" }}>
        {stories.map((r, i) => {
          const initial = (r.handle || "?")[1]?.toUpperCase() || "•";
          const isPlaying = playing === i;
          const shadow = isPlaying ? "0 18px 40px rgba(124,58,237,0.35)" : "0 8px 24px rgba(17,24,39,0.1)";
          return (
            <div
              key={i}
              className="cs-reel cst-card"
              onClick={() => setPlaying(i)}
              style={{
                position: "relative",
                aspectRatio: "9 / 16",
                borderRadius: "18px",
                overflow: "hidden",
                background: r.bg || "#2D2350",
                cursor: "pointer",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                boxShadow: shadow,
              }}
            >
              <video
                ref={autoplayMuted}
                src={r.videoUrl}
                poster={r.poster || undefined}
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
                tabIndex={-1}
                onError={(e) => fallBackToStatic(e.currentTarget, r.fallbackUrl)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
              />
              <span style={{ position: "absolute", top: "10px", left: "10px", right: "10px", height: "3px", background: "rgba(255,255,255,0.25)", borderRadius: "2px", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", background: "#FFFFFF", borderRadius: "2px", animation: "reelProg 6s linear infinite", animationDelay: `${i * 0.7}s` }}></span>
              </span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "26px 10px 10px",
                  background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.72))",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.22)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "10.5px", fontWeight: 800, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.handle}</span>
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
      {active && (
        <div
          onClick={closeReel}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(30,27,46,0.72)",
            backdropFilter: "blur(10px)",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            animation: "riseIn 0.25s ease both",
          }}
        >
          <div
            onClick={eatClick}
            style={{
              position: "relative",
              width: "min(360px, 86vw, 62vh)",
              aspectRatio: "9 / 16",
              borderRadius: "28px",
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
              animation: "riseIn 0.3s ease both",
            }}
          >
            <video ref={modalVideo} src={active.videoUrl} poster={active.poster || undefined} autoPlay loop playsInline onError={(e) => fallBackToStatic(e.currentTarget, active.fallbackUrl)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
            <button
              className="cs-close"
              onClick={closeReel}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 2,
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(6px)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round"></path>
              </svg>
            </button>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: "60px 18px 18px",
                background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.8))",
                pointerEvents: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.22)",
                    border: "1.5px solid rgba(255,255,255,0.5)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    flexShrink: 0,
                  }}
                >
                  {(active.handle || "?")[1]?.toUpperCase() || "•"}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "14.5px", fontWeight: 800, color: "#FFFFFF" }}>{active.handle}</span>
                  <span style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>via RGossips</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
