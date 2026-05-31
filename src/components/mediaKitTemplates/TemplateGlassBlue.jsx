"use client";

import React from "react";
import Image from "next/image";
import { formatCount, readProfile, readDemographics, readSocials, toServiceLabel } from "./shared";

// Glass-Blue editorial template. Frosted panels stacked over a soft
// gradient background. Read-only — bio + reels editing live in Classic.
export default function TemplateGlassBlue({ profile }) {
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

  const grad = "linear-gradient(135deg,#1564d6 0%,#0ea5e9 55%,#06b6d4 100%)";
  const glass = {
    background: "rgba(226,239,251,.42)",
    backdropFilter: "blur(22px) saturate(150%)",
    border: "1px solid rgba(255,255,255,.6)",
    borderRadius: 22,
    boxShadow: "0 18px 54px -26px rgba(15,41,66,.45), inset 0 1px 0 rgba(255,255,255,.7)",
  };

  return (
    <div
      style={{
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
        color: "#0e2a44",
        background:
          "radial-gradient(38% 32% at 10% 6%, rgba(56,189,248,.55), transparent 62%)," +
          "radial-gradient(42% 38% at 90% 2%, rgba(99,132,241,.40), transparent 62%)," +
          "radial-gradient(46% 42% at 84% 92%, rgba(34,211,238,.42), transparent 62%)," +
          "radial-gradient(40% 38% at 4% 94%, rgba(59,130,246,.45), transparent 62%)," +
          "linear-gradient(160deg,#dce9f8 0%,#bcd6ef 100%)",
      }}
    >
      <div className="max-w-[900px] mx-auto px-4 py-9 flex flex-col gap-5">
        {/* HEADER */}
        <div style={glass} className="p-7 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-[clamp(28px,5.5vw,44px)] font-extrabold leading-none tracking-tight">{p.name}</div>
              <div className="text-[#1564d6] font-semibold mt-2">@{p.handle}</div>
              <div className="text-base font-medium mt-3">"{p.bio.split("\n")[0].slice(0, 90)}"</div>
              <div className="text-sm text-[#48657e] mt-1 font-medium">{p.primaryCategory}{p.location ? ` · ${p.location}` : ""}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                {p.categories.slice(0, 6).map((cat) => (
                  <span key={cat} className="text-[13px] font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.6)" }}>{cat}</span>
                ))}
              </div>
            </div>
            <div className="w-28 h-28 rounded-full overflow-hidden justify-self-start sm:justify-self-end" style={{ border: "5px solid rgba(255,255,255,.65)", boxShadow: "0 16px 40px -14px rgba(15,41,66,.5)" }}>
              {p.photo ? (
                <Image src={p.photo} alt={p.name} width={120} height={120} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-gradient-to-br from-[#cfe2f4] to-[#a9c8e8] text-white text-2xl font-bold">{p.initials}</div>
              )}
            </div>
          </div>
          <div className="flex border-t mt-5 pt-4" style={{ borderColor: "rgba(14,42,68,.10)" }}>
            <Stat n={formatCount(p.followers)} l="Followers" />
            <Stat n={formatCount(p.totalReach || p.totalImpressions)} l="Accounts Reached" />
            <Stat n={`${p.engagementRate || 0}%`} l="Engagement" last />
          </div>
        </div>

        {/* 01 PERFORMANCE */}
        <SectionRow num="01" label="Performance">
          <div style={glass} className="p-7">
            <Label>The Number That Matters · Last 30 Days</Label>
            <div className="rounded-2xl p-5 text-white flex justify-between items-baseline flex-wrap gap-3 mb-3" style={{ background: grad, boxShadow: "0 18px 40px -20px rgba(21,100,214,.7)" }}>
              <div>
                <div className="text-[11px] tracking-[.14em] uppercase font-bold opacity-90">Engagement Rate</div>
                <div className="text-[46px] font-extrabold leading-none tracking-tight">{p.engagementRate || 0}%</div>
              </div>
              <div className="text-[13px] opacity-90">vs 1.9% category average</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PStat label="Accounts Reached" value={formatCount(p.totalReach || p.totalImpressions)} sub="last 30 days" />
              <PStat label="Non-Follower Reach" value={`${p.nonFollowerReachPct}%`} sub="organic discovery" />
              <PStat label="Interactions" value={formatCount(p.avgLikes + p.avgComments)} sub="avg per post" />
            </div>
          </div>
        </SectionRow>

        {/* 02 AUDIENCE */}
        <SectionRow num="02" label="Audience">
          <div style={glass} className="p-7">
            <Label>Who's Watching</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <SubH>Top Cities</SubH>
                {demo.topCities.map((c, i) => <Bar key={c.name} label={c.name} pct={c.pct} delay={i} grad={grad} />)}
              </div>
              <div>
                <SubH>Age Brackets</SubH>
                {demo.ageRanges.map((a, i) => <Bar key={a.range} label={a.range} pct={a.pct} delay={i} grad={grad} />)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 mt-6">
              <div>
                <SubH>Gender Split</SubH>
                <Donut g={demo.gender} colors={["#60a5fa", "#1564d6", "#06b6d4"]} />
              </div>
              {demo.topCountries.length > 0 && (
                <div>
                  <SubH>Top Countries</SubH>
                  {demo.topCountries.map((c, i) => <Bar key={c.name} label={c.name} pct={c.pct} delay={i} grad={grad} />)}
                </div>
              )}
            </div>
          </div>
        </SectionRow>

        {/* 03 SOCIAL */}
        <SectionRow num="03" label="Channels">
          <div style={glass} className="p-7">
            <Label>Social Media</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {socials.map((s, i) => (
                <SocRow key={s.key} s={s} idx={i} grad={grad} />
              ))}
            </div>
          </div>
        </SectionRow>

        {/* 04 SERVICES */}
        {p.services.length > 0 && (
          <SectionRow num="04" label="Rates">
            <div style={glass} className="p-7">
              <Label>Services &amp; Rates</Label>
              {p.services.map((sv, i) => {
                const rate = p.serviceRates[sv];
                const last = i === p.services.length - 1;
                return (
                  <div key={sv} className={`flex justify-between items-center py-4 ${last ? "" : "border-b"}`} style={{ borderColor: "rgba(14,42,68,.10)" }}>
                    <span className="font-semibold text-[15px]">{toServiceLabel(sv)}</span>
                    {rate ? <span className="text-[17px] font-extrabold tracking-tight">₹{Number(rate).toLocaleString("en-IN")}</span>
                      : <span className="text-[13px] text-[#1564d6] font-bold">On request</span>}
                  </div>
                );
              })}
            </div>
          </SectionRow>
        )}

        {/* 05 TOP CONTENT */}
        {p.topReels.length > 0 && (
          <SectionRow num="05" label="Work">
            <div style={glass} className="p-7">
              <Label>Top Content</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {p.topReels.map((reel, i) => {
                  const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                  return (
                    <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden aspect-square block" style={{ background: thumb ? "transparent" : "linear-gradient(150deg,#4a5e72,#1a2a3a)" }}>
                      {thumb && <img src={thumb} alt={reel.caption || "Reel"} className="absolute inset-0 w-full h-full object-cover" />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(8,24,40,.82),transparent 52%)" }} />
                      {reel.caption && <div className="absolute left-2 right-2 bottom-6 text-[11.5px] font-semibold text-white leading-tight">{reel.caption.slice(0, 60)}</div>}
                      <div className="absolute left-2 bottom-2 flex gap-3 text-[11px] text-white/90 font-semibold">
                        <span>❤ {reel.likes || 0}</span>
                        <span>💬 {reel.comments || 0}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </SectionRow>
        )}

        {/* CTA */}
        <div className="rounded-[22px] p-8 text-center text-white" style={{ background: grad, boxShadow: "0 22px 50px -22px rgba(21,100,214,.7)" }}>
          <h3 className="text-2xl font-extrabold mb-1">Open for Collaborations</h3>
          <p className="opacity-95 mb-4 text-sm">Interested in working together? Reach out via Instagram or through the RGossips platform.</p>
          <a href={`https://instagram.com/${p.handle}`} target="_blank" rel="noreferrer" className="inline-block bg-white text-[#1564d6] font-bold px-6 py-3 rounded-xl text-sm">Start a Collaboration</a>
        </div>
        <div className="text-center text-xs text-[#48657e] font-medium">Generated on <b className="text-[#1564d6]">RGossips</b></div>
      </div>
    </div>
  );
}

function SectionRow({ num, label, children }) {
  return (
    <div className="grid sm:grid-cols-[84px_1fr] gap-3 sm:gap-6 items-start">
      <div className="sm:text-right sm:pt-1 sm:sticky sm:top-4 flex sm:block items-baseline gap-3">
        <span className="text-[30px] sm:text-[46px] font-extrabold leading-none" style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(14,42,68,.22)" }}>{num}</span>
        <span className="block sm:mt-2 text-[10.5px] tracking-[.18em] uppercase font-bold text-[#74909f]">{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
function Label({ children }) {
  return <div className="text-[11px] tracking-[.16em] uppercase font-bold text-[#74909f] mb-4">{children}</div>;
}
function SubH({ children }) {
  return <h4 className="text-[13px] font-bold mb-3">{children}</h4>;
}
function Stat({ n, l, last }) {
  return (
    <div className={`flex-1 px-4 ${last ? "" : "border-r"}`} style={{ borderColor: "rgba(14,42,68,.10)" }}>
      <b className="block text-[24px] font-extrabold tracking-tight">{n}</b>
      <span className="text-[11.5px] text-[#48657e] font-semibold tracking-wide">{l}</span>
    </div>
  );
}
function PStat({ label, value, sub }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.6)" }}>
      <div className="text-[10.5px] tracking-[.1em] uppercase font-bold text-[#74909f]">{label}</div>
      <div className="text-[32px] font-extrabold tracking-tight my-1.5">{value}</div>
      <div className="text-[12px] text-[#48657e] font-medium">{sub}</div>
    </div>
  );
}
function Bar({ label, pct, delay, grad }) {
  return (
    <div className="grid grid-cols-[100px_1fr_44px] sm:grid-cols-[116px_1fr_44px] items-center gap-3 mb-3">
      <span className="text-[13px] text-[#48657e] truncate font-medium">{label}</span>
      <div className="h-2 rounded-lg overflow-hidden" style={{ background: "rgba(14,42,68,.08)" }}>
        <div className="h-full rounded-lg" style={{ width: `${Math.min(pct, 100)}%`, background: grad, transition: "transform 1s", transitionDelay: `${delay * 60}ms` }} />
      </div>
      <span className="text-[13px] font-bold text-right">{pct}%</span>
    </div>
  );
}
function Donut({ g, colors }) {
  const segs = [
    [g.female || 0, colors[0], "Female"],
    [g.male || 0, colors[1], "Male"],
    [g.other || 0, colors[2], "Other"],
  ];
  const C = 2 * Math.PI * 45;
  let off = 0;
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg viewBox="0 0 120 120" className="w-[120px] h-[120px]">
        {segs.map(([val, color], i) => {
          const len = (C * val) / 100;
          const el = <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="15" strokeLinecap="round" strokeDasharray={`${Math.max(0, len - 3)} ${C - Math.max(0, len) + 3}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />;
          off += len;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2 text-[13px] text-[#48657e] font-medium">
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
function SocRow({ s, idx, grad }) {
  const isOdd = idx % 2 === 0;
  return (
    <div className={`flex items-center gap-3 py-4 ${isOdd ? "sm:border-r" : "sm:pl-4"} border-b`} style={{ borderColor: "rgba(14,42,68,.10)" }}>
      <span className="w-9 h-9 rounded-[10px] grid place-items-center text-white shrink-0" style={{ background: grad }}>
        <span className="text-base font-bold uppercase">{s.label.charAt(0)}</span>
      </span>
      <div>
        <div className="text-[10px] tracking-[.08em] uppercase font-bold text-[#74909f]">{s.label}</div>
        <div className="text-[11px] text-[#48657e]">{s.sub}</div>
      </div>
      <span className={`ml-auto text-[19px] font-extrabold ${s.value === "—" ? "text-[#74909f]" : ""}`}>{s.value}</span>
    </div>
  );
}
