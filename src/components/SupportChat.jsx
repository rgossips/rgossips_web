"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  HeadphonesIcon,
  Send,
  Phone,
  ChevronLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// ── Decision tree ─────────────────────────────────────────────────────────
//
// Each node is either:
//   { id, label, description?, children: [...] }   — a category / branch
//   { id, label, response, link?: { href, label } } — a leaf with a reply
//   { id, label, action: "callback" }               — opens the callback form
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
          id: "campaign_rejected",
          label: "My application was rejected",
          response:
            "Brands can reject for many reasons (audience fit, budget, fit). The campaign is marked Active again so you can re-apply if it suits you. Your monthly application cap isn't impacted by rejections.",
        },
        {
          id: "campaign_no_response",
          label: "Brand hasn't responded to my application",
          response:
            "Most brands respond within 5–7 days. If it's been longer, request a callback and we'll nudge them on your behalf.",
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

const labelForPath = (path) =>
  path.map((id) => findPath(id)).filter(Boolean).join(" › ");
const findPath = (id) => {
  const stack = [TREE];
  while (stack.length) {
    const n = stack.pop();
    if (n.id === id) return n.label;
    if (n.children) stack.push(...n.children);
  }
  return "";
};

// ── Component ─────────────────────────────────────────────────────────────

export default function SupportChat({ open, onClose }) {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [path, setPath] = useState([]); // breadcrumb of node ids
  const [messages, setMessages] = useState([]); // {role: 'bot'|'user', text, options?, link?}
  const [callbackOpen, setCallbackOpen] = useState(false);
  const scrollRef = useRef(null);

  const currentNode = useMemo(() => findNode(path), [path]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPath([]);
      setCallbackOpen(false);
      setMessages([
        {
          role: "bot",
          text: greeting(profile),
          options: TREE.children,
        },
      ]);
    }
  }, [open, profile]);

  // Autoscroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, callbackOpen]);

  if (!open) return null;

  const handlePick = (node) => {
    if (node.action === "callback") {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: node.label },
        { role: "bot", text: "Tell us how to reach you and we'll call back." },
      ]);
      setCallbackOpen(true);
      return;
    }

    // Show user's choice
    setMessages((prev) => [...prev, { role: "user", text: node.label }]);

    if (node.children?.length) {
      setPath((p) => [...p, node.id]);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: node.description || "Pick the closest match:",
          options: node.children,
        },
      ]);
    } else if (node.response) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: node.response,
          link: node.link,
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
      { role: "user", text: "← Back" },
      {
        role: "bot",
        text: parent.id === "root" ? greeting(profile) : "Pick the closest match:",
        options: parent.children,
      },
    ]);
  };

  const handleStartOver = () => {
    setPath([]);
    setCallbackOpen(false);
    setMessages([
      {
        role: "bot",
        text: greeting(profile),
        options: TREE.children,
      },
    ]);
  };

  const handleCallbackSubmitted = () => {
    setCallbackOpen(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: "Got it ✓ Our team will call back during the time you picked.",
      },
    ]);
  };

  const handleLink = (href) => {
    onClose?.();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end bg-black/30 backdrop-blur-sm p-0 sm:p-6">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[420px] h-[85vh] sm:h-[640px] flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          {path.length > 0 && !callbackOpen && (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-500"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <HeadphonesIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">RGossips Support</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Online · usually replies instantly
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/40">
          {messages.map((m, i) => (
            <Bubble
              key={i}
              message={m}
              onPick={handlePick}
              onLink={handleLink}
              onStartOver={handleStartOver}
              onRequestCallback={() => {
                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: "Request a callback" },
                  { role: "bot", text: "Tell us how to reach you and we'll call back." },
                ]);
                setCallbackOpen(true);
              }}
            />
          ))}

          {callbackOpen && (
            <CallbackForm
              user={user}
              role={role}
              profile={profile}
              path={path}
              onSubmitted={handleCallbackSubmitted}
              onCancel={() => setCallbackOpen(false)}
            />
          )}
        </div>

        {/* Sticky footer — always-on callback shortcut */}
        {!callbackOpen && (
          <div className="px-5 py-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: "Request a callback" },
                  { role: "bot", text: "Tell us how to reach you and we'll call back." },
                ]);
                setCallbackOpen(true);
              }}
              className="w-full h-11 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
            >
              <Phone size={14} /> Request a callback
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Bubble({ message, onPick, onLink, onStartOver, onRequestCallback }) {
  const isBot = message.role === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] ${isBot ? "" : "ml-auto"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isBot
              ? "bg-white border border-slate-100 text-slate-700"
              : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
          }`}
        >
          {message.text}
        </div>

        {message.link && isBot && (
          <button
            onClick={() => onLink(message.link.href)}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
          >
            {message.link.label} →
          </button>
        )}

        {/* Options grid */}
        {message.options && isBot && (
          <div className="mt-3 flex flex-col gap-1.5">
            {message.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onPick(opt)}
                className="text-left px-3 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-pink-300 hover:bg-pink-50 transition cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Follow-up actions */}
        {message.followUp && isBot && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={onStartOver}
              className="text-[11px] font-bold text-slate-500 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Ask another question
            </button>
            <button
              onClick={onRequestCallback}
              className="text-[11px] font-bold text-pink-600 px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-100 hover:bg-pink-100 cursor-pointer"
            >
              Talk to a human
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TIME_OPTIONS = [
  "ASAP",
  "Today afternoon",
  "Today evening",
  "Tomorrow morning",
  "Tomorrow evening",
  "Anytime",
];

function CallbackForm({ user, role, profile, path, onSubmitted, onCancel }) {
  const supabase = createClient();
  const [phone, setPhone] = useState(
    profile?.contact_phone || profile?.phone || user?.phone || ""
  );
  const [time, setTime] = useState("ASAP");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const topicLabel = path.length > 0 ? findPath(path[0]) : "General";
  const topicPath = path.join(" > ");

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("Please sign in first.");
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number.");
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
        phone: phone.replace(/\D/g, "").slice(-10),
        notes: notes.trim(),
      });
      if (dbErr) throw new Error(dbErr.message);
      setDone(true);
      // Brief delay so the user sees the success state before the form
      // collapses back into the chat thread.
      setTimeout(() => onSubmitted?.(), 600);
    } catch (e) {
      setError(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-black text-emerald-700">Callback requested</p>
          <p className="text-[11px] text-emerald-600">We'll call {phone} {time.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          Phone
        </p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile"
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          Best time to call
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                time === t
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-pink-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
          Anything we should know? (optional)
        </p>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's the issue?"
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
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? "Sending…" : "Request callback"}
        </button>
      </div>
    </div>
  );
}

function greeting(profile) {
  const name = profile?.full_name?.split(" ")[0] || profile?.username || "there";
  return `Hi ${name}! 👋 What can I help you with today?`;
}
