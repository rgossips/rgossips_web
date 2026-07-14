"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  X,
  Search,
  Mail,
  MessageCircle,
  Instagram,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

const SUPPORT_EMAIL = "grievance@rgossips.com";
const SUPPORT_WHATSAPP = "https://wa.me/918802907907";
const SUPPORT_INSTAGRAM = "https://www.instagram.com/rgossips.agency/";

// Brand-side FAQs. Phrased from the brand's perspective — the influencer
// FAQs live in src/components/HelpAndSupport.jsx.
const FAQ_GROUPS = [
  {
    key: "gettingStarted",
    icon: "🚀",
    items: [
      { key: "postFirstCampaign" },
      { key: "findInfluencers" },
      { key: "matching" },
    ],
  },
  {
    key: "payments",
    icon: "💰",
    items: [
      { key: "freeForBrands" },
      { key: "paymentsHandled" },
      { key: "gstDetails" },
    ],
  },
  {
    key: "campaigns",
    icon: "📦",
    items: [
      { key: "reviewApplications" },
      { key: "revisions" },
      { key: "creatorDark" },
    ],
  },
  {
    key: "account",
    icon: "🛡️",
    items: [
      { key: "whoSeesProfile" },
      { key: "teamMembers" },
    ],
  },
];

export default function BrandHelpAndSupport({ open, onClose }) {
  const t = useTranslations("BrandsBrandHelpAndSupport");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Portal needs document.body — only available client-side. Without this
  // first-render check we'd get an SSR mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  const translatedGroups = useMemo(
    () =>
      FAQ_GROUPS.map((g) => ({
        key: g.key,
        icon: g.icon,
        title: t(`faqs.${g.key}.title`),
        items: g.items.map((it) => ({
          q: t(`faqs.${g.key}.items.${it.key}.q`),
          a: t(`faqs.${g.key}.items.${it.key}.a`),
        })),
      })),
    [t]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return translatedGroups;
    return translatedGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, translatedGroups]);

  if (!open || !mounted) return null;

  // Render at <body> so the drawer escapes every ancestor stacking context
  // (the sidebar's fixed container, anything with a transform, etc.).
  // Plain `fixed` from inside the sidebar tree was being out-stacked by
  // cards on the profile page.
  return createPortal((
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-5 flex items-center gap-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black tracking-tight text-gray-900">{t("header.title")}</h1>
            <p className="text-[11px] text-gray-400 font-bold">{t("header.subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
            aria-label={t("close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-11 pr-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Contact options */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
              {t("contactUs")}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                  <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("labels.email")}</p>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                    {SUPPORT_EMAIL}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </a>
              <a
                href={SUPPORT_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <MessageCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">
                    +91 88029 07907
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </a>
              <a
                href={SUPPORT_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-pink-200 hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center shadow-sm">
                  <Instagram size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instagram</p>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                    @rgossips.agency
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
              {t("faq.title")}
            </h3>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                <HelpCircle size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-400">{t("noMatches", { query })}</p>
                <p className="text-[11px] text-gray-300 mt-1">{t("noMatchesHint")}</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-lg">{group.icon}</span>
                    <h4 className="text-sm font-black text-gray-800 tracking-tight">{group.title}</h4>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                    {group.items.map((item, i) => {
                      const id = `${group.title}-${i}`;
                      const isOpen = openId === id;
                      return (
                        <div key={id} className="border-b border-slate-50 last:border-0">
                          <button
                            onClick={() => setOpenId(isOpen ? null : id)}
                            className="w-full cursor-pointer flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors group"
                            type="button"
                          >
                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 pr-3">
                              {item.q}
                            </span>
                            {isOpen ? (
                              <ChevronDown size={16} className="text-purple-500 shrink-0" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 -mt-1 text-[13px] leading-relaxed text-gray-600">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  ), document.body);
}
