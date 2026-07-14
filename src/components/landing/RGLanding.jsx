"use client";

// Redesigned marketing landing, imported from the "Recent Gossips Landing"
// Claude Design project and rebuilt as React to match the reference. Rendered
// inside the (home) layout (which provides the site Header + Footer), so this
// owns the hero → CTA sections. All primary CTAs route to /login.
//
// Section order mirrors the reference: Hero · AI prompt · Brands · Creator
// stories (reels) · Audiences toggle · Pain points · Platform · How it works ·
// Testimonials · Pricing · Comparison · Stats · Community · Mobile app · FAQ · CTA.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";
const DISPLAY = "'Baloo 2', 'Manrope', sans-serif";
const grad = (a, b, c) => `linear-gradient(95deg, ${a}, ${b}${c ? `, ${c}` : ""})`;
const clip = { WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const h2 = { fontFamily: DISPLAY, fontSize: "clamp(30px, 5vw, 42px)", fontWeight: 800, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.12 };
const eyebrow = (c) => ({ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", color: c });
const tag = { fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" };

const HERO_STATS = [
  { value: "50K+", label: "Verified creators" },
  { value: "2,800+", label: "Brands & agencies" },
  { value: "₹12Cr+", label: "Paid to creators" },
];
const BRANDS = ["Nykaa", "Mamaearth", "boAt", "SUGAR", "Wow Skin", "Plum", "The Souled Store", "Bewakoof", "Myntra", "CRED", "Groww", "Licious", "Noise", "Sleepy Owl"];
const CHIPS = [
  { label: "Beauty · Mumbai", dot: "#F472B6" },
  { label: "Tech · 50K+", dot: "#A855F7" },
  { label: "Fitness · Reels", dot: "#34D399" },
];
const RESULTS = [
  { initial: "A", handle: "@glowbyaisha", niche: "Beauty & skincare", followers: "128K", er: "6.4%", score: 96, bg: grad("#F472B6", "#A855F7") },
  { initial: "R", handle: "@riya.reels", niche: "Lifestyle · Mumbai", followers: "84K", er: "5.1%", score: 92, bg: grad("#8B5CF6", "#EC4899") },
  { initial: "K", handle: "@kabirshoots", niche: "Grooming & style", followers: "210K", er: "4.7%", score: 89, bg: grad("#60A5FA", "#A855F7") },
];

const REELS = [
  { initial: "A", handle: "@glowbyaisha", views: "2.4M views", bg: grad("#F472B6", "#A855F7") },
  { initial: "R", handle: "@riya.reels", views: "1.8M views", bg: grad("#8B5CF6", "#EC4899") },
  { initial: "K", handle: "@kabirshoots", views: "1.2M views", bg: grad("#60A5FA", "#7C3AED") },
  { initial: "M", handle: "@mealswithmaya", views: "3.1M views", bg: grad("#FB7185", "#F59E0B") },
  { initial: "D", handle: "@devfit", views: "980K views", bg: grad("#10B981", "#0EA5E9") },
  { initial: "S", handle: "@sana.styles", views: "2.0M views", bg: grad("#A855F7", "#EC4899") },
  { initial: "T", handle: "@techbytarun", views: "1.5M views", bg: grad("#6366F1", "#0EA5E9") },
  { initial: "P", handle: "@pritaplates", views: "870K views", bg: grad("#F59E0B", "#EC4899") },
];

const AUDIENCES = [
  {
    eyebrow: "FOR BRANDS", accent: "#7C3AED",
    title: "Launch a campaign before your coffee cools.",
    bg: "linear-gradient(120deg, #F3EEFD, #FBEAF4)", ctaBg: grad("#8B5CF6", "#A855F7"),
    cta: "I'm a brand — it's free", ctaNote: "No card. No commission. Just a 5% escrow fee.",
    points: [
      "Describe your campaign in one sentence — AI shortlists creators who actually fit.",
      "Escrow protects every rupee; funds release only when the work is approved.",
      "No agency markups, no month-long email threads, no guesswork.",
      "Track reach, engagement and ROI from one live dashboard.",
    ],
    chips: [["↗", "+245%", "ROI increase", "#ECFDF5", "#10B981"], ["✦", "50K+", "Active creators", "#F3EEFD", "#8B5CF6"]],
  },
  {
    eyebrow: "FOR INFLUENCERS", accent: "#EC4899",
    title: "Real deals. Paid on time. Every time.",
    bg: "linear-gradient(120deg, #FBEAF4, #FDF2F0)", ctaBg: "#111827",
    cta: "I'm a creator — from ₹99/mo", ctaNote: "14-day free trial · cancel anytime.",
    points: [
      "Get matched to brand deals in your niche, automatically.",
      "Escrow-backed payments — paid on time, every time.",
      "AI tools for captions, hashtags, scripts & rate cards.",
      "A verified media kit built from real Instagram data.",
    ],
    chips: [["₹", "₹45K", "Avg. monthly", "#ECFDF5", "#10B981"], ["★", "4.9", "Creator rating", "#F3EEFD", "#8B5CF6"]],
  },
];

const PAINS = [
  { title: "Weeks spent hunting creators", desc: "Endless DMs and spreadsheets just to find one fit.", fix: "AI shortlists perfect-fit creators in seconds." },
  { title: "30–40% agency commission", desc: "Middlemen take a huge cut of every single deal.", fix: "Zero commission — brands pay nothing to join." },
  { title: "Payments that never arrive", desc: "Chasing invoices for weeks after you deliver.", fix: "Escrow releases the moment work is approved." },
  { title: "No idea if followers are real", desc: "Fake engagement quietly burns your budget.", fix: "Every creator is fraud-audited before you spend." },
];

const ICONS = {
  search: "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  spark: "M12 3v18M3 12h18M6 6l12 12M18 6L6 18",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z",
  coin: "M12 3v18M8 7h5a3 3 0 010 6H8m8 0a3 3 0 01-3 3H8",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  users: "M17 20a5 5 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8",
  heart: "M12 21C7 16.5 3 13.2 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2 .9-1.2 2.4-2 4-2 2.8 0 5 2.4 5 5.3 0 3.9-4 7.2-9 11.7z",
  gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9 2 6.5 4 12 7 12 7zM12 7s3-5 5.5-3S12 7 12 7z",
  badge: "M12 2l2.4 2.4H18v3.6L20.4 12 18 14.4V18h-3.6L12 20.4 9.6 18H6v-3.6L3.6 12 6 9.6V6h3.6L12 2z",
};
const FEATURES = [
  { key: "discovery", title: "AI Discovery", desc: "Describe a campaign, get a ranked shortlist in seconds.", icon: ICONS.search, bg: "#F3EEFD", fg: "#A855F7" },
  { key: "autopilot", title: "Campaign Autopilot", desc: "Briefs, approvals and deliverables tracked automatically.", icon: ICONS.list, bg: "#EEF2FF", fg: "#6366F1" },
  { key: "content", title: "AI Content Studio", desc: "Captions, hashtags, hooks & scripts on tap.", icon: ICONS.spark, bg: "#FCE7F3", fg: "#EC4899" },
  { key: "fraud", title: "Fraud & Fake-follower Audit", desc: "Every creator screened before you spend a rupee.", icon: ICONS.shield, bg: "#ECFDF5", fg: "#10B981" },
  { key: "escrow", title: "Escrow Payments", desc: "Funds held safe; released only on approval.", icon: ICONS.coin, bg: "#FEF3C7", fg: "#D97706" },
  { key: "analytics", title: "Live Analytics", desc: "Reach, engagement and ROI, in real time.", icon: ICONS.chart, bg: "#E0F2FE", fg: "#0EA5E9" },
];
const STEPS = [
  { title: "Describe it", desc: "Tell the AI what you need in a single line.", badge: "~10 sec", icon: ICONS.spark },
  { title: "Match & invite", desc: "Review the ranked shortlist, invite your picks.", badge: "AI ranked", icon: ICONS.search },
  { title: "Create & approve", desc: "Briefs, drafts and revisions in one workspace.", badge: "No email", icon: ICONS.list },
  { title: "Escrow payout", desc: "Release payment once the work is live.", badge: "On approval", icon: ICONS.coin },
];
const TESTIMONIALS = [
  { quote: "We ran a serum launch with 12 creators in a week. The AI shortlist was scary accurate.", name: "Ananya Rao", role: "Brand Manager, Nykaa", initial: "A", bg: grad("#F472B6", "#A855F7") },
  { quote: "Got paid the day my reel went live. No chasing, no drama. This is how it should work.", name: "Kabir Shah", role: "@kabirshoots · 210K", initial: "K", bg: grad("#60A5FA", "#7C3AED") },
  { quote: "Escrow gave our finance team the confidence to scale creator spend 4×.", name: "Rohit Menon", role: "Growth, boAt", initial: "R", bg: grad("#8B5CF6", "#EC4899") },
  { quote: "The media kit alone landed me three brand deals in my first month.", name: "Riya Kapoor", role: "@riya.reels · 84K", initial: "R", bg: grad("#FB7185", "#F59E0B") },
  { quote: "Fraud screening saved us from two fake-follower accounts before we spent a rupee.", name: "Neha Gupta", role: "Marketing, Plum", initial: "N", bg: grad("#10B981", "#0EA5E9") },
  { quote: "From prompt to live campaign in an afternoon. My agency used to take three weeks.", name: "Vikram Sethi", role: "Founder, D2C brand", initial: "V", bg: grad("#A855F7", "#EC4899") },
];
const COMPARISONS = [
  { label: "Time to launch", agency: "2–3 weeks", others: "3–5 days", rg: "10 minutes" },
  { label: "Commission", agency: "30–40%", others: "15–20%", rg: "0% for brands" },
  { label: "Creator matching", agency: "Manual", others: "Basic filters", rg: "AI-ranked" },
  { label: "Fraud screening", agency: "None", others: "Paid add-on", rg: "Built-in" },
  { label: "Payment protection", agency: "Invoices", others: "Partial", rg: "Full escrow" },
  { label: "AI content tools", agency: "—", others: "—", rg: "Included" },
  { label: "Real-time analytics", agency: "PDF reports", others: "Delayed", rg: "Live" },
];
const STATS = [
  { display: "50K+", label: "Verified creators" },
  { display: "2,800+", label: "Brands & agencies" },
  { display: "₹12Cr+", label: "Paid to creators" },
  { display: "96%", label: "Match satisfaction" },
  { display: "10 min", label: "Avg. launch time" },
  { display: "4.9★", label: "Creator rating" },
];
const COMMUNITY = [
  { title: "Creator masterclasses", desc: "Free workshops on growth, rate cards and closing brand deals.", icon: ICONS.spark, fg: "#A855F7", bg: "#F3EEFD" },
  { title: "Priority support", desc: "Real humans, replies within hours — not bots, not days.", icon: ICONS.heart, fg: "#EC4899", bg: "#FCE7F3" },
  { title: "Refer & earn", desc: "Invite creators you rate and earn reward credits on every join.", icon: ICONS.gift, fg: "#D97706", bg: "#FEF3C7" },
  { title: "Verified badge", desc: "Stand out to brands with a trust-verified creator profile.", icon: ICONS.badge, fg: "#10B981", bg: "#ECFDF5" },
];
const FAQS = [
  { q: "How does the AI matching actually work?", a: "Describe your campaign in plain English and our engine ranks 50,000+ verified creators by audience fit, engagement quality and niche — in seconds. You review the shortlist and invite your picks." },
  { q: "Is it really free for brands?", a: "Yes. Brands join and run campaigns with zero commission. We only charge a 5% escrow fee on the payout when work is approved." },
  { q: "How do creators get paid?", a: "Every deal is escrow-protected. The brand funds escrow up front, and the payout releases automatically the moment the deliverable is approved — usually within days, never weeks." },
  { q: "What does it cost creators?", a: "Plans start at ₹99/mo (Starter), ₹299/mo (Pro) and ₹599/mo (Elite), each with a 14-day free trial. Cancel anytime." },
  { q: "How do you stop fake followers?", a: "Every creator is fraud-audited before a brand can spend — real-follower ratio, engagement authenticity and audience overlap are all screened automatically." },
  { q: "Do you support barter / gifting campaigns?", a: "Yes — paid, barter and hybrid campaigns are all supported, with the same escrow and approval flow." },
];

const KEYFRAMES = `
@keyframes rg-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes rg-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.9); opacity: 0.35 } }
@keyframes rg-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes rg-floatA { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes rg-floatB { 0%,100% { transform: translateY(0) } 50% { transform: translateY(10px) } }
@keyframes rg-spin { to { transform: rotate(360deg) } }
@keyframes rg-reel { 0% { transform: translateX(-100%) } 100% { transform: translateX(0) } }
@keyframes rg-eq { 0%,100% { transform: scaleY(0.3) } 50% { transform: scaleY(1) } }
`;

export default function RGLanding() {
  const [prompt, setPrompt] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [picked, setPicked] = useState({});
  const [feature, setFeature] = useState(0);
  const [step, setStep] = useState(0);
  const [aud, setAud] = useState(0);
  const [reel, setReel] = useState(null);
  const [fixed, setFixed] = useState({});
  const [faq, setFaq] = useState(0);
  const timer = useRef(null);
  const stepPaused = useRef(false);

  useEffect(() => () => clearInterval(timer.current), []);

  // How-it-works auto-advances every 2.6s until the user clicks a step.
  useEffect(() => {
    const id = setInterval(() => {
      if (!stepPaused.current) setStep((s) => (s + 1) % STEPS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);
  const selectStep = (i) => { stepPaused.current = true; setStep(i); };

  const runMatch = () => {
    clearInterval(timer.current);
    setShowResults(false);
    setPicked({});
    setScanning(true);
    setScanPct(0);
    let p = 0;
    timer.current = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(timer.current);
        setScanPct(100);
        setTimeout(() => { setScanning(false); setShowResults(true); }, 350);
      }
      setScanPct(Math.min(100, Math.round(p)));
    }, 260);
  };

  const shortlistCount = Object.values(picked).filter(Boolean).length;
  const fixedCount = Object.values(fixed).filter(Boolean).length;
  const scanText = scanPct < 40 ? "Scanning 50,000+ verified creators…" : scanPct < 80 ? "Ranking by audience fit & engagement…" : "Finalising your shortlist…";
  const A = AUDIENCES[aud];

  return (
    <div style={{ fontFamily: FONT, width: "100%", background: "#FFFFFF", overflowX: "hidden", color: "#111827" }}>
      <style>{KEYFRAMES}</style>

      {/* HERO */}
      <section style={{ position: "relative", background: "linear-gradient(180deg, #F8F7FC, #FFFFFF)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -100, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.14), rgba(168,85,247,0))", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.12), rgba(244,114,182,0))", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px 96px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#7C3AED", background: "#F3EEFD", border: "1px solid #E4D9FB", borderRadius: 999, padding: "8px 18px", animation: "rg-rise 0.6s ease both" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#A855F7", animation: "rg-pulse 1.8s infinite" }} />
            Now live: AI-powered influencer matching
          </div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: "clamp(38px, 6vw, 64px)", lineHeight: 1.06, letterSpacing: "-0.03em", fontWeight: 800, margin: "26px 0 0", maxWidth: 880, animation: "rg-rise 0.6s ease 0.08s both" }}>
            Where Global Brands Meet{" "}
            <span style={{ backgroundImage: grad("#7C3AED", "#A855F7 60%", "#EC4899"), ...clip }}>The Right Creators.</span>
          </h1>
          <p style={{ fontSize: 17.5, color: "#6B7280", lineHeight: 1.7, maxWidth: 560, margin: "20px auto 0", animation: "rg-rise 0.6s ease 0.16s both" }}>
            Describe your campaign in a sentence — our AI matches you with verified creators who actually fit. Escrow-protected payments, no agencies, no guesswork.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 36, flexWrap: "wrap", animation: "rg-rise 0.6s ease 0.32s both" }}>
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 800, backgroundImage: grad("#7C3AED", "#EC4899"), ...clip }}>{s.value}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#9CA3AF", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI PROMPT */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "8px 24px 48px" }}>
        <div style={{ position: "relative", background: "linear-gradient(120deg, #1E1B2E, #2D2350)", borderRadius: 32, padding: "clamp(24px, 4vw, 44px)", color: "#FFFFFF", overflow: "hidden", marginTop: -64, boxShadow: "0 30px 80px rgba(45,35,80,0.45)", animation: "rg-rise 0.7s ease 0.24s both" }}>
          <div style={{ position: "absolute", top: -90, right: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35), rgba(168,85,247,0))", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, letterSpacing: "0.12em" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="url(#sg)" /><defs><linearGradient id="sg" x1="4" y1="2" x2="20" y2="18"><stop stopColor="#C4B5FD" /><stop offset="1" stopColor="#F472B6" /></linearGradient></defs></svg>
              <span style={{ backgroundImage: grad("#C4B5FD", "#F9A8D4"), ...clip }}>ASK THE MATCHING ENGINE</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "6px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34D399", animation: "rg-pulse 1.6s infinite" }} />1,284 creators online
            </span>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.08)", border: `1px solid ${prompt ? "rgba(249,168,212,0.5)" : "rgba(255,255,255,0.14)"}`, borderRadius: 999, padding: "8px 8px 8px 22px", transition: "border-color 0.3s ease" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.55 }}><circle cx="11" cy="11" r="7" stroke="#FFF" strokeWidth="2" /><path d="M20 20l-3.5-3.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" /></svg>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runMatch()} placeholder="Try: “Launch our serum with beauty creators in Mumbai…”" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: FONT, fontSize: 16, color: "#FFFFFF", padding: "12px 0" }} />
            <button onClick={runMatch} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 9, background: grad("#8B5CF6", "#EC4899"), color: "#FFF", border: "none", borderRadius: 999, padding: "14px 22px", fontFamily: FONT, fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 20px rgba(139,92,246,0.4)" }}>
              Match creators<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12h16m0 0l-6-6m6 6l-6 6" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {CHIPS.map((c) => (
              <button key={c.label} onClick={() => setPrompt(`Find ${c.label} creators`)} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.7)", background: "transparent", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "7px 15px", cursor: "pointer" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />{c.label}
              </button>
            ))}
          </div>
          {scanning && (
            <div style={{ position: "relative", marginTop: 26, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "22px 24px", animation: "rg-rise 0.3s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ animation: "rg-spin 1.2s linear infinite" }}><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.15)" strokeWidth="3" /><path d="M21 12a9 9 0 00-9-9" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" /></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{scanText}</div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}><div style={{ height: "100%", width: `${scanPct}%`, background: grad("#8B5CF6", "#EC4899"), borderRadius: 3, transition: "width 0.45s ease" }} /></div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#F9A8D4" }}>{scanPct}%</span>
              </div>
            </div>
          )}
          {showResults && (
            <div style={{ position: "relative", marginTop: 26, animation: "rg-rise 0.4s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)" }}>3 PERFECT-FIT CREATORS FOUND</span>
                <button onClick={runMatch} style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", background: "transparent", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 13px", cursor: "pointer" }}>↻ Re-run</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {RESULTS.map((r, i) => (
                  <div key={r.handle} onClick={() => setPicked((p) => ({ ...p, [i]: !p[i] }))} style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${picked[i] ? "rgba(52,211,153,0.6)" : "rgba(255,255,255,0.1)"}`, borderRadius: 18, padding: 18, cursor: "pointer", transition: "border-color 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: r.bg, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16, color: "#FFF" }}>{r.initial}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>{r.handle}</div>
                        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{r.niche}</div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, background: picked[i] ? "#34D399" : "rgba(255,255,255,0.12)", color: picked[i] ? "#062E22" : "#FFF", border: "1px solid rgba(255,255,255,0.25)" }}>{picked[i] ? "✓" : "+"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}><span>👥 {r.followers}</span><span>❤ {r.er} ER</span></div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, marginBottom: 6 }}><span style={{ color: "rgba(255,255,255,0.45)" }}>AUDIENCE FIT</span><span style={{ backgroundImage: grad("#C4B5FD", "#F9A8D4"), ...clip }}>{r.score}%</span></div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${r.score}%`, background: grad("#8B5CF6", "#EC4899"), borderRadius: 3, transition: "width 0.8s ease" }} /></div>
                    </div>
                  </div>
                ))}
              </div>
              {shortlistCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 16, padding: "13px 20px", flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#A7F3D0" }}>{shortlistCount} creator{shortlistCount > 1 ? "s" : ""} shortlisted</span>
                  <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 800, color: "#FFF", background: grad("#10B981", "#34D399"), borderRadius: 999, padding: "9px 20px" }}>Invite to campaign →</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BRANDS MARQUEE */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px" }}>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", color: "#9CA3AF", marginBottom: 20 }}>TRUSTED BY LEADING GLOBAL BRANDS</div>
        <div style={{ overflow: "hidden", position: "relative", maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}>
          <div style={{ display: "flex", width: "max-content", gap: 56, alignItems: "center", animation: "rg-marquee 26s linear infinite" }}>
            {[...BRANDS, ...BRANDS].map((b, i) => (<span key={i} style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, color: "#C9CDD6", whiteSpace: "nowrap" }}>{b}</span>))}
          </div>
        </div>
      </section>

      {/* CREATOR STORIES (REELS) */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={h2}>Reels people couldn&apos;t scroll past.</h2>
          <span style={tag}>TOP CREATOR STORIES · TAP TO EXPAND</span>
        </div>
        <div className="rg-reels" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 14, marginTop: 40 }}>
          {REELS.map((r, i) => (
            <button key={r.handle} onClick={() => setReel(i)} style={{ position: "relative", aspectRatio: "9 / 16", borderRadius: 18, overflow: "hidden", background: r.bg, cursor: "pointer", border: "none", padding: 0, boxShadow: "0 10px 30px rgba(124,58,237,0.12)" }}>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-52%, -60%)", fontFamily: DISPLAY, fontSize: 56, fontWeight: 800, color: "rgba(255,255,255,0.16)" }}>{r.initial}</span>
              <span style={{ position: "absolute", top: 10, left: 10, right: 10, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 2, overflow: "hidden" }}><span style={{ display: "block", height: "100%", background: "#FFF", animation: `rg-reel 6s linear infinite`, animationDelay: `${i * 0.4}s` }} /></span>
              <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 8px 8px", background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.72))", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ minWidth: 0, textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.handle}</span>
                  <span style={{ display: "block", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{r.views}</span>
                </span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 2, height: 12, flexShrink: 0 }}>
                  {[0, 0.2, 0.4].map((d) => (<span key={d} style={{ width: 3, height: "100%", background: "#F9A8D4", borderRadius: 1, animation: `rg-eq 0.8s ease-in-out ${d}s infinite`, transformOrigin: "bottom" }} />))}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {reel !== null && (
        <div onClick={() => setReel(null)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(30,27,46,0.72)", backdropFilter: "blur(10px)", display: "grid", placeItems: "center", padding: 24, animation: "rg-rise 0.25s ease both" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(360px, 86vw, 62vh)", aspectRatio: "9 / 16", borderRadius: 28, overflow: "hidden", background: REELS[reel].bg, boxShadow: "0 40px 100px rgba(0,0,0,0.5)", animation: "rg-rise 0.3s ease both" }}>
            <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-52%, -60%)", fontFamily: DISPLAY, fontSize: 150, fontWeight: 800, color: "rgba(255,255,255,0.16)" }}>{REELS[reel].initial}</span>
            <button onClick={() => setReel(null)} style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#FFF" strokeWidth="2.6" strokeLinecap="round" /></svg>
            </button>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 18px 18px", background: "linear-gradient(180deg, rgba(30,27,46,0), rgba(30,27,46,0.8))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "1.5px solid rgba(255,255,255,0.5)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "#FFF" }}>{REELS[reel].initial}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: "#FFF" }}>{REELS[reel].handle}</span>
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{REELS[reel].views} · via RGossips campaign</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIENCES TOGGLE */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ position: "relative", background: A.bg, borderRadius: 28, padding: "clamp(28px, 4vw, 52px)", overflow: "hidden", transition: "background 0.5s ease" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 190, height: 190, borderRadius: "50%", border: "22px solid rgba(168,85,247,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", border: "1.5px dashed #EC4899", opacity: 0.4, animation: "rg-spin 30s linear infinite", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF", borderRadius: 999, padding: 5, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
              <button onClick={() => setAud(0)} style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13.5, fontWeight: 800, padding: "10px 22px", borderRadius: 999, background: aud === 0 ? grad("#8B5CF6", "#A855F7") : "transparent", color: aud === 0 ? "#FFF" : "#6B7280", transition: "all 0.25s ease" }}>For Brands <span style={{ fontSize: 9.5, fontWeight: 800, background: "#10B981", color: "#FFF", borderRadius: 999, padding: "3px 9px" }}>FREE</span></button>
              <button onClick={() => setAud(1)} style={{ border: "none", cursor: "pointer", fontFamily: FONT, fontSize: 13.5, fontWeight: 800, padding: "10px 22px", borderRadius: 999, background: aud === 1 ? grad("#EC4899", "#F472B6") : "transparent", color: aud === 1 ? "#FFF" : "#6B7280", transition: "all 0.25s ease" }}>For Influencers</button>
            </div>
          </div>
          <div className="rg-aud-grid" style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 48, alignItems: "center", marginTop: 34 }}>
            <div>
              <div style={eyebrow(A.accent)}>{A.eyebrow}</div>
              <h3 style={{ fontFamily: DISPLAY, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "14px 0 0", lineHeight: 1.15 }}>{A.title}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
                {A.points.map((p) => (<div key={p} style={{ display: "flex", gap: 12, fontSize: 14.5, color: "#4B5563", lineHeight: 1.55, fontWeight: 500 }}><span style={{ color: A.accent }}>✦</span>{p}</div>))}
              </div>
              <Link href="/login" style={{ display: "inline-block", marginTop: 28, background: A.ctaBg, color: "#FFF", padding: "14px 28px", borderRadius: 999, fontWeight: 800, fontSize: 14, boxShadow: "0 8px 20px rgba(139,92,246,0.3)" }}>{A.cta}</Link>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginTop: 12 }}>{A.ctaNote}</div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -14, borderRadius: 32, background: "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(236,72,153,0.12))", transform: "rotate(-2deg)", pointerEvents: "none" }} />
              <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", background: "linear-gradient(160deg, #2D2350, #1E1B2E)", minHeight: 340, padding: 24, color: "#FFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: grad("#F472B6", "#A855F7"), display: "grid", placeItems: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 20 }}>A</div>
                  <div><div style={{ fontWeight: 800, fontSize: 15 }}>@glowbyaisha</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Beauty &amp; skincare · Mumbai</div></div>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#A7F3D0", background: "rgba(52,211,153,0.15)", borderRadius: 999, padding: "4px 10px" }}>VERIFIED</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 20 }}>
                  {[["128K", "Followers"], ["6.4%", "Eng. rate"], ["4.9", "Rating"]].map(([v, l]) => (<div key={l} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 18 }}>{v}</div><div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{l}</div></div>))}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>{["#skincare", "#reels", "#mumbai"].map((t) => (<span key={t} style={{ fontSize: 11, fontWeight: 700, color: "#F9A8D4", background: "rgba(249,168,212,0.12)", borderRadius: 999, padding: "5px 12px" }}>{t}</span>))}</div>
                <div style={{ marginTop: 18, height: 62, borderRadius: 12, background: "linear-gradient(90deg, rgba(139,92,246,0.25), rgba(236,72,153,0.2))", display: "grid", placeItems: "center", fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Live media kit</div>
              </div>
              {A.chips.map((c, i) => (
                <div key={i} style={{ position: "absolute", ...(i === 0 ? { top: 24, left: -22 } : { bottom: 30, right: -18 }), background: "#FFF", borderRadius: 16, padding: "12px 18px", boxShadow: "0 16px 40px rgba(17,24,39,0.12)", display: "flex", alignItems: "center", gap: 12, animation: `${i === 0 ? "rg-floatA 5s" : "rg-floatB 6s"} ease-in-out infinite` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: c[3], display: "grid", placeItems: "center", color: c[4], fontSize: 16, fontWeight: 800 }}>{c[0]}</div>
                  <div><div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{c[1]}</div><div style={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>{c[2]}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
          <div style={eyebrow("#EC4899")}>THE OLD WAY</div>
          <h2 style={{ ...h2, margin: "14px 0 0" }}>Influencer marketing shouldn&apos;t feel this hard.</h2>
          <p style={{ fontSize: 15.5, color: "#6B7280", lineHeight: 1.7, margin: "18px 0 0" }}>Weeks of hunting. 30–40% agency commissions. Payments that never arrive. Here&apos;s what we set out to kill — tap a card to fix it.</p>
        </div>
        <div className="rg-4grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 44 }}>
          {PAINS.map((p, i) => {
            const on = !!fixed[i];
            return (
              <div key={p.title} onClick={() => setFixed((f) => ({ ...f, [i]: !f[i] }))} style={{ position: "relative", background: on ? "#F5FBF8" : "#FFF", border: `1.5px solid ${on ? "#B6E9D2" : "#F1E9FB"}`, borderRadius: 20, padding: "26px 24px 56px", cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden", boxShadow: "0 5px 16px rgba(124,58,237,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 14, background: on ? grad("#10B981", "#34D399") : "#FEE2E2", color: on ? "#FFF" : "#EF4444", display: "grid", placeItems: "center", transition: "all 0.3s ease" }}>
                    {on ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#FFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4L3 19.5h18L12 4z" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round" /><path d="M12 10v4M12 16.8h.01" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" /></svg>}
                  </span>
                  {on && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em", color: "#FFF", background: grad("#10B981", "#34D399"), borderRadius: 999, padding: "4px 10px", animation: "rg-rise 0.3s ease both" }}>FIXED</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", marginTop: 16, lineHeight: 1.3, textDecoration: on ? "line-through" : "none", color: on ? "#9CA3AF" : "#111827", transition: "all 0.3s ease" }}>{p.title}</div>
                <p style={{ fontSize: 13, color: on ? "#059669" : "#6B7280", fontWeight: on ? 600 : 400, lineHeight: 1.65, margin: "8px 0 0" }}>{on ? p.fix : p.desc}</p>
                <span style={{ position: "absolute", left: 24, right: 24, bottom: 20, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: on ? "#10B981" : "#EC4899" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#10B981" : "#EC4899", animation: "rg-pulse 1.8s infinite" }} />{on ? "RGOSSIPS FIXED IT" : "TAP TO FIX"}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 30, fontSize: 14, fontWeight: 800 }}>
          <span style={{ backgroundImage: grad("#7C3AED", "#EC4899"), ...clip }}>{fixedCount === 4 ? "Every pain point — solved. That's RGossips." : `${fixedCount} of 4 fixed`}</span>
          {fixedCount === 4 && <button onClick={() => setFixed({})} style={{ marginLeft: 14, border: "1.5px solid #E4D9FB", background: "transparent", cursor: "pointer", fontFamily: FONT, fontSize: 11.5, fontWeight: 800, color: "#7C3AED", borderRadius: 999, padding: "6px 14px" }}>↻ Break it again</button>}
        </div>
      </section>

      {/* PLATFORM / FEATURES */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px" }}>
        <div style={{ maxWidth: 640 }}>
          <div style={eyebrow("#A855F7")}>COMPLETE PLATFORM</div>
          <h2 style={{ ...h2, margin: "14px 0 0" }}>Everything in between, handled.</h2>
          <p style={{ fontSize: 15.5, color: "#6B7280", lineHeight: 1.7, margin: "18px 0 0" }}>From discovery to payout — one intelligent workspace instead of spreadsheets, DMs and chasing invoices. Click a feature to see it in action.</p>
        </div>
        <div className="rg-feat-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 32, marginTop: 44, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FEATURES.map((f, i) => (
              <div key={f.key} onClick={() => setFeature(i)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 18px", borderRadius: 18, border: `1.5px solid ${feature === i ? "#E4D9FB" : "transparent"}`, background: feature === i ? "#FFF" : "transparent", boxShadow: feature === i ? "0 10px 30px rgba(17,24,39,0.06)" : "none", cursor: "pointer", transition: "all 0.25s ease" }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: f.bg, display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={f.icon} stroke={f.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em" }}>{f.title}</span><span style={{ display: "block", fontSize: 12.5, color: "#6B7280", lineHeight: 1.5, marginTop: 2 }}>{f.desc}</span></span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: feature === i ? 1 : 0.25 }}><path d="M9 5l7 7-7 7" stroke="#A855F7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            ))}
          </div>
          <div style={{ position: "relative", borderRadius: 28, background: "linear-gradient(135deg, #F3EEFD, #FBEAF4)", padding: 34, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420 }}>
            <FeaturePreview index={feature} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 88px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={h2}>From prompt to payout.</h2>
          <span style={tag}>FOUR STEPS · TEN MINUTES</span>
        </div>
        <div style={{ position: "relative", height: 6, background: "#F1F0F5", borderRadius: 3, marginTop: 48, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step + 1) / STEPS.length) * 100}%`, background: grad("#8B5CF6", "#EC4899"), borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <div className="rg-4grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
          {STEPS.map((s, i) => {
            const on = step === i;
            return (
              <div key={s.title} onClick={() => selectStep(i)} style={{ position: "relative", border: `1.5px solid ${on ? "#D8B4FE" : "#EDECF2"}`, background: on ? "#FFF" : "#FAFAFC", borderRadius: 20, padding: 22, cursor: "pointer", transition: "all 0.3s ease", transform: on ? "translateY(-4px)" : "none", boxShadow: on ? "0 16px 40px rgba(139,92,246,0.12)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ width: 40, height: 40, borderRadius: 14, background: on ? grad("#8B5CF6", "#EC4899") : "#F3EEFD", display: "grid", placeItems: "center" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d={s.icon} stroke={on ? "#FFF" : "#A855F7"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: on ? "#A855F7" : "#C9CDD6" }}>STEP {i + 1}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 16, letterSpacing: "-0.01em" }}>{s.title}</div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "7px 0 0" }}>{s.desc}</p>
                <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, color: on ? "#FFF" : "#7C3AED", display: "inline-flex", alignItems: "center", gap: 6, background: on ? grad("#8B5CF6", "#EC4899") : "#F3EEFD", borderRadius: 999, padding: "5px 12px", transition: "all 0.3s ease" }}>{s.badge}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "88px 0 0", overflow: "hidden" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={h2}>Loved on both sides of the deal.</h2>
          <span style={tag}>WALL OF LOVE</span>
        </div>
        <div style={{ overflow: "hidden", position: "relative", marginTop: 44, maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)" }}>
          <div className="rg-tmarquee" style={{ display: "flex", width: "max-content", gap: 20, padding: "6px 0 6px 20px", animation: "rg-marquee 48s linear infinite" }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <div key={i} style={{ width: 360, background: "#FFF", border: "1.5px solid #F1E9FB", borderRadius: 22, padding: 28, boxShadow: "0 5px 16px rgba(124,58,237,0.07)" }}>
                <div style={{ fontSize: 13, letterSpacing: "0.18em", color: "#A855F7", fontWeight: 800 }}>★★★★★</div>
                <p style={{ fontSize: 15, color: "#111827", lineHeight: 1.7, fontWeight: 600, margin: "14px 0 0" }}>“{t.quote}”</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
                  <span style={{ width: 38, height: 38, borderRadius: "50%", background: t.bg, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "#FFF" }}>{t.initial}</span>
                  <span><span style={{ display: "block", fontSize: 14, fontWeight: 800 }}>{t.name}</span><span style={{ display: "block", fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{t.role}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: "linear-gradient(180deg, #F8F7FC, #FFFFFF)", marginTop: 88 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <h2 style={h2}>Simple, transparent pricing.</h2>
            <span style={{ fontSize: 15, color: "#6B7280", fontWeight: 600 }}>Creators pay a little. Brands pay nothing — ever.</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 48, alignItems: "stretch" }}>
            <div style={{ position: "relative", background: "linear-gradient(120deg, #1E1B2E, #2D2350)", color: "#FFF", borderRadius: 28, padding: 44, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.35), rgba(168,85,247,0))", pointerEvents: "none" }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", color: "#C4B5FD" }}>PRO</span><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", background: grad("#8B5CF6", "#EC4899"), color: "#FFF", padding: "6px 14px", borderRadius: 999 }}>MOST POPULAR</span></div>
              <div style={{ position: "relative", marginTop: 18, display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontFamily: DISPLAY, fontSize: 58, fontWeight: 800, letterSpacing: "-0.03em" }}>₹299</span><span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>/mo</span></div>
              <p style={{ position: "relative", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: "12px 0 0" }}>Micro to mid-tier influencers (10K–200K) scaling brand deals.</p>
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", margin: "28px 0", flex: 1 }}>{["AI creator matching", "Unlimited applications", "AI content tools", "Verified media kit", "Priority in search", "Real-time analytics"].map((p) => (<div key={p} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}><span style={{ color: "#F9A8D4" }}>✓</span>{p}</div>))}</div>
              <Link href="/login" style={{ position: "relative", display: "block", textAlign: "center", padding: 15, borderRadius: 999, fontWeight: 800, fontSize: 14.5, background: grad("#8B5CF6", "#EC4899"), color: "#FFF", boxShadow: "0 10px 24px rgba(139,92,246,0.4)" }}>Start free trial</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[{ name: "STARTER", price: "₹99", who: "New creators (under 10K) starting out.", summary: "Core matching, a verified media kit and escrow payments to land your first deals.", cta: "Start free trial" }, { name: "ELITE", price: "₹599", who: "Established creators (200K+) & agencies.", summary: "Everything in Pro, plus homepage spotlight, top search placement and the Elite badge.", cta: "Go Elite" }].map((p) => (
                <div key={p.name} style={{ background: "#FFF", border: "1px solid #EDECF2", borderRadius: 24, padding: 30, flex: 1, display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(17,24,39,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.12em", color: "#A855F7" }}>{p.name}</span><span><span style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.price}</span><span style={{ fontSize: 13, color: "#9CA3AF" }}>/mo</span></span></div>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "10px 0 0" }}>{p.who}</p>
                  <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, margin: "14px 0", flex: 1 }}>{p.summary}</div>
                  <Link href="/login" style={{ display: "block", textAlign: "center", padding: 12, borderRadius: 999, fontWeight: 700, fontSize: 13.5, border: "1.5px solid #E4D9FB", color: "#7C3AED" }}>{p.cta}</Link>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFF", border: "1px solid #EDECF2", borderRadius: 20, padding: "22px 30px", boxShadow: "0 10px 30px rgba(17,24,39,0.05)", flexWrap: "wrap", gap: 12 }}>
            <div><span style={{ fontWeight: 800, fontSize: 16 }}>Brands join free.</span><span style={{ color: "#6B7280", fontSize: 14, marginLeft: 10 }}>No commission — just a 5% escrow fee on payouts.</span></div>
            <Link href="/login" style={{ fontWeight: 800, fontSize: 14, color: "#7C3AED" }}>Join as a brand →</Link>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={h2}>Agencies had a good run.</h2>
          <span style={tag}>WHY RGOSSIPS · SIDE BY SIDE</span>
        </div>
        <div style={{ marginTop: 40, background: "#FFF", border: "1.5px solid #F1E9FB", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(124,58,237,0.09)" }}>
          <div className="rg-cmp-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.15fr", padding: "18px 24px", borderBottom: "1px solid #F1F0F5", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF" }}>FEATURE</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF", textAlign: "center" }}>AGENCY</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "#9CA3AF", textAlign: "center" }}>OTHERS</span>
            <span style={{ textAlign: "center" }}><span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, letterSpacing: "0.12em", color: "#FFF", background: grad("#8B5CF6", "#EC4899"), borderRadius: 999, padding: "6px 16px" }}>RGOSSIPS</span></span>
          </div>
          {COMPARISONS.map((c) => (
            <div key={c.label} className="rg-cmp-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.15fr", padding: "15px 24px", borderBottom: "1px solid #F6F3FB", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{c.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#9CA3AF", textAlign: "center" }}>{c.agency}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#6B7280", textAlign: "center" }}>{c.others}</span>
              <span style={{ textAlign: "center" }}><span style={{ fontSize: 13.5, fontWeight: 800, backgroundImage: grad("#7C3AED", "#EC4899"), ...clip }}>✓ {c.rg}</span></span>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ position: "relative", background: "linear-gradient(120deg, #1E1B2E, #2D2350)", borderRadius: 28, padding: "46px 32px", color: "#FFF", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -90, right: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.3), rgba(168,85,247,0))", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -100, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.22), rgba(236,72,153,0))", pointerEvents: "none" }} />
          <div className="rg-stats" style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 20, textAlign: "center" }}>
            {STATS.map((s) => (<div key={s.label}><div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", backgroundImage: grad("#C4B5FD", "#F9A8D4"), ...clip }}>{s.display}</div><div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>{s.label}</div></div>))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={eyebrow("#A855F7")}>THE MOVEMENT</div>
          <h2 style={{ ...h2, margin: "14px 0 0" }}>More than a platform.</h2>
          <p style={{ fontSize: 15.5, color: "#6B7280", lineHeight: 1.7, margin: "18px 0 0" }}>Join India&apos;s fastest-growing creator community — the deals are just the start.</p>
        </div>
        <div className="rg-4grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 44 }}>
          {COMMUNITY.map((c) => (
            <div key={c.title} style={{ background: c.bg, borderRadius: 22, padding: "28px 24px" }}>
              <span style={{ width: 42, height: 42, borderRadius: 14, background: "#FFF", display: "grid", placeItems: "center", boxShadow: "0 6px 16px rgba(17,24,39,0.06)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={c.icon} stroke={c.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.01em", marginTop: 16 }}>{c.title}</div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, margin: "8px 0 0" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE APP */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 0" }}>
        <div className="rg-app-grid" style={{ position: "relative", background: "linear-gradient(120deg, #2D2350, #1E1B2E)", borderRadius: 32, padding: "clamp(32px, 5vw, 60px)", color: "#FFF", overflow: "hidden", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center" }}>
          <div style={{ position: "absolute", top: -80, left: "40%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.3), rgba(168,85,247,0))", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={eyebrow("#C4B5FD")}>ON THE GO</div>
            <h3 style={{ fontFamily: DISPLAY, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "14px 0 0", lineHeight: 1.12 }}>Run campaigns from the checkout line.</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "18px 0 0", maxWidth: 440 }}>Approve drafts, release escrow, chat with creators and track reach — the whole platform, in your pocket.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "24px 0 0" }}>
              {["Instant push when a draft lands", "One-tap escrow release", "Live campaign analytics"].map((t) => (<div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}><span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{t}</div>))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#FFF", color: "#111827", borderRadius: 14, padding: "10px 20px", fontWeight: 800, fontSize: 13 }}> App Store</Link>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#FFF", borderRadius: 14, padding: "10px 20px", fontWeight: 800, fontSize: 13 }}> Google Play</Link>
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 240, height: 420, borderRadius: 36, background: "linear-gradient(160deg, #0F0B1E, #241C3E)", border: "8px solid #14101F", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", padding: 16, animation: "rg-floatA 6s ease-in-out infinite" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: grad("#F472B6", "#A855F7") }} />
                <div><div style={{ fontSize: 11, fontWeight: 800 }}>Serum launch</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>3 creators live</div></div>
                <span style={{ marginLeft: "auto", fontSize: 8.5, fontWeight: 800, color: "#A7F3D0", background: "rgba(52,211,153,0.15)", borderRadius: 999, padding: "3px 8px" }}>ACTIVE</span>
              </div>
              {[["Draft approved", "#34D399"], ["Escrow released", "#F9A8D4"], ["Reel is live", "#C4B5FD"]].map(([l, c], i) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px", marginTop: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} /><span style={{ fontSize: 11, fontWeight: 600 }}>{l}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, borderRadius: 12, background: "linear-gradient(90deg, rgba(139,92,246,0.3), rgba(236,72,153,0.25))", padding: "14px 12px" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>REACH · TODAY</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, marginTop: 2 }}>842K <span style={{ fontSize: 10, color: "#34D399" }}>▲ 18%</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 920, margin: "0 auto", padding: "88px 24px 0" }}>
        <div style={{ textAlign: "center" }}>
          <div style={eyebrow("#A855F7")}>FAQ</div>
          <h2 style={{ ...h2, margin: "14px 0 0" }}>Questions, answered.</h2>
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((q, i) => {
            const on = faq === i;
            return (
              <div key={q.q} style={{ border: `1.5px solid ${on ? "#E4D9FB" : "#EFEDF4"}`, borderRadius: 18, background: on ? "#FBF9FE" : "#FFF", overflow: "hidden", boxShadow: "0 4px 14px rgba(124,58,237,0.06)" }}>
                <button onClick={() => setFaq(on ? -1 : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "19px 24px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT }}>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em" }}>{q.q}</span>
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: on ? grad("#8B5CF6", "#EC4899") : "#F3EEFD", display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.3s ease", transform: on ? "rotate(180deg)" : "none" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={on ? "#FFF" : "#A855F7"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                </button>
                <div style={{ maxHeight: on ? 240 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}><p style={{ padding: "0 56px 20px 24px", margin: 0, fontSize: 14, color: "#6B7280", lineHeight: 1.75 }}>{q.a}</p></div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 30, flexWrap: "wrap", fontSize: 13.5, fontWeight: 700 }}>
          <span style={{ color: "#6B7280", fontWeight: 600 }}>Still stuck? We reply within hours —</span>
          <a href="mailto:grievance@rgossips.com" style={{ color: "#7C3AED" }}>Email</a>
          <a href="https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146" style={{ color: "#7C3AED" }}>WhatsApp</a>
          <a href="https://www.instagram.com/rgossips.agency/" style={{ color: "#7C3AED" }}>@rgossips.agency</a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "88px 24px 90px" }}>
        <div style={{ position: "relative", background: grad("#7C3AED", "#A855F7 55%", "#EC4899"), borderRadius: 32, padding: "clamp(48px, 7vw, 76px) 40px", textAlign: "center", color: "#FFF", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, left: "8%", width: 150, height: 150, borderRadius: "50%", border: "20px solid rgba(255,255,255,0.12)", animation: "rg-floatA 7s ease-in-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, right: "8%", width: 90, height: 90, background: "rgba(255,255,255,0.1)", borderRadius: 26, transform: "rotate(18deg)", animation: "rg-floatB 6s ease-in-out infinite", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", fontFamily: DISPLAY, fontSize: "clamp(30px, 6vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.1 }}>Ready to transform your influencer marketing?</h2>
          <p style={{ position: "relative", fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "16px auto 0" }}>14-day free trial · No credit card · Cancel anytime</p>
          <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "#FFF", color: "#7C3AED", fontWeight: 800, padding: "16px 34px", borderRadius: 999, fontSize: 15 }}>Get started free</Link>
            <a href="mailto:grievance@rgossips.com?subject=Schedule%20a%20Demo" style={{ border: "1.5px solid rgba(255,255,255,0.5)", color: "#FFF", padding: "16px 34px", borderRadius: 999, fontSize: 15, fontWeight: 700 }}>Schedule a demo</a>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 1000px){ .rg-reels{ grid-template-columns: repeat(4, 1fr) !important } }
        @media (max-width: 860px){
          .rg-feat-grid, .rg-aud-grid, .rg-app-grid { grid-template-columns: 1fr !important }
          .rg-4grid { grid-template-columns: 1fr 1fr !important }
          .rg-stats { grid-template-columns: repeat(3, 1fr) !important }
          .rg-cmp-row { grid-template-columns: 1.4fr 1fr 1fr 1fr !important; font-size: 12px }
        }
        @media (max-width: 560px){ .rg-reels{ grid-template-columns: repeat(3, 1fr) !important } .rg-4grid{ grid-template-columns: 1fr !important } }
      `}</style>
    </div>
  );
}

function FeaturePreview({ index }) {
  const card = { position: "relative", width: "100%", maxWidth: 400, background: "#FFF", borderRadius: 20, boxShadow: "0 20px 50px rgba(17,24,39,0.1)", padding: 24, animation: "rg-rise 0.4s ease both" };
  if (index === 0) {
    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F8F7FC", border: "1.5px solid #E4D9FB", borderRadius: 999, padding: "10px 18px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>beauty creators · Mumbai · Reels</span>
        </div>
        {[{ i: "A", h: "@glowbyaisha", p: "96%", bg: grad("#F472B6", "#A855F7") }, { i: "R", h: "@riya.reels", p: "92%", bg: grad("#8B5CF6", "#EC4899") }, { i: "K", h: "@kabirshoots", p: "89%", bg: grad("#60A5FA", "#A855F7") }].map((m) => (
          <div key={m.h} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 4px 0" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: m.bg, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, color: "#FFF" }}>{m.i}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800 }}>{m.h}</div><div style={{ height: 4, background: "#F1F0F5", borderRadius: 2, marginTop: 5, overflow: "hidden" }}><div style={{ height: "100%", width: m.p, background: grad("#8B5CF6", "#EC4899"), borderRadius: 2 }} /></div></div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#A855F7" }}>{m.p}</span>
          </div>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div style={card}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 14 }}>CAMPAIGN · SERUM LAUNCH</div>
        {[{ l: "Brief sent to 3 creators", t: "AUTO", ok: true }, { l: "Drafts received & reviewed", t: "2/3", ok: true }, { l: "Revisions approved", t: "DONE", ok: true }, { l: "Deliverables scheduled", t: "LIVE", ok: false }].map((r) => (
          <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid #F1F0F5" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: r.ok ? "#ECFDF5" : "#F3EEFD", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={r.ok ? "#10B981" : "#A855F7"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#4B5563" }}>{r.l}</span>
            <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: r.ok ? "#10B981" : "#A855F7", background: r.ok ? "#ECFDF5" : "#F3EEFD", borderRadius: 999, padding: "3px 10px" }}>{r.t}</span>
          </div>
        ))}
      </div>
    );
  }
  if (index === 2) {
    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#A855F7", marginBottom: 14 }}>✦ GENERATED CAPTION</div>
        <p style={{ fontSize: 14, color: "#111827", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>Glass skin, no filter needed ✨ 7 days with the new HydraGlow serum and the difference is real — swipe for my honest before &amp; after.</p>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>{["#skincare", "#glassskin", "#serum", "#honestreview"].map((t) => (<span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: "#7C3AED", background: "#F3EEFD", borderRadius: 999, padding: "5px 12px" }}>{t}</span>))}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}><span style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 800, color: "#FFF", background: grad("#8B5CF6", "#EC4899"), borderRadius: 999, padding: "9px 0" }}>Use caption</span><span style={{ textAlign: "center", fontSize: 12.5, fontWeight: 700, color: "#7C3AED", border: "1.5px solid #E4D9FB", borderRadius: 999, padding: "9px 18px" }}>↻ Regenerate</span></div>
      </div>
    );
  }
  if (index === 3) {
    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 46, height: 46, borderRadius: 16, background: "#ECFDF5", display: "grid", placeItems: "center" }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" /></svg></span>
          <div><div style={{ fontSize: 15, fontWeight: 800 }}>Audit complete</div><div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>@glowbyaisha · scanned just now</div></div>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#10B981", background: "#ECFDF5", borderRadius: 999, padding: "5px 12px" }}>PASSED</span>
        </div>
        {[{ l: "Real followers", v: "97.4%" }, { l: "Engagement authenticity", v: "High" }, { l: "Audience overlap", v: "Low" }].map((a) => (
          <div key={a.l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: "1px solid #F1F0F5", marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#4B5563" }}>{a.l}</span><span style={{ fontSize: 12.5, fontWeight: 800, color: "#10B981" }}>{a.v}</span></div>
        ))}
      </div>
    );
  }
  if (index === 4) {
    return (
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#9CA3AF" }}>ESCROW · #RG-2481</span><span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800 }}>₹45,000</span></div>
        <div style={{ marginTop: 18 }}>
          {[{ l: "Brand funded escrow", s: "Secured · 2 days ago", ok: true }, { l: "Creator delivered content", s: "Approved by brand", ok: true }, { l: "Payout released", s: "Now processing", ok: false }].map((e, i, arr) => (
            <div key={e.l} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: e.ok ? "#ECFDF5" : "#F3EEFD", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={e.ok ? "#10B981" : "#A855F7"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{i < arr.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 18, background: "#F1F0F5" }} />}</div>
              <div style={{ paddingBottom: 16 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: e.ok ? "#111827" : "#A855F7" }}>{e.l}</div><div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 1 }}>{e.s}</div></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "#9CA3AF" }}>REACH · LAST 7 DAYS</span><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#10B981" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "rg-pulse 1.6s infinite" }} />LIVE</span></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, marginTop: 8 }}>2.4M <span style={{ fontSize: 13, color: "#10B981" }}>▲ 32%</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110, marginTop: 18 }}>{["48%", "62%", "40%", "78%", "90%", "70%", "100%"].map((ht, i) => (<div key={i} style={{ flex: 1, height: ht, background: i === 6 ? grad("#8B5CF6", "#EC4899") : "#EDE9FE", borderRadius: "6px 6px 3px 3px" }} />))}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700, color: "#C9CDD6", marginTop: 8 }}>{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <span key={d}>{d}</span>)}</div>
    </div>
  );
}
