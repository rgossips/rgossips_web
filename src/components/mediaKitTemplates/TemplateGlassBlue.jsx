"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatCount, readProfile, readDemographics, readHeadlineStats, readInsights, readSocials, toServiceLabel } from "./shared";
import { truncateText } from "@/lib/text";

// Glass-Blue editorial template. Frosted panels stacked over a soft
// gradient background. Read-only — bio + reels editing live in Classic.
export default function TemplateGlassBlue({ profile }) {
  const t = useTranslations("MediaKitTemplatesTemplateGlassBlue");
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ti = useTranslations("MediaKitInsights");
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);
  const last30 = ti("headline.last30", { days: ins.days });
  const staleText = ins.stale ? (ins.updatedLabel ? ti("stale", { date: ins.updatedLabel }) : ti("staleNoDate")) : null;

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
              <div className="text-base font-medium mt-3">"{truncateText(p.bio.split("\n")[0], 90)}"</div>
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
            <Stat n={formatCount(p.followers)} l={t("stats.followers")} />
            <Stat n={hs.viewers.display} l={ti("headline.viewers")} />
            <Stat n={hs.reelViews.display} l={ti("headline.reelViews")} last />
          </div>
        </div>

        {/* 01 PERFORMANCE */}
        <SectionRow num="01" label={t("sections.performance")}>
          <div style={glass} className="p-7">
            <Label>{t("performance.label")}</Label>
            <div className="rounded-2xl p-5 text-white flex justify-between items-baseline flex-wrap gap-3 mb-3" style={{ background: grad, boxShadow: "0 18px 40px -20px rgba(21,100,214,.7)" }}>
              <div>
                <div className="text-[11px] tracking-[.14em] uppercase font-bold opacity-90">{ti("headline.reelViews")}</div>
                <div className="text-[36px] sm:text-[46px] font-extrabold leading-none tracking-tight tabular-nums">{hs.reelViews.display}</div>
              </div>
              <div className="text-[13px] opacity-90">{last30}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PStat label={ti("headline.viewers")} value={hs.viewers.display} sub={last30} />
              <PStat label={ti("headline.posts")} value={hs.posts.display} sub={ti("headline.postsSub")} />
              <PStat label={ti("headline.likes")} value={hs.likes.display} sub={last30} />
            </div>
            {!ins.hasData && staleText && <StaleNote text={staleText} />}
          </div>
          {ins.hasData && (
            <div style={glass} className="p-7 mt-5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-4">
                <span className="text-[11px] tracking-[.16em] uppercase font-bold text-[#74909f]">{ti("title", { days: ins.days })}</span>
                {ins.rangeLabel && <span className="text-[12px] text-[#48657e] font-medium">· {ins.rangeLabel}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {ins.items.map((it, i) => (
                  <div
                    key={it.key}
                    className={`min-w-0 p-3.5 sm:p-4 rounded-2xl ${i === ins.items.length - 1 ? lastSpan(ins.items.length) : ""}`}
                    style={{ background: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.6)" }}
                  >
                    <div className="text-[10px] sm:text-[10.5px] tracking-[.1em] uppercase font-bold text-[#74909f] truncate">{ti(`labels.${it.key}`)}</div>
                    <div className="text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-none tabular-nums mt-1.5">{it.display}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11.5px] text-[#48657e] font-medium mt-4">{ti("source")}</div>
              {staleText && <StaleNote text={staleText} />}
            </div>
          )}
        </SectionRow>

        {/* 02 AUDIENCE */}
        <SectionRow num="02" label={t("sections.audience")}>
          <div style={glass} className="p-7">
            <Label>{t("audience.label")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <SubH>{t("audience.topCities")}</SubH>
                {demo.topCities.map((c, i) => <Bar key={c.name} label={c.name} pct={c.pct} delay={i} grad={grad} />)}
              </div>
              <div>
                <SubH>{t("audience.ageBrackets")}</SubH>
                {demo.ageRanges.map((a, i) => <Bar key={a.range} label={a.range} pct={a.pct} delay={i} grad={grad} />)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 mt-6">
              <div>
                <SubH>{t("audience.genderSplit")}</SubH>
                <Donut g={demo.gender} colors={["#60a5fa", "#1564d6", "#06b6d4"]} />
              </div>
              {demo.topCountries.length > 0 && (
                <div>
                  <SubH>{t("audience.topCountries")}</SubH>
                  {demo.topCountries.map((c, i) => <Bar key={c.name} label={c.name} pct={c.pct} delay={i} grad={grad} />)}
                </div>
              )}
            </div>
          </div>
        </SectionRow>

        {/* 03 SOCIAL */}
        <SectionRow num="03" label={t("sections.channels")}>
          <div style={glass} className="p-7">
            <Label>{t("channels.label")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {socials.map((s, i) => (
                <SocRow key={s.key} s={s} idx={i} grad={grad} />
              ))}
            </div>
          </div>
        </SectionRow>

        {/* 04 SERVICES */}
        {p.services.length > 0 && (
          <SectionRow num="04" label={t("sections.rates")}>
            <div style={glass} className="p-7">
              <Label>{t("services.label")}</Label>
              {p.services.map((sv, i) => {
                const rate = p.serviceRates[sv];
                const last = i === p.services.length - 1;
                return (
                  <div key={sv} className={`flex justify-between items-center py-4 ${last ? "" : "border-b"}`} style={{ borderColor: "rgba(14,42,68,.10)" }}>
                    <span className="font-semibold text-[15px]">{toServiceLabel(sv)}</span>
                    {rate ? <span className="text-[17px] font-extrabold tracking-tight">₹{Number(rate).toLocaleString("en-IN")}</span>
                      : <span className="text-[13px] text-[#1564d6] font-bold">{t("services.onRequest")}</span>}
                  </div>
                );
              })}
            </div>
          </SectionRow>
        )}

        {/* 05 TOP CONTENT */}
        {p.topReels.length > 0 && (
          <SectionRow num="05" label={t("sections.work")}>
            <div style={glass} className="p-7">
              <Label>{t("content.label")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {p.topReels.map((reel, i) => {
                  const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
                  return (
                    <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden aspect-square block" style={{ background: thumb ? "transparent" : "linear-gradient(150deg,#4a5e72,#1a2a3a)" }}>
                      {thumb && <img src={thumb} alt={reel.caption || t("content.reelAlt")} className="absolute inset-0 w-full h-full object-cover" />}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(8,24,40,.82),transparent 52%)" }} />
                      {reel.caption && <div className="absolute left-2 right-2 bottom-6 text-[11.5px] font-semibold text-white leading-tight">{truncateText(reel.caption, 60)}</div>}
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

        <div className="text-center text-xs text-[#48657e] font-medium">{t.rich("footer.generatedOn", { b: (c) => <b className="text-[#1564d6]">{c}</b> })}</div>
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
// 2 cols → 3 from sm → 4 from lg. The last tile stretches to close the final
// row so an odd count (7 metrics is common) never leaves a hole.
function lastSpan(n) {
  const base = n % 2 === 1 ? "col-span-2" : "";
  const sm = ["sm:col-span-1", "sm:col-span-3", "sm:col-span-2"][n % 3];
  const lg = ["lg:col-span-1", "lg:col-span-4", "lg:col-span-3", "lg:col-span-2"][n % 4];
  return `${base} ${sm} ${lg}`;
}
function StaleNote({ text }) {
  return <div className="mt-3 text-[11px] sm:text-[11.5px] font-medium text-[#92600a] rounded-lg px-3 py-1.5" style={{ background: "rgba(254,243,199,.6)", border: "1px solid rgba(251,191,36,.35)" }}>{text}</div>;
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
  const t = useTranslations("MediaKitTemplatesTemplateGlassBlue");
  const segs = [
    [g.female || 0, colors[0], t("gender.female")],
    [g.male || 0, colors[1], t("gender.male")],
    [g.other || 0, colors[2], t("gender.other")],
  ].filter(([val], i) => i < 2 || val > 0); // "Other" only when there is some
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
