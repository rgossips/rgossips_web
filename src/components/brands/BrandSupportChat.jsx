"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  HeadphonesIcon,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// ── Decision tree (brand side) ────────────────────────────────────────────
//
// Mirrors src/components/SupportChat.jsx (influencer). Each node is either:
//   { id, label, children: [...] }                      — a category / branch
//   { id, label, response, link?: { href } }            — leaf with a reply
//   { id, label, action: "callback" | "list_for_issue" }— leaf triggering a flow
//
// `label` / `response` strings here are the stable ENGLISH source of truth —
// `label` is what gets stored in support_callbacks.topic; the UI always
// renders via t(`labels.${id}`) / t(`responses.${id}`).

const TREE = {
  id: "root",
  label: "Hi! 👋 What can I help you with today?",
  children: [
    {
      id: "my_campaigns",
      label: "My campaigns",
      action: "list_for_issue",
    },
    {
      id: "payments",
      label: "Payments & escrow",
      children: [
        {
          id: "pay_escrow_how",
          label: "How does escrow work?",
          response:
            "Once a creator accepts your offer, you fund the agreed amount into escrow via Razorpay. We hold it safely while the creator delivers; it's only released to them after you approve the live post. If things fall through, the escrow can be resolved via support.",
        },
        {
          id: "pay_fund_fail",
          label: "Escrow payment not going through",
          response:
            "Razorpay occasionally declines on the first attempt — retry once, or switch card / UPI / netbanking. Make sure you're signed in on this browser (an expired session causes a silent failure). Still stuck? Request a callback and we'll complete it with you.",
        },
        {
          id: "pay_release_how",
          label: "How do I release payment?",
          response:
            "Open the campaign, review the creator's live links, and approve them — approval moves the escrow to Payment Released and the creator gets paid. You'll find every application on the campaign detail page.",
          link: { href: "/brands/campaigns" },
        },
        {
          id: "pay_refund",
          label: "Refund for a cancelled campaign",
          response:
            "Escrowed funds for work that never happened are refundable. Refunds are handled by our team case-by-case — request a callback with the campaign name and we'll process it.",
        },
      ],
    },
    {
      id: "account",
      label: "Account & verification",
      children: [
        {
          id: "acct_gstin",
          label: "Add or update GSTIN",
          response:
            "Open your brand profile and edit the Business Details section to add or correct your GSTIN. It appears on invoices, so double-check the 15-character format.",
          link: { href: "/brands/profile" },
        },
        {
          id: "acct_verify",
          label: "Check my verification status",
          response:
            "Your verification badge and trust score live on your brand profile. Verification usually completes within 1–2 business days of submitting your business details; the trust score grows as you complete campaigns.",
          link: { href: "/brands/profile" },
        },
        {
          id: "acct_edit",
          label: "Edit my brand profile",
          response:
            "Everything — logo, description, website, contact details — is editable from your brand profile page. Creators see this profile when they consider your campaigns, so keep it fresh.",
          link: { href: "/brands/profile" },
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
// Shown after the brand picks one of their own campaigns. Response text is
// resolved at click time via t(`issues.${key}`, { status }) so it can be
// status-aware.

const ISSUE_OPTIONS = [
  { id: "issue_no_apps" },
  { id: "issue_review" },
  { id: "issue_deliverables" },
  { id: "issue_escrow" },
  { id: "issue_release" },
  { id: "issue_callback", action: "callback" },
];

const ISSUE_TEXT_KEY = {
  issue_no_apps: "noApps",
  issue_review: "review",
  issue_deliverables: "deliverables",
  issue_escrow: "escrow",
  issue_release: "release",
};
// Issues whose answer deep-links to /brands/campaign/{id}
const ISSUE_LINK_IDS = new Set([
  "issue_no_apps",
  "issue_review",
  "issue_deliverables",
  "issue_release",
]);

// English labels for support_callbacks.topic_path context (stable, untranslated)
const ISSUE_EN_LABEL = {
  issue_no_apps: "No applications yet",
  issue_review: "How do I review applications?",
  issue_deliverables: "Deliverables not submitted",
  issue_escrow: "How does escrow work?",
  issue_release: "Release payment issue",
  issue_callback: "Request a callback",
};

// ── Component ─────────────────────────────────────────────────────────────

export default function BrandSupportChat({ open, onClose }) {
  const t = useTranslations("BrandSupportChat");
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [path, setPath] = useState([]); // breadcrumb of node ids
  const [messages, setMessages] = useState([]); // {role, text, options?, link?, ...}
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackContext, setCallbackContext] = useState(""); // topic prefix
  const [campaigns, setCampaigns] = useState(null); // null = not fetched yet
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef(null);

  // Portal needs document.body — only available client-side.
  useEffect(() => {
    setMounted(true);
  }, []);

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
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, callbackOpen]);

  if (!open || !mounted) return null;

  // ── Lazy campaigns fetch (brand's own, via brand-campaigns edge fn) ─────
  const ensureCampaigns = async () => {
    if (campaigns !== null) return campaigns;
    setCampaignsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("brand-campaigns", {
        body: { action: "list", brandId: user?.id },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      const list = data?.campaigns || [];
      setCampaigns(list);
      return list;
    } catch (e) {
      console.error("BrandSupportChat campaigns fetch failed:", e);
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
          text: t("campaigns.noneYet"),
          link: { href: "/brands/campaigns?new=1", label: t("links.createCampaign") },
          followUp: true,
        });
      } else {
        next.push({
          role: "bot",
          text: t("campaigns.pickCampaign"),
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
        text: t("campaigns.whatsUp", { title: campaign.title }),
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
      openCallback(`${campaign.title} · ${ISSUE_EN_LABEL[opt.id] || ""}`.replace(/ · $/, ""));
      return;
    }
    const issueKey = ISSUE_TEXT_KEY[opt.id];
    const text = t(`issues.${issueKey}`, {
      status: campaign.status || "",
      applications: campaign.applicationsTotal ?? 0,
    });
    const link = ISSUE_LINK_IDS.has(opt.id)
      ? { href: `/brands/campaign/${campaign.id}`, label: t("links.openThisCampaign") }
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

  // Render at <body> so the modal escapes the sidebar's stacking context and
  // sits above the sticky brand navbar (z-[100]).
  return createPortal((
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:justify-end bg-black/30 backdrop-blur-sm p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[420px] h-[85vh] sm:h-[640px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E4E9F4] shrink-0">
          {path.length > 0 && !callbackOpen && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-[#6B6785]"
              aria-label={t("header.backAria")}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6A66C9] to-[#31508F] flex items-center justify-center text-white shrink-0">
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
            className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-[#9C97B8]"
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
            <div className="flex items-center gap-2 text-xs text-[#9C97B8] px-2">
              <Loader2 size={12} className="animate-spin" />
              {t("loadingCampaigns")}
            </div>
          )}
        </div>

        {/* Sticky footer — always-on callback shortcut */}
        {!callbackOpen && (
          <div className="px-5 py-3 border-t border-[#E4E9F4] shrink-0">
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
  ), document.body);
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
  const t = useTranslations("BrandSupportChat");
  const isBot = message.role === "bot";
  const campaignAction = message.campaignAction;
  const handleCampaignClick = (c) => {
    if (campaignAction === "issue") {
      onPickCampaignForIssue?.(c);
    } else {
      onLink?.(`/brands/campaign/${c.id}`);
    }
  };

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[88%] ${isBot ? "" : "ml-auto"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isBot
              ? "bg-white border border-[#E4E9F4] text-slate-700"
              : "bg-gradient-to-r from-[#6A66C9] to-[#31508F] text-white shadow-sm"
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
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6A66C9] hover:underline cursor-pointer"
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
                className="w-full text-left p-2.5 rounded-xl border border-[#E4E9F4] bg-white hover:border-[#6A66C9]/40 hover:shadow-sm transition cursor-pointer flex items-center gap-3"
              >
                <CampaignAvatar c={c} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-slate-900 truncate">
                    {c.title}
                  </p>
                  <p className="text-[10px] text-[#6B6785] truncate flex items-center gap-1.5">
                    <span className="truncate">
                      {t("campaigns.applicationsCount", { count: c.applicationsTotal ?? 0 })}
                    </span>
                    <span className="text-slate-300">·</span>
                    <StatusPill status={c.status} />
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
                className="text-left px-3 py-2 rounded-xl border border-[#E4E9F4] bg-white text-[12px] font-semibold text-slate-700 hover:border-[#6A66C9]/40 hover:bg-[#6A66C9]/5 transition cursor-pointer"
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
              className="text-[11px] font-bold text-[#6B6785] px-2.5 py-1 rounded-lg bg-white border border-[#E4E9F4] hover:bg-slate-50 cursor-pointer"
            >
              {t("actions.askAnother")}
            </button>
            <button
              onClick={onRequestCallback}
              className="text-[11px] font-bold text-[#6A66C9] px-2.5 py-1 rounded-lg bg-[#6A66C9]/5 border border-[#6A66C9]/15 hover:bg-[#6A66C9]/10 cursor-pointer"
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
  if (c.bannerImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={c.bannerImage}
        alt={c.title}
        className="w-9 h-9 rounded-xl object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6A66C9] to-[#31508F] text-white flex items-center justify-center text-[11px] font-black shrink-0">
      {(c.title || "?").charAt(0).toUpperCase()}
    </div>
  );
}

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
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

function CallbackForm({ user, profile, path, context, onSubmitted, onCancel }) {
  const t = useTranslations("BrandSupportChat");
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
        user_role: "brand",
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
    <div className="bg-white border border-[#E4E9F4] rounded-2xl p-4 space-y-3">
      {context && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#6A66C9]/10 text-[#6A66C9] text-[10px] font-bold">
          <Sparkles size={10} /> {context}
        </div>
      )}
      <div>
        <p className="text-[10px] font-black text-[#9C97B8] uppercase tracking-wider mb-1">
          {t("callback.phoneLabel")}
        </p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20))}
          placeholder={t("callback.phonePlaceholder")}
          className="w-full h-10 px-3 rounded-xl border border-[#E4E9F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#6A66C9]/40"
        />
        <p className="text-[10px] text-[#9C97B8] mt-1">{t("callback.phoneHint")}</p>
      </div>

      <div>
        <p className="text-[10px] font-black text-[#9C97B8] uppercase tracking-wider mb-1">
          {t("callback.bestTime")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTime(opt.value)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                time === opt.value
                  ? "bg-[#6A66C9] text-white border-[#6A66C9]"
                  : "bg-white text-slate-600 border-[#E4E9F4] hover:border-[#6A66C9]/40"
              }`}
            >
              {t(`times.${opt.key}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-[#9C97B8] uppercase tracking-wider mb-1">
          {t("callback.notesLabel")}
        </p>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("callback.notesPlaceholder")}
          className="w-full px-3 py-2 rounded-xl border border-[#E4E9F4] text-sm focus:outline-none focus:ring-2 focus:ring-[#6A66C9]/40 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl border border-[#E4E9F4] text-sm font-bold text-slate-600 cursor-pointer disabled:opacity-50"
        >
          {t("callback.cancel")}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#6A66C9] to-[#31508F] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? t("callback.sending") : t("callback.submit")}
        </button>
      </div>
    </div>
  );
}

function greeting(profile, t) {
  const name =
    profile?.contact_name?.split(" ")[0] ||
    profile?.brand_name ||
    t("greetingFallbackName");
  return t("greeting", { name });
}
