"use client";
import React, { useMemo, useState } from "react";
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
    icon: "🚀",
    title: "Getting Started",
    items: [
      {
        q: "How do I post my first campaign?",
        a: "Click the purple Post Requirement button in the sidebar (or any Create Campaign CTA) to launch the campaign builder. Set your brief, budget, deliverables and deadline — campaigns go live in under 10 minutes.",
      },
      {
        q: "How do I find the right influencers?",
        a: "Use Find Creators in the sidebar. You can filter by category, follower count, location, engagement and gender, then sort by relevance, followers or recent activity.",
      },
      {
        q: "How does the matching work?",
        a: "We surface creators whose audience demographics, niche and recent performance line up with your brief. Featured creators on the home page are hand-picked by our team.",
      },
    ],
  },
  {
    icon: "💰",
    title: "Payments & Pricing",
    items: [
      {
        q: "Is it free for brands?",
        a: "Yes — brands pay zero subscription. You only pay the creator's negotiated rate plus any platform fee on completion of the campaign.",
      },
      {
        q: "How are payments handled?",
        a: "Payments are held in escrow when you approve a creator's deliverables, then released to them within 7–10 business days. No money leaves your account until you confirm the work.",
      },
      {
        q: "How do I add or change my GST details?",
        a: "Brand profiles capture GSTIN automatically during signup. To update it, contact us via the WhatsApp channel below and we'll help you re-verify.",
      },
    ],
  },
  {
    icon: "📦",
    title: "Campaign Management",
    items: [
      {
        q: "How do I review applications?",
        a: "Open the campaign from Campaigns → it lists every applicant with their media kit and rate. Approve or decline directly from there.",
      },
      {
        q: "Can I request revisions on deliverables?",
        a: "Yes. When a creator submits, you can approve or request a revision with a note. They'll be notified and resubmit.",
      },
      {
        q: "What if a creator goes dark?",
        a: "Use the contact button on their application card to ping them, or message us via WhatsApp and we'll chase them on your behalf.",
      },
    ],
  },
  {
    icon: "🛡️",
    title: "Account & Privacy",
    items: [
      {
        q: "Who can see my brand profile?",
        a: "Influencers see the brand name, logo, categories and active campaigns. Internal contacts, GSTIN and payment details are private.",
      },
      {
        q: "Can I have multiple team members?",
        a: "Multi-seat brand accounts are on our roadmap. For now, one phone number = one brand account. Ping us if you need a workaround.",
      },
    ],
  },
];

export default function BrandHelpAndSupport({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_GROUPS;
    return FAQ_GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-6 py-5 flex items-center gap-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black tracking-tight text-gray-900">Help & Support</h1>
            <p className="text-[11px] text-gray-400 font-bold">FAQs and contact options</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
            aria-label="Close"
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
              placeholder="Search the FAQs…"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-11 pr-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-50 transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Contact options */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] ml-1">
              Contact Us
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
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
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
              Frequently Asked Questions
            </h3>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                <HelpCircle size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-400">No matches for "{query}"</p>
                <p className="text-[11px] text-gray-300 mt-1">Try a different keyword or message us on WhatsApp.</p>
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
  );
}
