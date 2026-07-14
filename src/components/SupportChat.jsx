"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  HeadphonesIcon,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// ── Decision tree ─────────────────────────────────────────────────────────
//
// Each node is either:
//   { id, label, description?, children: [...] }       — a category / branch
//   { id, label, response, link?: { href, label } }    — leaf with a reply
//   { id, label, action: "callback" | "list_active" | "list_for_issue" }
//                                                       — leaf that triggers
//                                                         a special flow
//
// Keep the tree small and decisive — every leaf should either give an answer
// or send the user somewhere useful in the app. Always reachable: callback.

const TREE = {
  id: "root",
  label: "Hi! 👋 What can I help you with today?",
  children: [
    {
      id: "campaigns",
      label: "Campaigns",
      children: [
        {
          id: "campaign_show_active",
          label: "Show my active campaigns",
          action: "list_active",
        },
        {
          id: "campaign_issue",
          label: "Issue with a campaign",
          action: "list_for_issue",
        },
        {
          id: "campaign_apply_how",
          label: "How do I apply to a campaign?",
          response:
            "Browse open campaigns from the Campaigns tab, open one you like, and tap Apply. Brands review applications within a few days.",
          link: { href: "/influencer/campaigns", label: "Open Campaigns" },
        },
        {
          id: "campaign_missing",
          label: "I can't find a campaign I applied to",
          response:
            "Open Campaigns and switch to the Applied tab — that's where every active application lives. The Completed tab only shows wrapped-up campaigns.",
          link: { href: "/influencer/campaigns", label: "Go to Campaigns" },
        },
        {
          id: "campaign_submit",
          label: "How do I submit deliverables / live links?",
          response:
            "Open the campaign detail page; once your application is Approved you'll see a Submit Deliverables button. After the live post goes up, paste the Instagram link there.",
          link: { href: "/influencer/campaigns", label: "Go to Campaigns" },
        },
      ],
    },
    {
      id: "profile",
      label: "Profile & Account",
      children: [
        {
          id: "profile_ig",
          label: "Update / refresh my Instagram",
          response:
            "Open your Profile, tap the Instagram card, and use Refresh to pull the latest stats. If your token has expired you'll see a reconnect button there.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
        {
          id: "profile_photo",
          label: "Change profile photo",
          response:
            "Profile → tap your avatar → upload a new image. We'll auto-crop it to a clean circle.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
        {
          id: "profile_bio",
          label: "Edit bio, categories or location",
          response:
            "Profile → My Information lets you edit name, bio, categories and city. Brands use these to match you to campaigns.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
        {
          id: "profile_reels",
          label: "My reels aren't showing",
          response:
            "Reels sync from your linked Instagram. Profile → Refresh Instagram pulls the latest. If they still don't appear, your IG account may not be a Business/Creator profile.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
      ],
    },
    {
      id: "services",
      label: "Services",
      children: [
        {
          id: "service_browse",
          label: "How do I browse services?",
          response:
            "Open the Services tab to see everything I offer to brands — reels, photo shoots, story takeovers, ambassadorships, and more. Each card opens a detail page with my rates and turnaround.",
          link: { href: "/influencer/services", label: "Open Services" },
        },
        {
          id: "service_quote",
          label: "How does Custom Quote work?",
          response:
            "Pick a service, tap Get Custom Quote, fill in what you need and submit. I review and reply with a personalised quote — once you accept, you pay the advance via Stripe and we move into delivery.",
          link: { href: "/influencer/services", label: "Open Services" },
        },
        {
          id: "service_order_track",
          label: "Track an existing order",
          response:
            "Profile → Orders shows every service request you've made. Each order page has the live status, payment breakdown, and any draft deliverables ready for review.",
          link: { href: "/influencer/services/orders", label: "My Orders" },
        },
        {
          id: "service_payment",
          label: "Payment / advance not going through",
          response:
            "Stripe occasionally declines cards on first attempt — try once more, or use a different card / UPI. If it still fails, request a callback and we'll help you wrap it up.",
        },
        {
          id: "service_revision",
          label: "Request a revision on a draft",
          response:
            "Open the order from Profile → Orders. While the draft is in review you'll see a Request Revision button — describe what to change and I'll re-deliver.",
          link: { href: "/influencer/services/orders", label: "My Orders" },
        },
        {
          id: "service_callback",
          label: "Talk to a human about a service",
          action: "callback",
        },
      ],
    },
    {
      id: "payments",
      label: "Payments",
      children: [
        {
          id: "pay_when",
          label: "When do I get paid?",
          response:
            "Once the brand approves your live links, the payment moves to Payment Released. Funds typically reflect in your account within 7–10 business days.",
        },
        {
          id: "pay_late",
          label: "Payment hasn't arrived",
          response:
            "Check the campaign detail page — if it's still on Payment Released after 14 business days, request a callback and we'll chase the brand for you.",
        },
        {
          id: "pay_bank",
          label: "Add or update bank details",
          response:
            "Profile → Payment Methods. We use these only for releasing your campaign earnings.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
      ],
    },
    {
      id: "plans",
      label: "Plans & Subscription",
      children: [
        {
          id: "plans_upgrade",
          label: "Upgrade my plan",
          response:
            "Pick the plan that fits — Pro unlocks 15 applications/month and richer analytics, Elite is unlimited.",
          link: { href: "/influencer/pricing", label: "View Plans" },
        },
        {
          id: "plans_compare",
          label: "What's the difference between plans?",
          response:
            "Open the pricing page for the full feature matrix — applications/month, analytics depth, audience demographics, deal matching priority and support level.",
          link: { href: "/influencer/pricing", label: "Compare Plans" },
        },
        {
          id: "plans_cancel",
          label: "Cancel my subscription",
          response:
            "Subscriptions can be cancelled directly from Stripe's billing portal. If you can't access it, request a callback and we'll cancel it for you.",
        },
      ],
    },
    {
      id: "tech",
      label: "Technical Issues",
      children: [
        {
          id: "tech_slow",
          label: "App is slow or won't load",
          response:
            "Hard-refresh the page (Ctrl/Cmd+Shift+R). If it persists, log out and back in. Still broken? Request a callback with what you were doing when it happened.",
        },
        {
          id: "tech_login",
          label: "Can't sign in",
          response:
            "Use the same Instagram account you signed up with. If OTP isn't arriving, double-check the country code — we send to +91 numbers only right now.",
        },
        {
          id: "tech_ig_token",
          label: "Instagram says reconnect",
          response:
            "IG tokens expire every 60 days. Profile → Reconnect Instagram refreshes it without losing any data.",
          link: { href: "/influencer/profile", label: "Go to Profile" },
        },
      ],
    },
    {
      id: "other",
      label: "Something else",
      children: [
        {
          id: "other_callback",
          label: "Request a callback",
          action: "callback",
        },
      ],
    },
  ],
};

const findNode = (path) => {
  let cursor = TREE;
  for (const id of path) {
    const next = (cursor.children || []).find((c) => c.id === id);
    if (!next) return cursor;
    cursor = next;
  }
  return cursor;
};

const findLabel = (id) => {
  const stack = [TREE];
  while (stack.length) {
    const n = stack.pop();
    if (n.id === id) return n.label;
    if (n.children) stack.push(...n.children);
  }
  return "";
};

// ── Per-campaign issue prompts ────────────────────────────────────────────
//
// These are status-aware sub-options shown after the user picks a specific
// campaign in the "issue with a campaign" flow. The response template gets
// the campaign object so we can mention the live status / brand / dates.

const ISSUE_OPTIONS = [
  { id: "issue_no_response" },
  { id: "issue_payment" },
  { id: "issue_deliverables" },
  { id: "issue_rejected" },
  { id: "issue_callback", action: "callback" },
];

// Maps issue-option ids to their ICU message key + whether they carry a
// deep-link to the campaign. Response text is resolved at click time (where
// the translator is in scope) via t(`issues.${key}`, { status, brand }).
const ISSUE_TEXT_KEY = {
  issue_no_response: "noResponse",
  issue_payment: "payment",
  issue_deliverables: "deliverables",
  issue_rejected: "rejected",
};
const ISSUE_LINK_IDS = new Set(["issue_deliverables", "issue_rejected"]);

// ── Component ─────────────────────────────────────────────────────────────

export default function SupportChat({ open, onClose }) {
  const t = useTranslations("SupportChat");
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [path, setPath] = useState([]); // breadcrumb of node ids
  const [messages, setMessages] = useState([]); // {role, text, options?, link?, ...}
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackContext, setCallbackContext] = useState(""); // topic prefix
  const [campaigns, setCampaigns] = useState(null); // null = not fetched yet
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPath([]);
      setCallbackOpen(false);
      setCallbackContext("");
      setMessages([
        {
          role: "bot",
          text: greeting(profile, t),
          options: TREE.children,
        },
      ]);
    }
  }, [open, profile]);

  // Smooth-scroll to bottom whenever the message list grows
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // requestAnimationFrame keeps the scroll synced with framer-motion's mount
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, callbackOpen]);

  if (!open) return null;

  // ── Lazy campaigns fetch ────────────────────────────────────────────────
  const ensureCampaigns = async () => {
    if (campaigns !== null) return campaigns;
    setCampaignsLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ influencerId: user?.id }),
      });
      const data = await res.json();
      const list = (data?.campaigns || []).filter((c) => c.applicationStatus);
      setCampaigns(list);
      return list;
    } catch (e) {
      console.error("SupportChat campaigns fetch failed:", e);
      setCampaigns([]);
      return [];
    } finally {
      setCampaignsLoading(false);
    }
  };

  // ── Action handlers ─────────────────────────────────────────────────────
  const openCallback = (context = "") => {
    setCallbackContext(context);
    setCallbackOpen(true);
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: t("callback.intro") },
    ]);
  };

  const handleListActive = async () => {
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: t("campaigns.pullingActive"), typing: true },
    ]);
    const list = await ensureCampaigns();
    const active = list.filter(
      (c) => c.applicationStatus && c.applicationStatus !== "completed" && c.applicationStatus !== "rejected"
    );
    setMessages((prev) => {
      const next = prev.filter((m) => !m.typing);
      if (active.length === 0) {
        next.push({
          role: "bot",
          text: t("campaigns.noneActive"),
          link: { href: "/influencer/campaigns", label: t("links.openCampaigns") },
          followUp: true,
        });
      } else {
        next.push({
          role: "bot",
          text: t("campaigns.activeCount", { count: active.length }),
          campaigns: active,
          campaignAction: "open",
        });
      }
      return next;
    });
  };

  const handleListForIssue = async () => {
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: t("campaigns.pullingAll"), typing: true },
    ]);
    const list = await ensureCampaigns();
    setMessages((prev) => {
      const next = prev.filter((m) => !m.typing);
      if (list.length === 0) {
        next.push({
          role: "bot",
          text: t("campaigns.noneApplied"),
          link: { href: "/influencer/campaigns", label: t("links.browseCampaigns") },
          followUp: true,
        });
      } else {
        next.push({
          role: "bot",
          text: t("campaigns.pickTrouble"),
          campaigns: list,
          campaignAction: "issue",
        });
      }
      return next;
    });
  };

  const handlePickCampaignForIssue = (campaign) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: campaign.title },
      {
        role: "bot",
        text: t("campaigns.whatsWrong", { title: campaign.title }),
        campaignContext: campaign,
        options: ISSUE_OPTIONS,
      },
    ]);
  };

  const handlePickIssueOption = (campaign, opt) => {
    if (opt.action === "callback") {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: t(`labels.${opt.id}`) },
      ]);
      openCallback(`${campaign.brandName || ""} · ${campaign.title}`);
      return;
    }
    const brand = campaign.brandName || t("issues.brandFallback");
    const issueKey = ISSUE_TEXT_KEY[opt.id];
    const text = t(`issues.${issueKey}`, {
      status: campaign.applicationStatus || "",
      brand,
    });
    const link = ISSUE_LINK_IDS.has(opt.id)
      ? { href: `/influencer/offers/${campaign.id}`, label: t("links.openThisCampaign") }
      : undefined;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: t(`labels.${opt.id}`) },
      {
        role: "bot",
        text,
        link,
        followUp: true,
      },
    ]);
  };

  const handlePick = (node) => {
    if (node.action === "callback") {
      setMessages((prev) => [...prev, { role: "user", text: t(`labels.${node.id}`) }]);
      openCallback();
      return;
    }
    if (node.action === "list_active") {
      setMessages((prev) => [...prev, { role: "user", text: t(`labels.${node.id}`) }]);
      handleListActive();
      return;
    }
    if (node.action === "list_for_issue") {
      setMessages((prev) => [...prev, { role: "user", text: t(`labels.${node.id}`) }]);
      handleListForIssue();
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: t(`labels.${node.id}`) }]);

    if (node.children?.length) {
      setPath((p) => [...p, node.id]);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: t("pickClosest"),
          options: node.children,
        },
      ]);
    } else if (node.response) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: t(`responses.${node.id}`),
          link: node.link ? { href: node.link.href, label: t(`links.${node.id}`) } : undefined,
          followUp: true,
        },
      ]);
    }
  };

  const handleBack = () => {
    if (path.length === 0) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    const parent = findNode(newPath);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: t("back") },
      {
        role: "bot",
        text: parent.id === "root" ? greeting(profile, t) : t("pickClosest"),
        options: parent.children,
      },
    ]);
  };

  const handleStartOver = () => {
    setPath([]);
    setCallbackOpen(false);
    setCallbackContext("");
    setMessages([
      {
        role: "bot",
        text: greeting(profile, t),
        options: TREE.children,
      },
    ]);
  };

  const handleCallbackSubmitted = () => {
    setCallbackOpen(false);
    setCallbackContext("");
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: t("callback.submitted"),
      },
    ]);
  };

  const handleLink = (href) => {
    onClose?.();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end bg-black/30 backdrop-blur-sm p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[420px] h-[85vh] sm:h-[640px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          {path.length > 0 && !callbackOpen && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-500"
              aria-label={t("header.backAria")}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <HeadphonesIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">{t("header.title")}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              {t("header.status")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
            aria-label={t("header.closeAria")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages — scroll-smooth keeps the auto-scroll buttery */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/40 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Bubble
                  message={m}
                  onPick={handlePick}
                  onLink={handleLink}
                  onStartOver={handleStartOver}
                  onPickCampaignForIssue={handlePickCampaignForIssue}
                  onPickIssueOption={handlePickIssueOption}
                  onRequestCallback={() => {
                    setMessages((prev) => [
                      ...prev,
                      { role: "user", text: t("actions.requestCallback") },
                    ]);
                    openCallback();
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {callbackOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.25 }}
              >
                <CallbackForm
                  user={user}
                  role={role}
                  profile={profile}
                  path={path}
                  context={callbackContext}
                  onSubmitted={handleCallbackSubmitted}
                  onCancel={() => setCallbackOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {campaignsLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
              <Loader2 size={12} className="animate-spin" />
              {t("loadingCampaigns")}
            </div>
          )}
        </div>

        {/* Sticky footer — always-on callback shortcut */}
        {!callbackOpen && (
          <div className="px-5 py-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: t("actions.requestCallback") },
                ]);
                openCallback();
              }}
              className="w-full h-11 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
            >
              <Phone size={14} /> {t("actions.requestCallback")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Bubble({
  message,
  onPick,
  onLink,
  onStartOver,
  onRequestCallback,
  onPickCampaignForIssue,
  onPickIssueOption,
}) {
  const t = useTranslations("SupportChat");
  const isBot = message.role === "bot";
  const campaignAction = message.campaignAction;
  const handleCampaignClick = (c) => {
    if (campaignAction === "issue") {
      onPickCampaignForIssue?.(c);
    } else {
      onLink?.(`/influencer/offers/${c.id}`);
    }
  };

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[88%] ${isBot ? "" : "ml-auto"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isBot
              ? "bg-white border border-slate-100 text-slate-700"
              : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
          }`}
        >
          {message.typing ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse [animation-delay:300ms]" />
              <span className="ml-1">{message.text}</span>
            </span>
          ) : (
            message.text
          )}
        </div>

        {message.link && isBot && (
          <button
            onClick={() => onLink(message.link.href)}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
          >
            {message.link.label} →
          </button>
        )}

        {/* Campaign list — animated, clickable cards */}
        {message.campaigns && isBot && (
          <motion.div
            className="mt-3 space-y-2"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
            }}
          >
            {message.campaigns.map((c) => (
              <motion.button
                key={c.id}
                onClick={() => handleCampaignClick(c)}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-pink-300 hover:shadow-sm transition cursor-pointer flex items-center gap-3"
              >
                <CampaignAvatar c={c} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-slate-900 truncate">
                    {c.title}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                    <span className="truncate">{c.brandName}</span>
                    <span className="text-slate-300">·</span>
                    <StatusPill status={c.applicationStatus} />
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Quick-reply options */}
        {message.options && isBot && (
          <motion.div
            className="mt-3 flex flex-col gap-1.5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
            }}
          >
            {message.options.map((opt) => (
              <motion.button
                key={opt.id}
                onClick={() =>
                  message.campaignContext
                    ? onPickIssueOption?.(message.campaignContext, opt)
                    : onPick?.(opt)
                }
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0 },
                }}
                whileTap={{ scale: 0.97 }}
                className="text-left px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-pink-300 hover:bg-pink-50 transition cursor-pointer"
              >
                {t(`labels.${opt.id}`)}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Follow-up actions */}
        {message.followUp && isBot && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={onStartOver}
              className="text-[11px] font-bold text-slate-500 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              {t("actions.askAnother")}
            </button>
            <button
              onClick={onRequestCallback}
              className="text-[11px] font-bold text-pink-600 px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-100 hover:bg-pink-100 cursor-pointer"
            >
              {t("actions.talkToHuman")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignAvatar({ c }) {
  if (c.brandLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={c.brandLogo}
        alt={c.brandName}
        className="w-9 h-9 rounded-xl object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 text-white flex items-center justify-center text-[11px] font-black shrink-0">
      {c.initials || (c.brandName || "?").charAt(0).toUpperCase()}
    </div>
  );
}

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  accepted: "bg-emerald-50 text-emerald-700",
  submitted: "bg-blue-50 text-blue-700",
  live_submitted: "bg-cyan-50 text-cyan-700",
  revision_needed: "bg-orange-50 text-orange-700",
  payment: "bg-amber-50 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700",
};

function StatusPill({ status }) {
  if (!status) return null;
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// `value` is the stable English string stored in the DB (support_callbacks.
// preferred_time); `key` selects the translated label shown in the UI.
const TIME_OPTIONS = [
  { value: "Today afternoon", key: "todayAfternoon" },
  { value: "Today evening", key: "todayEvening" },
  { value: "Tomorrow morning", key: "tomorrowMorning" },
  { value: "Tomorrow evening", key: "tomorrowEvening" },
  { value: "Anytime", key: "anytime" },
];

function CallbackForm({ user, role, profile, path, context, onSubmitted, onCancel }) {
  const t = useTranslations("SupportChat");
  const supabase = createClient();
  // Phones can arrive with or without `+` / country code — keep whatever the
  // caller provides as a default, just strip noise. Indian numbers default to
  // +91 if no country code is present.
  const defaultPhone = (profile?.contact_phone || profile?.phone || user?.phone || "").toString().replace(/[^\d+]/g, "");
  const [phone, setPhone] = useState(defaultPhone);
  const [time, setTime] = useState("Today afternoon");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const topicLabel = path.length > 0 ? findLabel(path[0]) : "General";
  const topicPath = [path.join(" > "), context].filter(Boolean).join(" · ");

  // Normalize to E.164-ish: keep `+` if present, otherwise prepend 91 for
  // anything that looks like a bare 10-digit Indian mobile.
  const normalizePhone = (raw) => {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("+")) {
      const digits = trimmed.replace(/[^\d]/g, "");
      return `+${digits}`;
    }
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError(t("callback.errors.signIn"));
      return;
    }
    const normalized = normalizePhone(phone);
    const digitsOnly = normalized.replace(/\D/g, "");
    // E.164 numbers are 8–15 digits including country code.
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      setError(t("callback.errors.invalidPhone"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { error: dbErr } = await supabase.from("support_callbacks").insert({
        user_id: user.id,
        user_role: role || "",
        topic: topicLabel,
        topic_path: topicPath,
        preferred_time: time,
        phone: normalized,
        notes: notes.trim(),
      });
      if (dbErr) throw new Error(dbErr.message);
      setDone(true);
      // Brief delay so the user sees the success state before the form
      // collapses back into the chat thread.
      setTimeout(() => onSubmitted?.(), 600);
    } catch (e) {
      setError(e.message || t("callback.errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const timeKey = TIME_OPTIONS.find((o) => o.value === time)?.key;
    const timeLabel = timeKey ? t(`timesLower.${timeKey}`) : time.toLowerCase();
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-black text-emerald-700">{t("callback.done.title")}</p>
          <p className="text-[11px] text-emerald-600">{t("callback.done.body", { phone, time: timeLabel })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      {context && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50 text-pink-700 text-[10px] font-bold">
          <Sparkles size={10} /> {context}
        </div>
      )}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          {t("callback.phoneLabel")}
        </p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20))}
          placeholder={t("callback.phonePlaceholder")}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <p className="text-[10px] text-slate-400 mt-1">{t("callback.phoneHint")}</p>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          {t("callback.bestTime")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTime(opt.value)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                time === opt.value
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-pink-300"
              }`}
            >
              {t(`times.${opt.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          {t("callback.notesLabel")}
        </p>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("callback.notesPlaceholder")}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 cursor-pointer disabled:opacity-50"
        >
          {t("callback.cancel")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? t("callback.sending") : t("callback.submit")}
        </button>
      </div>
    </div>
  );
}

function greeting(profile, t) {
  const name = profile?.full_name?.split(" ")[0] || profile?.username || t("greetingFallbackName");
  return t("greeting", { name });
}
