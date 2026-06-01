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
import SupportChat from "@/components/SupportChat";

// FAQ content — single source of truth for this page. Kept in lock-step with
// the SupportChat decision tree where possible so users see the same answers
// whether they search here or chat there.
const FAQ_GROUPS = [
  {
    icon: "🚀",
    title: "Getting Started",
    items: [
      {
        q: "How do I complete my profile?",
        a: "Open Profile → My Information and fill in your name, categories, location and bio. The progress bar on the profile page tells you what's left.",
      },
      {
        q: "How do campaigns work?",
        a: "Browse open campaigns from the Campaigns tab, apply with a short pitch, and once a brand approves you, post the deliverables and link them inside the campaign detail page.",
      },
      {
        q: "What's the requirement to receive deals?",
        a: "A connected Instagram (Business / Creator account), a published media kit, and a rate card. The profile completion checklist shows you exactly what's pending.",
      },
    ],
  },
  {
    icon: "📸",
    title: "Profile & Instagram",
    items: [
      {
        q: "How do I refresh my Instagram stats?",
        a: "Profile → tap the Instagram card → Refresh. Stats sync at most once per hour to stay within Instagram's API limits.",
      },
      {
        q: "Instagram says reconnect — why?",
        a: "Instagram access tokens expire every 60 days. Opening Profile while signed in usually auto-renews the token; if it's already expired, you'll see a Reconnect button.",
      },
      {
        q: "My reels aren't showing up",
        a: "Reels only sync from Business / Creator accounts. Switch in the Instagram app under Settings → Account type, then come back and tap Refresh on your Profile.",
      },
    ],
  },
  {
    icon: "💰",
    title: "Payments",
    items: [
      {
        q: "When do I get paid?",
        a: "Once the brand approves your live links, payment moves to Payment Released. Funds typically reflect within 7–10 business days.",
      },
      {
        q: "How do I add a UPI ID or bank account?",
        a: "Profile → Payment Methods → Add New. The first method you add becomes your primary payout destination.",
      },
      {
        q: "Payment hasn't arrived",
        a: "If the campaign is on Payment Released for more than 14 business days, tap Request a callback in support — we'll chase the brand.",
      },
    ],
  },
  {
    icon: "📦",
    title: "Services & Orders",
    items: [
      {
        q: "How does Get Custom Quote work?",
        a: "Pick a service, submit the brief, and the seller replies with a quote. Once you accept and pay the advance via Stripe, work begins.",
      },
      {
        q: "Where do I track my orders?",
        a: "Profile → Service Requests, or jump straight to /influencer/services/orders. Each order has its own page with status and payment breakdown.",
      },
      {
        q: "Can I request a revision?",
        a: "Yes. While the draft is in review, open the order and tap Request Revision. You'll be asked to describe what to change.",
      },
    ],
  },
  {
    icon: "🛡️",
    title: "Account & Privacy",
    items: [
      {
        q: "How do I take a break without losing my data?",
        a: "Profile → Privacy & Security → Deactivate Account. Your data is preserved; signing in with the same phone reactivates everything.",
      },
      {
        q: "How do I remove a device that's logged in?",
        a: "Profile → Privacy & Security → Trusted Devices. Tap Remove on any device that isn't yours.",
      },
      {
        q: "Where are notification preferences?",
        a: "Profile → Notifications. Toggles persist immediately and the disabled categories stop appearing in your bell and on the notifications page.",
      },
    ],
  },
];

const SUPPORT_EMAIL = "grievance@rgossips.com";

const HelpSupport = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Client-side fuzzy: lowercases the query and matches on either the
  // question or answer. Empty query shows everything.
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_GROUPS;
    return FAQ_GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans lg:pt-24">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-20 px-6 py-5 flex items-center gap-4 border-b border-gray-50">
        <button
          onClick={onBack}
          className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-xl active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-xl font-black tracking-tight text-gray-900">
          Help & Support
        </h1>
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
            placeholder="Search the FAQs…"
            className="w-full bg-white border border-gray-100 rounded-xl py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-pink-50 transition-all placeholder:text-gray-300 shadow-sm"
          />
        </div>

        {/* Contact Us */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            Contact Us
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ContactCard
              icon={<MessageCircle size={22} />}
              title="Live Chat"
              subtitle="Chat with our team — usually replies instantly"
              iconBg="bg-blue-500"
              onClick={() => setChatOpen(true)}
            />
            <ContactCard
              icon={<Mail size={22} />}
              title="Email Support"
              subtitle={SUPPORT_EMAIL}
              iconBg="bg-pink-500"
              href={`mailto:${SUPPORT_EMAIL}`}
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            Frequently Asked Questions
          </h3>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-50">
              <HelpCircle size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No matches for "{query}"</p>
              <p className="text-[11px] text-gray-300 mt-1">Try a different keyword or start a live chat.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <FAQGroup key={group.title} icon={group.icon} title={group.title}>
                {group.items.map((item, i) => {
                  const id = `${group.title}-${i}`;
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
                Still stuck?
              </h4>
              <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                Open a chat with our support team — for anything an FAQ
                doesn't cover.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <button
              onClick={() => setChatOpen(true)}
              className="px-6 py-4 cursor-pointer bg-linear-to-b from-[#B68C4A] to-[#9A7238] text-white rounded-[1.25rem] text-sm font-black shadow-xl active:scale-[0.98] transition-all"
            >
              Open Live Chat
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
