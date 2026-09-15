"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatCount, readProfile, readDemographics, readHeadlineStats, readInsights, readSocials, toServiceLabel } from "./shared";
import { truncateText } from "@/lib/text";

// Magazine-style editorial layout — Fraunces serif, paper background,
// hard ink borders and offset shadows. Read-only.
export default function TemplateEditorialNoir({ profile }) {
  const t = useTranslations("MediaKitTemplatesTemplateEditorialNoir");
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ti = useTranslations("MediaKitInsights");
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);
  const last30 = ti("headline.last30", { days: ins.days });
  const staleText = ins.stale ? (ins.updatedLabel ? ti("stale", { date: ins.updatedLabel }) : ti("staleNoDate")) : null;

  const paper = "#f4efe6";
  const ink = "#16130f";
  const ink2 = "#43392f";
  const muted = "#8a7d6d";
  const line = "#ddd2c0";
  const pink = "#E94560";

  const SER = { fontFamily: "'Fraunces', 'Times New Roman', serif" };
  const BASE = { fontFamily: "'Archivo', system-ui, sans-serif" };

  return (
    <div style={{ ...BASE, background: paper, color: ink, lineHeight: 1.55 }}>
      <div className="max-w-[980px] mx-auto px-6 py-10 lg:py-12">
        {/* Masthead */}
        <div className="flex justify-between items-baseline gap-3 flex-wrap pb-3" style={{ borderBottom: `3px solid ${ink}` }}>
          <span className="text-[11px] tracking-[.35em] uppercase font-bold">{t("masthead")}</span>
          <span className="text-[11px] tracking-[.2em] uppercase" style={{ color: muted }}>{t("volume", { category: p.primaryCategory })}</span>
        </div>
        <hr className="mt-2 mb-7" style={{ borderTop: `1px solid ${ink}` }} />

        {/* HERO */}
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-9 items-center mb-5">
          <div className="w-[200px] h-[240px] overflow-hidden mx-auto sm:mx-0" style={{ boxShadow: `8px 8px 0 ${ink}`, background: "linear-gradient(160deg,#cdbfa9,#9b8a72)", filter: "grayscale(.2) contrast(1.05)" }}>
            {p.photo ? (
              <Image src={p.photo} alt={p.name} width={200} height={240} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-white text-3xl font-extrabold">{p.initials}</div>
            )}
          </div>
          <div>
            <div className="text-[12px] tracking-[.3em] uppercase font-bold mb-2" style={{ color: pink }}>{t("creatorProfile")}</div>
            <h1 style={SER} className="font-black tracking-tight leading-[.92] text-[clamp(40px,8vw,80px)]">
              {p.name.split(" ").slice(0, 1)}<br />{p.name.split(" ").slice(1).join(" ") || ""}
            </h1>
            <div style={{ ...SER, color: ink2 }} className="italic font-medium text-xl mt-3">
              {p.primaryCategory} <span style={{ color: pink, fontStyle: "normal" }}>— {p.location || "—"}</span>
            </div>
          </div>
        </div>

        {/* Lede */}
        <div style={{ ...SER, color: ink2, borderLeft: `4px solid ${pink}` }} className="italic text-[24px] sm:text-[26px] leading-[1.4] py-1 pl-5 my-7">
          "{p.bio}"
        </div>

        {/* Cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* LEFT */}
          <div>
            <Block>
              <SecTitle>{t("expertise")}</SecTitle>
              <div style={SER} className="text-[22px] leading-[1.7]">
                {p.categories.length > 0
                  ? p.categories.map((c, i) => (
                    <React.Fragment key={c}>
                      {i > 0 && <span style={{ color: pink }} className="mx-2">·</span>}
                      {c}
                    </React.Fragment>
                  ))
                  : t("contentCreation")}
              </div>
            </Block>

            {p.contentLanguages.length > 0 && (
              <Block>
                <SecTitle>{t("languages")}</SecTitle>
                <div style={SER} className="text-[22px] leading-[1.7]">
                  {p.contentLanguages.map((lang, i) => (
                    <React.Fragment key={lang}>
                      {i > 0 && <span style={{ color: pink }} className="mx-2">·</span>}
                      {lang}
                    </React.Fragment>
                  ))}
                </div>
              </Block>
            )}

            <Block>
              <SecTitle>{t("onTheChannels")}</SecTitle>
              <div style={{ borderTop: `1px solid ${line}` }}>
                {socials.map((s) => (
                  <div key={s.key} className="flex items-baseline justify-between py-4" style={{ borderBottom: `1px solid ${line}` }}>
                    <div>
                      <span style={SER} className="font-semibold text-[19px]">{s.label}</span>
                      <span className="text-[11px] tracking-[.18em] uppercase ml-2.5" style={{ color: muted }}>{s.sub}</span>
                    </div>
                    <span style={SER} className={`font-black text-[28px] ${s.value === "—" ? "" : ""}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Block>

            {p.services.length > 0 && (
              <Block>
                <SecTitle>{t("servicesAndRates")}</SecTitle>
                <div style={{ borderTop: `2px solid ${ink}` }}>
                  {p.services.map((sv) => {
                    const rate = p.serviceRates[sv];
                    return (
                      <div key={sv} className="flex justify-between items-baseline py-3.5" style={{ borderBottom: `1px solid ${line}` }}>
                        <span className="text-[16px] font-medium tracking-wide">{toServiceLabel(sv)}</span>
                        <span className="flex-1 mx-3 border-b border-dotted -translate-y-1" style={{ borderColor: muted }} />
                        {rate
                          ? <span style={SER} className="font-semibold text-[19px]">₹{Number(rate).toLocaleString("en-IN")}</span>
                          : <span style={{ ...SER, color: "#b08545" }} className="italic text-[16px]">{t("onRequest")}</span>}
                      </div>
                    );
                  })}
                </div>
              </Block>
            )}
          </div>

          {/* RIGHT */}
          <div>
            <Block>
              <SecTitle>{t("theNumberThatMatters")}</SecTitle>
              <div className="grid grid-cols-2" style={{ border: `2px solid ${ink}` }}>
                <Fig label={ti("headline.viewers")} value={hs.viewers.display} sub={last30} />
                <Fig label={ti("headline.reelViews")} value={hs.reelViews.display} sub={last30} hl />
                <Fig label={ti("headline.posts")} value={hs.posts.display} sub={ti("headline.postsSub")} />
                <Fig label={ti("headline.likes")} value={hs.likes.display} sub={last30} last />
              </div>
              {!ins.hasData && staleText && <StaleNote text={staleText} />}
            </Block>

            {ins.hasData && (
              <Block>
                <SecTitle>{ti("title", { days: ins.days })}</SecTitle>
                {ins.rangeLabel && (
                  <div style={{ ...SER, color: ink2 }} className="italic text-[15px] -mt-2 mb-4">{ins.rangeLabel}</div>
                )}
                {/* gap-px over a rule-coloured ground draws the hairlines between
                    figures; the last figure stretches so no empty cell shows. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-px" style={{ border: `2px solid ${ink}`, background: line }}>
                  {ins.items.map((it, i) => (
                    <div
                      key={it.key}
                      className={`min-w-0 p-4 sm:p-5 ${i === ins.items.length - 1 ? lastSpan(ins.items.length) : ""}`}
                      style={{ background: paper }}
                    >
                      <div className="text-[10px] sm:text-[10.5px] tracking-[.2em] uppercase font-bold truncate" style={{ color: muted }}>{ti(`labels.${it.key}`)}</div>
                      <div className="font-black text-[30px] sm:text-[36px] md:text-[34px] lg:text-[40px] leading-none tabular-nums mt-2" style={{ ...SER, color: ink }}>{it.display}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10.5px] tracking-[.2em] uppercase mt-3" style={{ color: muted }}>{ti("source")}</div>
                {staleText && <StaleNote text={staleText} />}
              </Block>
            )}

            <Block>
              <SecTitle>{t("whosWatching")}</SecTitle>
              <SubH>{t("topCities")}</SubH>
              {demo.topCities.map((c) => <NBar key={c.name} label={c.name} pct={c.pct} ink={ink} line={line} />)}
              <SubH>{t("ageBrackets")}</SubH>
              {demo.ageRanges.map((a) => <NBar key={a.range} label={a.range} pct={a.pct} ink={pink} line={line} />)}
              <SubH>{t("genderSplit")}</SubH>
              <NoirDonut g={demo.gender} />
              {demo.topCountries.length > 0 && (
                <>
                  <SubH>{t("topCountries")}</SubH>
                  {demo.topCountries.map((c) => <NBar key={c.name} label={c.name} pct={c.pct} ink={ink} line={line} />)}
                </>
              )}
            </Block>

          </div>
        </div>

        {/* Top Content — promoted to a full-width centered block below the
            two columns so the grid breathes and the editorial layout reads
            symmetrically. */}
        {p.topReels.length > 0 && (
          <div className="mt-11 mx-auto" style={{ maxWidth: 760 }}>
            <SecTitleCenter>{t("topContent")}</SecTitleCenter>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 justify-items-center">
              {p.topReels.map((reel, i) => {
                const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                return (
                  <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative aspect-[4/5] block overflow-hidden w-full" style={{ border: `1.5px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}` }}>
                    {thumb
                      ? <img src={thumb} alt={reel.caption || t("reelAlt")} className="w-full h-full object-cover" />
                      : <div className="w-full h-full" style={{ background: "linear-gradient(150deg,#9b8a72,#1a2a3a)" }} />}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(22,19,15,.85),transparent 50%)" }} />
                    {reel.caption && <div className="absolute left-2.5 right-2.5 bottom-7 text-[14px] text-white leading-tight" style={SER}>{truncateText(reel.caption, 60)}</div>}
                    <div className="absolute left-2.5 bottom-2 flex gap-3 text-[11px] text-white/90 font-semibold">
                      <span>❤ {reel.likes || 0}</span>
                      <span>💬 {reel.comments || 0}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Colophon */}
        <div className="mt-12 pt-5 text-center text-[11px] tracking-[.25em] uppercase" style={{ borderTop: `3px solid ${ink}`, color: muted }}>{t("generatedOn")}</div>
      </div>
    </div>
  );

  function Block({ children }) { return <div className="mb-11">{children}</div>; }
  function SecTitle({ children }) {
    return (
      <div style={{ ...SER, color: ink }} className="font-semibold text-[13px] tracking-[.28em] uppercase flex items-center gap-3.5 mb-5">
        {children}
        <span className="flex-1 h-px" style={{ background: line }} />
      </div>
    );
  }
  function SubH({ children }) {
    return <div style={SER} className="italic text-[18px] mt-6 mb-3 first:mt-0">{children}</div>;
  }
  function SecTitleCenter({ children }) {
    return (
      <div className="flex items-center gap-3.5 justify-center mb-5">
        <span className="h-px w-16" style={{ background: line }} />
        <span className="font-semibold text-[13px] tracking-[.28em] uppercase" style={{ ...SER, color: ink }}>{children}</span>
        <span className="h-px w-16" style={{ background: line }} />
      </div>
    );
  }
  function Fig({ label, value, sub, hl, last }) {
    return (
      <div className="p-6" style={{
        background: hl ? ink : "transparent",
        color: hl ? paper : ink,
        borderRight: `1px solid ${line}`,
        borderBottom: last ? "none" : `1px solid ${line}`,
      }}>
        <div className="text-[10.5px] tracking-[.2em] uppercase font-bold" style={{ color: hl ? "rgba(244,239,230,.7)" : muted }}>{label}</div>
        <div className="font-black text-[44px] sm:text-[54px] leading-none my-1.5" style={{ ...SER, color: hl ? "#fff" : ink }}>{value}</div>
        <div className="italic text-[14px]" style={{ ...SER, color: hl ? "rgba(244,239,230,.85)" : ink2 }}>{sub}</div>
      </div>
    );
  }
}

// 2 cols → 3 from sm → back to 2 from md (where the right column halves).
// The last figure stretches to close the final row.
function lastSpan(n) {
  const base = n % 2 === 1 ? "col-span-2" : "";
  const sm = ["sm:col-span-1", "sm:col-span-3", "sm:col-span-2"][n % 3];
  const md = n % 2 === 1 ? "md:col-span-2" : "md:col-span-1";
  return `${base} ${sm} ${md}`;
}
function StaleNote({ text }) {
  return <div className="mt-3 italic text-[13px] leading-snug" style={{ fontFamily: "'Fraunces', 'Times New Roman', serif", color: "#9a6a1f" }}>{text}</div>;
}

function NBar({ label, pct, ink, line }) {
  return (
    <div className="grid grid-cols-[100px_1fr_46px] sm:grid-cols-[118px_1fr_46px] items-center gap-3 mb-2.5">
      <span className="text-[13px] truncate" style={{ color: "#43392f" }}>{label}</span>
      <div className="h-[7px]" style={{ background: line }}>
        <div className="h-full" style={{ width: `${Math.min(pct, 100)}%`, background: ink }} />
      </div>
      <span className="text-[14px] font-semibold text-right" style={{ fontFamily: "'Fraunces',serif" }}>{pct}%</span>
    </div>
  );
}
function NoirDonut({ g }) {
  const t = useTranslations("MediaKitTemplatesTemplateEditorialNoir");
  const segs = [
    [g.female || 0, "#7F47CD", t("gender.female")],
    [g.male || 0, "#E94560", t("gender.male")],
    [g.other || 0, "#b08545", t("gender.other")],
  ].filter(([val], i) => i < 2 || val > 0); // "Other" only when there is some
  const C = 2 * Math.PI * 45;
  let off = 0;
  return (
    <div className="flex items-center gap-6 mt-1.5 flex-wrap">
      <svg viewBox="0 0 120 120" className="w-[120px] h-[120px]">
        {segs.map(([val, color], i) => {
          const len = (C * val) / 100;
          const el = <circle key={i} cx="60" cy="60" r="45" fill="none" stroke={color} strokeWidth="15" strokeLinecap="butt" strokeDasharray={`${Math.max(0, len)} ${C - Math.max(0, len)}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" />;
          off += len;
          return el;
        })}
      </svg>
      <div className="flex flex-col gap-2.5" style={{ fontFamily: "'Fraunces',serif" }}>
        {segs.map(([val, color, label]) => (
          <div key={label} className="text-[15px] flex items-center gap-2.5" style={{ color: "#43392f" }}>
            <span className="w-3 h-3 shrink-0" style={{ background: color }} />
            {label} {val}%
          </div>
        ))}
      </div>
    </div>
  );
}
