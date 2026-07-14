"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatCount, readProfile, readDemographics, readSocials, toServiceLabel } from "./shared";

// Loud, blocky neo-brutalist look — hard black borders, offset shadows,
// chunky display type and a stamped colour palette. Read-only.
export default function TemplateNeoBrutalist({ profile }) {
  const t = useTranslations("MediaKitTemplatesTemplateNeoBrutalist");
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

  const ink = "#0f0f0f";
  const pink = "#E94560";
  const purple = "#7F47CD";
  const yellow = "#ffd23f";
  const cyan = "#3ad6c5";

  const blk = { fontFamily: "'Archivo Black', system-ui, sans-serif" };
  const mono = { fontFamily: "'Space Mono', ui-monospace, monospace" };
  const bd = `3px solid ${ink}`;
  const sh = `6px 6px 0 ${ink}`;
  const shLg = `10px 10px 0 ${ink}`;

  return (
    <div style={{
      background: "#f5f0e8",
      color: ink,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: 1.45,
      backgroundImage: `radial-gradient(${ink} 1px,transparent 1px)`,
      backgroundSize: "26px 26px",
    }}>
      <div className="max-w-[1040px] mx-auto px-4 py-7">
        {/* HERO */}
        <div className="p-7 mb-5 flex items-center gap-6 flex-wrap" style={{ background: pink, border: bd, boxShadow: shLg }}>
          <div className="w-[104px] h-[104px] shrink-0 overflow-hidden" style={{ border: bd, boxShadow: sh, background: yellow }}>
            {p.photo ? <Image src={p.photo} alt={p.name} width={104} height={104} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center font-extrabold text-2xl">{p.initials}</div>}
          </div>
          <div>
            <h1 style={blk} className="font-black text-[clamp(30px,7vw,54px)] leading-[.9] uppercase tracking-tight">
              {p.name.split(" ")[0]}<br />{p.name.split(" ").slice(1).join(" ") || ""}
            </h1>
            <div className="flex gap-2.5 mt-3.5 flex-wrap">
              {p.primaryCategory && <span style={{ ...mono, background: yellow, color: ink }} className="font-bold text-xs px-3 py-1.5 uppercase">✦ {p.primaryCategory}</span>}
              {p.location && <span style={{ ...mono, background: ink, color: "#fff" }} className="font-bold text-xs px-3 py-1.5 uppercase">◉ {p.location}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-5 items-start">
          {/* LEFT */}
          <div className="flex flex-col gap-5">
            {/* About */}
            <div className="p-6" style={{ background: yellow, border: bd, boxShadow: sh, ...blk }}>
              <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("about.label")}</span>
              <div className="text-[22px] sm:text-[26px] uppercase leading-tight">"{p.bio.slice(0, 70)}"</div>
            </div>

            {/* Expertise */}
            <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
              <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("expertise.label")}</span>
              <div className="flex flex-wrap gap-2.5">
                {(p.categories.length ? p.categories : [t("expertise.defaultCategory")]).map((c, i) => {
                  const bgs = [cyan, pink, purple, yellow];
                  const fgs = [ink, "#fff", "#fff", ink];
                  const bg = bgs[i % bgs.length];
                  const fg = fgs[i % fgs.length];
                  return <span key={c} style={{ ...mono, background: bg, color: fg, border: bd }} className="font-bold text-[13px] px-3.5 py-2 uppercase">{c}</span>;
                })}
              </div>
            </div>

            {/* Social */}
            <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
              <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("social.label")}</span>
              {socials.map((s) => (
                <div key={s.key} className="flex items-center gap-3 bg-white p-3 mb-2.5 last:mb-0" style={{ border: bd }}>
                  <span className="w-9 h-9 grid place-items-center text-white shrink-0 font-bold" style={{ border: bd, background: ink }}>{s.label.charAt(0)}</span>
                  <div>
                    <div style={mono} className="font-bold text-[13px] uppercase">{s.label}</div>
                    <div className="text-[11px] text-[#777]">{s.sub}</div>
                  </div>
                  <span style={blk} className={`ml-auto text-2xl ${s.value === "—" ? "text-[#bbb]" : ""}`}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Services */}
            {p.services.length > 0 && (
              <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
                <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("services.label")}</span>
                {p.services.map((sv, i) => {
                  const rate = p.serviceRates[sv];
                  const last = i === p.services.length - 1;
                  return (
                    <div key={sv} className={`flex justify-between items-center py-3.5 ${last ? "" : "border-b-2 border-dashed"}`} style={{ borderColor: ink }}>
                      <span className="font-bold text-[15px]">{toServiceLabel(sv)}</span>
                      {rate
                        ? <span className="text-lg" style={{ ...blk, background: yellow, border: `2px solid ${ink}`, padding: "2px 10px" }}>₹{Number(rate).toLocaleString("en-IN")}</span>
                        : <span className="font-bold text-sm" style={{ ...mono, background: cyan, border: `2px solid ${ink}`, padding: "2px 10px" }}>{t("services.onRequest")}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-5">
            {/* Performance */}
            <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
              <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("performance.label")}</span>
              <div style={blk} className="text-[26px] sm:text-[30px] uppercase leading-none mb-5">
                {t.rich("performance.headline", { em: (c) => <em className="not-italic px-2" style={{ background: pink, color: "#fff" }}>{c}</em>, br: () => <br /> })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <BStat lbl={t("performance.stats.accountsReached.label")} v={formatCount(p.totalReach || p.totalImpressions)} sub={t("performance.stats.accountsReached.sub")} ink={ink} sh={sh} bd={bd} mono={mono} blk={blk} />
                <BStat lbl={t("performance.stats.engagementRate.label")} v={`${p.engagementRate || 0}%`} sub={t("performance.stats.engagementRate.sub")} hl bg={purple} ink={ink} sh={sh} bd={bd} mono={mono} blk={blk} />
                <BStat lbl={t("performance.stats.nonFollowerReach.label")} v={`${p.nonFollowerReachPct}%`} sub={t("performance.stats.nonFollowerReach.sub")} ink={ink} sh={sh} bd={bd} mono={mono} blk={blk} />
                <BStat lbl={t("performance.stats.interactions.label")} v={formatCount(p.avgLikes + p.avgComments)} sub={t("performance.stats.interactions.sub")} ink={ink} sh={sh} bd={bd} mono={mono} blk={blk} />
              </div>
            </div>

            {/* Audience */}
            <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
              <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("audience.label")}</span>
              <BSubH ink={ink} mono={mono}>{t("audience.topCities")}</BSubH>
              {demo.topCities.map((c) => <BBar key={c.name} label={c.name} pct={c.pct} fill={pink} ink={ink} mono={mono} />)}
              <BSubH ink={ink} mono={mono}>{t("audience.ageBrackets")}</BSubH>
              {demo.ageRanges.map((a) => <BBar key={a.range} label={a.range} pct={a.pct} fill={purple} ink={ink} mono={mono} />)}
              <BSubH ink={ink} mono={mono}>{t("audience.genderSplit")}</BSubH>
              <BrutalDonut g={demo.gender} ink={ink} />
              {demo.topCountries.length > 0 && (
                <>
                  <BSubH ink={ink} mono={mono}>{t("audience.topCountries")}</BSubH>
                  {demo.topCountries.map((c) => <BBar key={c.name} label={c.name} pct={c.pct} fill={cyan} ink={ink} mono={mono} />)}
                </>
              )}
            </div>

            {/* Top content */}
            {p.topReels.length > 0 && (
              <div className="bg-white p-6" style={{ border: bd, boxShadow: sh }}>
                <span style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-[11px] tracking-wider uppercase px-2.5 py-1 mb-4">{t("topContent.label")}</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {p.topReels.map((reel, i) => {
                    const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                    return (
                      <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative aspect-square block overflow-hidden" style={{ border: bd, boxShadow: sh }}>
                        {thumb ? <img src={thumb} alt={reel.caption || t("topContent.reelAlt")} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" style={{ background: "linear-gradient(150deg,#7F47CD,#E94560)" }} />}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(15,15,15,.85),transparent 50%)" }} />
                        {reel.caption && <div style={mono} className="absolute left-2 right-2 bottom-7 font-bold text-[11px] text-white uppercase leading-tight">{reel.caption.slice(0, 50)}</div>}
                        <div className="absolute left-2 bottom-2 flex gap-3 font-bold text-[11px]" style={{ ...mono, color: yellow }}>
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
        </div>

        {/* CTA */}
        <div className="mt-5 p-8 text-center" style={{ background: cyan, border: bd, boxShadow: shLg }}>
          <h3 style={blk} className="text-[26px] uppercase mb-2">{t("cta.title")}</h3>
          <p style={mono} className="text-[13px]">{t("cta.body")}</p>
        </div>
        <div className="text-center mt-5 font-bold text-xs uppercase tracking-wider" style={mono}>{t.rich("footer.generatedOn", { brand: (c) => <b style={{ background: ink, color: "#fff", padding: "3px 8px" }}>{c}</b> })}</div>
      </div>
    </div>
  );
}

function BStat({ lbl, v, sub, hl, bg, ink, sh, bd, mono, blk }) {
  return (
    <div className="p-5" style={{ background: hl ? bg : "#fff", color: hl ? "#fff" : ink, border: bd, boxShadow: sh }}>
      <div className="font-bold text-[10.5px] tracking-wider uppercase" style={{ ...mono, color: hl ? "rgba(255,255,255,.8)" : "#666" }}>{lbl}</div>
      <div className="text-[40px] leading-none my-1.5" style={blk}>{v}</div>
      <div className="text-[11px]" style={{ ...mono, color: hl ? "rgba(255,255,255,.85)" : "#888" }}>{sub}</div>
    </div>
  );
}
function BSubH({ children, ink, mono }) {
  return <div style={{ ...mono, background: ink, color: "#fff" }} className="inline-block font-bold text-xs tracking-wider uppercase px-2.5 py-1 mt-6 mb-3.5 first:mt-0">{children}</div>;
}
function BBar({ label, pct, fill, ink, mono }) {
  return (
    <div className="grid grid-cols-[92px_1fr_46px] sm:grid-cols-[110px_1fr_46px] items-center gap-2.5 mb-3">
      <span style={mono} className="text-xs truncate">{label}</span>
      <div className="h-3.5" style={{ border: `2px solid ${ink}`, background: "#fff" }}>
        <div className="h-full" style={{ width: `${Math.min(pct, 100)}%`, background: fill }} />
      </div>
      <span style={mono} className="font-bold text-xs text-right">{pct}%</span>
    </div>
  );
}
function BrutalDonut({ g, ink }) {
  const t = useTranslations("MediaKitTemplatesTemplateNeoBrutalist");
  const segs = [
    [g.female || 0, "#7F47CD", t("gender.female")],
    [g.male || 0, "#E94560", t("gender.male")],
    [g.other || 0, "#ffd23f", t("gender.other")],
  ];
  const C = 2 * Math.PI * 45;
  let off = 0;
  const mono = { fontFamily: "'Space Mono', monospace" };
  return (
    <div className="flex items-center gap-5 flex-wrap mt-1.5">
      <svg viewBox="0 0 120 120" className="w-[120px] h-[120px] bg-white p-1.5" style={{ border: `3px solid ${ink}` }}>
        {segs.map(([val, color], i) => {
          const len = (C * val) / 100;
          const el = <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="15" strokeLinecap="butt" strokeDasharray={`${Math.max(0, len)} ${C - Math.max(0, len)}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />;
          off += len;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2.5" style={mono}>
        {segs.map(([val, color, label]) => (
          <div key={label} className="text-[13px] font-bold flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 shrink-0" style={{ background: color, border: `2px solid ${ink}` }} />
            {label} {val}%
          </div>
        ))}
      </div>
    </div>
  );
}
