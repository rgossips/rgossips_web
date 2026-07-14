"use client";
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Mail,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import SupportChat from "@/components/SupportChat";

// FAQ content — single source of truth for this page. Kept in lock-step with
// the SupportChat decision tree where possible so users see the same answers
// whether they search here or chat there.
// User-facing title/q/a live in the HelpAndSupport namespace, resolved at
// render via the `key` fields below.
const FAQ_GROUPS = [
  {
    icon: "🚀",
    key: "gettingStarted",
    items: [
      { key: "completeProfile" },
      { key: "howCampaignsWork" },
      { key: "dealRequirements" },
    ],
  },
  {
    icon: "📸",
    key: "profileInstagram",
    items: [
      { key: "refreshStats" },
      { key: "reconnect" },
      { key: "reelsMissing" },
    ],
  },
  {
    icon: "💰",
    key: "payments",
    items: [
      { key: "whenPaid" },
      { key: "addPayoutMethod" },
      { key: "paymentMissing" },
    ],
  },
  {
    icon: "📦",
    key: "servicesOrders",
    items: [
      { key: "customQuote" },
      { key: "trackOrders" },
      { key: "requestRevision" },
    ],
  },
  {
    icon: "🛡️",
    key: "accountPrivacy",
    items: [
      { key: "takeBreak" },
      { key: "removeDevice" },
      { key: "notificationPrefs" },
    ],
  },
];

const SUPPORT_EMAIL = "grievance@rgossips.com";

const HelpSupport = ({ onBack }) => {
  const t = useTranslations("HelpAndSupport");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Client-side fuzzy: lowercases the query and matches on either the
  // question or answer. Empty query shows everything. FAQ text is resolved
  // from the namespace here so search runs against the translated strings.
  const filteredGroups = useMemo(() => {
    const resolved = FAQ_GROUPS.map((g) => ({
      icon: g.icon,
      key: g.key,
      title: t(`faq.${g.key}.title`),
      items: g.items.map((it) => ({
        key: it.key,
        q: t(`faq.${g.key}.${it.key}.q`),
        a: t(`faq.${g.key}.${it.key}.a`),
      })),
    }));
    const q = query.trim().toLowerCase();
    if (!q) return resolved;
    return resolved
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, t]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans lg:pt-24">
      {/* Header — same max-width + padding as the body below, so the
          back arrow and title line up with the search / content columns
          instead of hugging the screen edge. */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-20 border-b border-gray-50">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-5 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <h1 className="text-xl font-black tracking-tight text-gray-900">
            {t("title")}
          </h1>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 pt-6 space-y-8">
        {/* Search */}
        <div className="relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-white border border-gray-100 rounded-xl py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-pink-50 transition-all placeholder:text-gray-300 shadow-sm"
          />
        </div>

        {/* Contact Us */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            {t("contactUs")}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ContactCard
              icon={<MessageCircle size={22} />}
              title={t("liveChat.title")}
              subtitle={t("liveChat.subtitle")}
              iconBg="bg-blue-500"
              onClick={() => setChatOpen(true)}
            />
            <ContactCard
              icon={<Mail size={22} />}
              title={t("emailSupport.title")}
              subtitle={SUPPORT_EMAIL}
              iconBg="bg-pink-500"
              href={`mailto:${SUPPORT_EMAIL}`}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            {t("faqHeading")}
          </h3>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-50">
              <HelpCircle size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">{t("noMatches", { query })}</p>
              <p className="text-[11px] text-gray-300 mt-1">{t("noMatchesHint")}</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <FAQGroup key={group.key} icon={group.icon} title={group.title}>
                {group.items.map((item, i) => {
                  const id = `${group.key}-${i}`;
                  return (
                    <FAQItem
                      key={id}
                      question={item.q}
                      answer={item.a}
                      open={openId === id}
                      onToggle={() => setOpenId(openId === id ? null : id)}
                    />
                  );
                })}
              </FAQGroup>
            ))
          )}
        </section>

        {/* Talk to a human CTA */}
        <div className="bg-linear-to-b from-[#FEF3C7] to-[#f7f5c9] p-6 rounded-xl border border-gray-50 space-y-5 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 flex items-center justify-center bg-linear-to-b from-[#B68C4A] to-[#9A7238] text-white rounded-xl aspect-square shadow-lg shadow-amber-100">
              <HelpCircle size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-gray-900">
                {t("stillStuck.title")}
              </h4>
              <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                {t("stillStuck.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <button
              onClick={() => setChatOpen(true)}
              className="px-6 py-4 cursor-pointer bg-linear-to-b from-[#B68C4A] to-[#9A7238] text-white rounded-[1.25rem] text-sm font-black shadow-xl active:scale-[0.98] transition-all"
            >
              {t("openLiveChat")}
            </button>
          </div>
        </div>
      </div>

      <SupportChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

const ContactCard = ({ icon, title, subtitle, iconBg, onClick, href }) => {
  const content = (
    <>
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-xl text-white ${iconBg} shadow-lg shadow-gray-100`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-gray-900">{title}</h4>
        <p className="text-[11px] font-bold text-gray-400 truncate">{subtitle}</p>
      </div>
      <ChevronRight
        size={18}
        className="text-gray-300 group-hover:text-pink-500 transition-colors"
      />
    </>
  );
  const cls = "flex items-center gap-5 p-5 bg-white border border-gray-50 rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer group";
  if (href) {
    return (
      <a href={href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls} type="button">
      {content}
    </button>
  );
};

const FAQGroup = ({ icon, title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 ml-2">
      <span className="text-xl">{icon}</span>
      <h4 className="text-sm font-black text-gray-800 tracking-tight">
        {title}
      </h4>
    </div>
    <div className="bg-white border border-gray-50 rounded-xl overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

const FAQItem = ({ question, answer, open, onToggle }) => (
  <div className="border-b border-gray-50 last:border-0">
    <button
      onClick={onToggle}
      className="w-full cursor-pointer flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors group"
      type="button"
    >
      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 pr-4">
        {question}
      </span>
      {open ? (
        <ChevronDown size={18} className="text-pink-500 shrink-0" />
      ) : (
        <ChevronRight size={18} className="text-gray-200 group-hover:text-pink-500 transition-colors shrink-0" />
      )}
    </button>
    {open && (
      <div className="px-5 pb-5 -mt-1 text-[13px] leading-relaxed text-gray-600">
        {answer}
      </div>
    )}
  </div>
);

export default HelpSupport;
