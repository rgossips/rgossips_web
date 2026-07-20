"use client";

import React from "react";

// Lightweight renderer for AI-generated text across the portal (tool modals,
// match coach, compliance results, media-kit writer). Models return light
// markdown — **bold**, *italic*, `code`, #/## headings, -/*/• bullets and
// 1./1) numbered lists — which used to render as raw markup inside <pre>.
// No dependency: a tiny block+inline parser is enough for this subset.

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

function renderInline(text, keyBase) {
  const parts = String(text).split(INLINE_RE);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    if (/^\*[^*\n]+\*$/.test(part)) return <em key={key}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part)) return <code key={key} className="px-1 py-0.5 bg-slate-100 rounded text-[0.9em] font-mono">{part.slice(1, -1)}</code>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function AiMarkdown({ text, className = "" }) {
  if (!text) return null;
  const lines = String(text).replace(/\r/g, "").split("\n");

  const blocks = [];
  let list = null; // { type: "ul" | "ol", items: [] }
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)/);
    const heading = line.match(/^\s*(#{1,4})\s+(.*)/);

    if (bullet) {
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(bullet[1]);
    } else if (num) {
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push(num[1]);
    } else {
      flushList();
      if (heading) blocks.push({ type: "h", text: heading[2] });
      else if (!line.trim()) blocks.push({ type: "gap" });
      else blocks.push({ type: "p", text: line });
    }
  });
  flushList();

  return (
    <div className={`text-sm text-slate-800 leading-relaxed ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === "gap") return <div key={i} className="h-2" />;
        if (b.type === "h") return <p key={i} className="font-black text-slate-900 mt-1 mb-0.5">{renderInline(b.text, i)}</p>;
        if (b.type === "ul" || b.type === "ol") {
          const Tag = b.type;
          return (
            <Tag key={i} className={`${b.type === "ul" ? "list-disc" : "list-decimal"} pl-5 space-y-1 my-1`}>
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </Tag>
          );
        }
        return <p key={i} className="my-0.5 break-words">{renderInline(b.text, i)}</p>;
      })}
    </div>
  );
}

// Pulls the machine-readable `RATES_JSON: {...}` line the rate_card tool
// appends. Returns { rates, cleanText } — rates is null when absent/invalid,
// cleanText always has the line stripped so it never shows to the user.
export function parseAiRates(text) {
  if (!text) return { rates: null, cleanText: text || "" };
  const m = String(text).match(/RATES_JSON:\s*(\{[^}]*\})/);
  const cleanText = String(text).replace(/\n?\s*RATES_JSON:\s*\{[^}]*\}\s*/g, "").trim();
  if (!m) return { rates: null, cleanText };
  try {
    const raw = JSON.parse(m[1]);
    const rates = {};
    for (const k of ["reels", "stories", "shorts", "posts", "ugc"]) {
      const v = Math.round(Number(raw[k]));
      if (Number.isFinite(v) && v > 0) rates[k] = v;
    }
    return { rates: Object.keys(rates).length ? rates : null, cleanText };
  } catch {
    return { rates: null, cleanText };
  }
}
