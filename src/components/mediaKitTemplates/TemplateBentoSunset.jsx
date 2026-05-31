"use client";

import React from "react";
import Image from "next/image";
import { formatCount, readProfile, readDemographics, readSocials, toServiceLabel } from "./shared";

// Bento-grid layout on a warm cream background with a sunset gradient
// running through the hero / engagement tile / bars. Read-only.
export default function TemplateBentoSunset({ profile }) {
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

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
            <div className={lbl} style={{ color: muted }}>About Me</div>
            <div style={disp} className="font-bold text-[24px] leading-tight" >
              <span style={{ color: "#ff5d73" }}>"{(p.bio || "").split("\n")[0].slice(0, 70)}"</span>
              <span className="block mt-1" style={{ color: faint }}>capturing moments, one frame at a time.</span>
            </div>
          </div>
          <div className={`${tile} col-span-12 sm:col-span-7`}>
            <div className={lbl} style={{ color: muted }}>Expertise</div>
            <div className="flex flex-wrap gap-2">
              {(p.categories.length ? p.categories : ["Content Creation"]).map((c, i) => {
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

          {/* Engagement big tile */}
          <div className="col-span-12 sm:col-span-4 rounded-[26px] p-6 text-white flex flex-col justify-center" style={{ background: sunset }}>
            <div className={lbl} style={{ color: "rgba(255,255,255,.85)" }}>Engagement Rate</div>
            <div style={disp} className="font-extrabold text-[56px] leading-[.95] my-1">{p.engagementRate || 0}%</div>
            <div className="text-[13px] opacity-90">vs 1.9% category avg</div>
          </div>
          {/* 3 stats */}
          <div className={`${tile} col-span-12 sm:col-span-8 flex items-center`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
              <PStat lbl="Reached" v={formatCount(p.totalReach || p.totalImpressions)} sub="last 30 days" disp={disp} muted={muted} />
              <PStat lbl="Non-Follower" v={`${p.nonFollowerReachPct}%`} sub="organic discovery" disp={disp} muted={muted} />
              <PStat lbl="Interactions" v={formatCount(p.avgLikes + p.avgComments)} sub="avg per post" disp={disp} muted={muted} />
            </div>
          </div>

          {/* Social */}
          <div className={`${tile} col-span-12 sm:col-span-6`}>
            <div className={lbl} style={{ color: muted }}>Social Media</div>
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
              <div className={lbl} style={{ color: muted }}>Services &amp; Rates</div>
              <div className="flex flex-col gap-2">
                {p.services.map((sv) => {
                  const rate = p.serviceRates[sv];
                  return (
                    <div key={sv} className="flex justify-between items-center bg-[#faf4ef] rounded-2xl px-4 py-3.5">
                      <span className="font-semibold text-[15px]">{toServiceLabel(sv)}</span>
                      <span className="font-bold text-[17px]" style={{ ...disp, color: rate ? "#ff5d73" : "#ffb84d" }}>
                        {rate ? `₹${Number(rate).toLocaleString("en-IN")}` : "On request"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audience bars + donut */}
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>Top Cities</div>
            {demo.topCities.map((c) => <Bar key={c.name} label={c.name} pct={c.pct} grad={sunset} faint="#f0e3da" muted={muted} />)}
          </div>
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>Age Brackets</div>
            {demo.ageRanges.map((a) => <Bar key={a.range} label={a.range} pct={a.pct} grad={sunset} faint="#f0e3da" muted={muted} />)}
          </div>
          <div className={`${tile} col-span-12 sm:col-span-4`}>
            <div className={lbl} style={{ color: muted }}>Gender Split</div>
            <BentoDonut g={demo.gender} />
          </div>

          {/* Top content */}
          {p.topReels.length > 0 && (
            <div className={`${tile} col-span-12`}>
              <div className={lbl} style={{ color: muted }}>Top Content</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {p.topReels.map((reel, i) => {
                  const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                  return (
                    <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative aspect-square block rounded-[18px] overflow-hidden">
                      {thumb ? <img src={thumb} alt={reel.caption || "Reel"} className="w-full h-full object-cover" />
                        : <div className="w-full h-full" style={{ background: "linear-gradient(150deg,#ff9a56,#c850c0)" }} />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(43,29,24,.85),transparent 55%)" }} />
                      {reel.caption && <div className="absolute left-2.5 right-2.5 bottom-6 text-[12px] font-semibold text-white leading-tight">{reel.caption.slice(0, 50)}</div>}
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

          {/* CTA */}
          <div className="col-span-12 rounded-[26px] p-8 text-center text-white" style={{ background: "#2b1d18" }}>
            <h3 style={disp} className="font-extrabold text-2xl mb-1.5">Open for Collaborations</h3>
            <p className="text-white/80 text-sm">Interested in working together? Reach out via Instagram or through RGossips.</p>
          </div>
        </div>
        <div className="text-center mt-5 text-xs" style={{ color: faint }}>Generated on <b style={{ color: "#ff5d73" }}>RGossips</b></div>
      </div>
    </div>
  );
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
  const segs = [
    [g.female || 0, "#c850c0", "Female"],
    [g.male || 0, "#ff5d73", "Male"],
    [g.other || 0, "#ffb84d", "Other"],
  ];
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
