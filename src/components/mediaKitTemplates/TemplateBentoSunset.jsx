"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatCount, readProfile, readDemographics, readHeadlineStats, readInsights, readSocials, toServiceLabel } from "./shared";
import { truncateText } from "@/lib/text";

// Bento-grid layout on a warm cream background with a sunset gradient
// running through the hero / engagement tile / bars. Read-only.
export default function TemplateBentoSunset({ profile }) {
  const t = useTranslations("MediaKitTemplatesTemplateBentoSunset");
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ti = useTranslations("MediaKitInsights");
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);
  const last30 = ti("headline.last30", { days: ins.days });
  const staleText = ins.stale ? (ins.updatedLabel ? ti("stale", { date: ins.updatedLabel }) : ti("staleNoDate")) : null;

  const sunset = "linear-gradient(135deg,#ff9a56 0%,#ff5d73 50%,#c850c0 100%)";
  const ink = "#2b1d18";
  const muted = "#9b857a";
  const faint = "#c4b2a6";

  const tile = "bg-white rounded-[26px] p-6 shadow-[0_2px_0_rgba(43,29,24,.04),0_16px_40px_-24px_rgba(200,80,120,.3)]";
  const lbl = "text-[11px] tracking-[.16em] uppercase font-bold mb-3";
  const disp = { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" };

  return (
    <div style={{ background: "#fbf3ec", color: ink, fontFamily: "'Figtree', system-ui, sans-serif" }}>
      <div className="max-w-[1080px] mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-3.5">

          {/* HERO */}
          <div className="col-span-12 relative overflow-hidden rounded-[30px] p-7 sm:p-8 text-white" style={{ background: sunset }}>
            <div className="absolute -top-28 -right-16 w-[300px] h-[300px] rounded-full bg-white/15" />
            <div className="absolute bottom-[-80px] right-40 w-[180px] h-[180px] rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-5 flex-wrap">
              <div className="w-24 h-24 rounded-[26px] overflow-hidden shrink-0 border-4 border-white/60 bg-white/20">
                {p.photo ? <Image src={p.photo} alt={p.name} width={96} height={96} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center font-bold text-2xl">{p.initials}</div>}
              </div>
              <div>
                <h1 style={disp} className="font-extrabold text-[clamp(28px,5vw,42px)] leading-none tracking-tight">{p.name}</h1>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.primaryCategory && <span className="bg-white/25 px-3.5 py-1.5 rounded-full text-[13px] font-semibold">✦ {p.primaryCategory}</span>}
                  {p.location && <span className="bg-white/25 px-3.5 py-1.5 rounded-full text-[13px] font-semibold">📍 {p.location}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* About + Expertise */}
          <div className={`${tile} col-span-12 sm:col-span-5`}>
            <div className={lbl} style={{ color: muted }}>{t("about.label")}</div>
            <div style={disp} className="font-bold text-[24px] leading-tight" >
              <span style={{ color: "#ff5d73" }}>"{truncateText((p.bio || "").split("\n")[0], 70)}"</span>
              <span className="block mt-1" style={{ color: faint }}>{t("about.tagline")}</span>
            </div>
          </div>
          <div className={`${tile} col-span-12 sm:col-span-7`}>
            <div className={lbl} style={{ color: muted }}>{t("expertise.label")}</div>
            <div className="flex flex-wrap gap-2">
              {(p.categories.length ? p.categories : [t("expertise.fallback")]).map((c, i) => {
                const colors = [
                  { bg: "#fdeee4", fg: "#c2632f" },
                  { bg: "#fde4ec", fg: "#E94560" },
                  { bg: "#efe6fb", fg: "#7F47CD" },
                  { bg: "#e4f3ee", fg: "#1f9d6b" },
                ];
                const col = colors[i % colors.length];
                return <span key={c} className="px-3.5 py-2 rounded-2xl font-semibold text-[14px]" style={{ background: col.bg, color: col.fg }}>{c}</span>;
              })}
            </div>
          </div>

          {/* Languages */}
          {p.contentLanguages.length > 0 && (
            <div className={`${tile} col-span-12`}>
              <div className={lbl} style={{ color: muted }}>{t("languages.label")}</div>
              <div className="flex flex-wrap gap-2">
                {p.contentLanguages.map((lang, i) => {
                  const colors = [
                    { bg: "#fdeee4", fg: "#c2632f" },
                    { bg: "#fde4ec", fg: "#E94560" },
                    { bg: "#efe6fb", fg: "#7F47CD" },
                    { bg: "#e4f3ee", fg: "#1f9d6b" },
                  ];
                  const col = colors[i % colors.length];
                  return <span key={lang} className="px-3.5 py-2 rounded-2xl font-semibold text-[14px]" style={{ background: col.bg, color: col.fg }}>{lang}</span>;
                })}
              </div>
            </div>
          )}

          {/* Reel views big tile */}
          <div className="col-span-12 sm:col-span-4 rounded-[26px] p-6 text-white flex flex-col justify-center" style={{ background: sunset }}>
            <div className={lbl} style={{ color: "rgba(255,255,255,.85)" }}>{ti("headline.reelViews")}</div>
            <div style={disp} className="font-extrabold text-[44px] sm:text-[56px] leading-[.95] my-1 tabular-nums">{hs.reelViews.display}</div>
            <div className="text-[13px] opacity-90">{last30}</div>
          </div>
          {/* 3 stats */}
          <div className={`${tile} col-span-12 sm:col-span-8 flex items-center`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
              <PStat lbl={ti("headline.viewers")} v={hs.viewers.display} sub={last30} disp={disp} muted={muted} />
              <PStat lbl={ti("headline.posts")} v={hs.posts.display} sub={ti("headline.postsSub")} disp={disp} muted={muted} />
              <PStat lbl={ti("headline.likes")} v={hs.likes.display} sub={last30} disp={disp} muted={muted} />
            </div>
          </div>

          {/* Instagram 30-day totals */}
          {ins.hasData && (
            <div className={`${tile} col-span-12`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
                <span className="text-[11px] tracking-[.16em] uppercase font-bold" style={{ color: muted }}>{ti("title", { days: ins.days })}</span>
                {ins.rangeLabel && <span className="text-[12px] font-medium" style={{ color: faint }}>· {ins.rangeLabel}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {ins.items.map((it, i) => (
                  <div
                    key={it.key}
                    className={`min-w-0 bg-[#faf4ef] rounded-2xl p-3.5 sm:p-4 ${i === ins.items.length - 1 ? lastSpan(ins.items.length) : ""}`}
                  >
                    <div className="text-[10px] sm:text-[11px] tracking-[.12em] uppercase font-bold truncate" style={{ color: muted }}>{ti(`labels.${it.key}`)}</div>
                    <div style={disp} className="font-extrabold text-[26px] sm:text-[32px] leading-none tabular-nums mt-1.5">{it.display}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] mt-3" style={{ color: faint }}>{ti("source")}</div>
              {staleText && <StaleNote text={staleText} />}
            </div>
          )}
          {!ins.hasData && staleText && (
            <div className="col-span-12 -mt-3">
              <StaleNote text={staleText} />
            </div>
          )}

          {/* Social */}
          <div className={`${tile} col-span-12 sm:col-span-6`}>
            <div className={lbl} style={{ color: muted }}>{t("socialMedia.label")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {socials.map((s) => (
                <div key={s.key} className="flex items-center gap-3 bg-[#faf4ef] rounded-2xl p-3">
                  <span className={`w-9 h-9 rounded-[11px] grid place-items-center text-white shrink-0 font-bold ${socialBg(s.key)}`}>{s.label.charAt(0)}</span>
                  <div>
                    <div className="text-[10px] tracking-wider uppercase font-bold" style={{ color: muted }}>{s.label}</div>
                    <div className="text-[11px]" style={{ color: faint }}>{s.sub}</div>
                  </div>
                  <span style={disp} className={`ml-auto font-extrabold text-[21px] ${s.value === "—" ? "" : ""}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          {p.services.length > 0 && (
            <div className={`${tile} col-span-12 sm:col-span-6`}>
              <div className={lbl} style={{ color: muted }}>{t("services.label")}</div>
              <div className="flex flex-col gap-2">
                {p.services.map((sv) => {
                  const rate = p.serviceRates[sv];
                  return (
                    <div key={sv} className="flex justify-between items-center bg-[#faf4ef] rounded-2xl px-4 py-3.5">
                      <span className="font-semibold text-[15px]">{toServiceLabel(sv)}</span>
                      <span className="font-bold text-[17px]" style={{ ...disp, color: rate ? "#ff5d73" : "#ffb84d" }}>
                        {rate ? `₹${Number(rate).toLocaleString("en-IN")}` : t("services.onRequest")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audience bars + donut */}
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>{t("audience.topCities")}</div>
            {demo.topCities.map((c) => <Bar key={c.name} label={c.name} pct={c.pct} grad={sunset} faint="#f0e3da" muted={muted} />)}
          </div>
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>{t("audience.ageBrackets")}</div>
            {demo.ageRanges.map((a) => <Bar key={a.range} label={a.range} pct={a.pct} grad={sunset} faint="#f0e3da" muted={muted} />)}
          </div>
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>{t("audience.genderSplit")}</div>
            <BentoDonut g={demo.gender} />
          </div>

          {/* Top content */}
          {p.topReels.length > 0 && (
            <div className={`${tile} col-span-12`}>
              <div className={lbl} style={{ color: muted }}>{t("topContent.label")}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {p.topReels.map((reel, i) => {
                  const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                  return (
                    <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative aspect-square block rounded-[18px] overflow-hidden">
                      {thumb ? <img src={thumb} alt={reel.caption || t("topContent.reelAlt")} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: "linear-gradient(150deg,#ff9a56,#c850c0)" }} />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(43,29,24,.85),transparent 55%)" }} />
                      {reel.caption && <div className="absolute left-2.5 right-2.5 bottom-6 text-[12px] font-semibold text-white leading-tight">{truncateText(reel.caption, 50)}</div>}
                      <div className="absolute left-2.5 bottom-2 flex gap-3 text-[11px] text-white opacity-95 font-semibold">
                        <span>❤ {reel.likes || 0}</span>
                        <span>💬 {reel.comments || 0}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        <div className="text-center mt-5 text-xs" style={{ color: faint }}>{t.rich("footer.generatedOn", { b: (c) => <b style={{ color: "#ff5d73" }}>{c}</b> })}</div>
      </div>
    </div>
  );
}

// 2 cols → 3 from sm → 4 from lg. The last tile stretches to close the final
// row so an odd count (7 metrics is common) never leaves a hole.
function lastSpan(n) {
  const base = n % 2 === 1 ? "col-span-2" : "";
  const sm = ["sm:col-span-1", "sm:col-span-3", "sm:col-span-2"][n % 3];
  const lg = ["lg:col-span-1", "lg:col-span-4", "lg:col-span-3", "lg:col-span-2"][n % 4];
  return `${base} ${sm} ${lg}`;
}

function StaleNote({ text }) {
  return <div className="mt-3 text-[11.5px] font-medium rounded-xl px-3 py-1.5" style={{ background: "#fff4e0", color: "#a3620f" }}>{text}</div>;
}

function PStat({ lbl, v, sub, disp, muted }) {
  return (
    <div>
      <div className="text-[11px] tracking-[.16em] uppercase font-bold mb-2" style={{ color: muted }}>{lbl}</div>
      <div style={disp} className="font-extrabold text-[40px] leading-none mb-1">{v}</div>
      <div className="text-[12px]" style={{ color: muted }}>{sub}</div>
    </div>
  );
}

function Bar({ label, pct, grad, faint, muted }) {
  return (
    <div className="grid grid-cols-[88px_1fr_40px] sm:grid-cols-[108px_1fr_44px] items-center gap-2.5 mb-2.5">
      <span className="text-[13px] truncate" style={{ color: muted }}>{label}</span>
      <div className="h-2.5 rounded-lg overflow-hidden" style={{ background: faint }}>
        <div className="h-full rounded-lg" style={{ width: `${Math.min(pct, 100)}%`, background: grad }} />
      </div>
      <span className="text-[13px] font-bold text-right">{pct}%</span>
    </div>
  );
}

function BentoDonut({ g }) {
  const t = useTranslations("MediaKitTemplatesTemplateBentoSunset");
  const segs = [
    [g.female || 0, "#c850c0", t("gender.female")],
    [g.male || 0, "#ff5d73", t("gender.male")],
    [g.other || 0, "#ffb84d", t("gender.other")],
  ].filter(([val], i) => i < 2 || val > 0); // "Other" only when there is some
  const C = 2 * Math.PI * 45;
  let off = 0;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 120 120" className="w-[110px] h-[110px]">
        {segs.map(([val, color], i) => {
          const len = (C * val) / 100;
          const el = <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${Math.max(0, len - 3)} ${C - Math.max(0, len) + 3}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />;
          off += len;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2 text-[13px]" style={{ color: "#9b857a" }}>
        {segs.map(([val, color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
            {label} {val}%
          </div>
        ))}
      </div>
    </div>
  );
}

function socialBg(key) {
  if (key === "instagram") return "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]";
  if (key === "youtube") return "bg-[#ff0000]";
  if (key === "facebook") return "bg-[#1877f2]";
  return "bg-[#111]";
}
