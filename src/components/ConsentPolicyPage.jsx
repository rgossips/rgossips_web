"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Renders a long-form consent policy from raw HTML (generated from the
 * source DOCX). The HTML is structured (h1/h2/h3, p, strong, em) so we just
 * apply light typography styles scoped to .consent-prose — no Tailwind
 * typography plugin needed.
 */
export default function ConsentPolicyPage({ title, subtitle, html }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[920px] mx-auto px-4 lg:px-8 py-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <header className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </header>

        <article
          className="consent-prose bg-white rounded-3xl border border-slate-100 p-6 lg:p-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <style jsx global>{`
          .consent-prose {
            color: rgb(51 65 85);
            font-size: 14px;
            line-height: 1.65;
          }
          .consent-prose > *:first-child {
            margin-top: 0;
          }
          .consent-prose h1 {
            font-size: 18px;
            font-weight: 800;
            color: rgb(15 23 42);
            margin: 28px 0 12px;
            line-height: 1.3;
            scroll-margin-top: 96px;
          }
          .consent-prose h2 {
            font-size: 15px;
            font-weight: 700;
            color: rgb(30 41 59);
            margin: 22px 0 8px;
            line-height: 1.35;
          }
          .consent-prose h3 {
            font-size: 13.5px;
            font-weight: 700;
            color: rgb(51 65 85);
            margin: 16px 0 6px;
          }
          .consent-prose p {
            margin: 10px 0;
          }
          .consent-prose strong {
            color: rgb(15 23 42);
            font-weight: 700;
          }
          .consent-prose em {
            color: rgb(71 85 105);
          }
          .consent-prose ul,
          .consent-prose ol {
            margin: 10px 0;
            padding-left: 22px;
          }
          .consent-prose li {
            margin: 4px 0;
          }
          .consent-prose a {
            color: rgb(236 72 153);
            text-decoration: underline;
          }
        `}</style>
      </div>
    </div>
  );
}
