"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  { icon: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z', bg: '#F3EEFD', fg: '#8B5CF6', title: 'AI Creator Discovery', desc: 'Natural-language search across 200K+ verified profiles, ranked by real audience fit.' },
  { icon: 'M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z', bg: '#FBEAF4', fg: '#EC4899', title: 'Campaign Autopilot', desc: 'Briefs, approvals, and workflows run themselves from one dashboard.' },
  { icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z', bg: '#EEF2FE', fg: '#6366F1', title: 'AI Content Suite', desc: 'Captions, hooks, and hashtags generated to match your brand voice.' },
  { icon: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9.2 12l2 2 3.6-4', bg: '#ECFDF5', fg: '#10B981', title: 'Fraud Protection', desc: 'Every profile audited by AI and humans. Fake followers never reach your shortlist.' },
  { icon: 'M6 10V7a6 6 0 0112 0v3M5 10h14v10H5V10zM12 14v3', bg: '#F3EEFD', fg: '#8B5CF6', title: 'Escrow Payments', desc: 'Funds held safely, released on approval. E-signed contracts, 50+ currencies.' },
  { icon: 'M4 20v-6M9.3 20V4M14.7 20v-9M20 20V8', bg: '#FBEAF4', fg: '#EC4899', title: 'Live Analytics', desc: 'Real-time performance across Instagram, YouTube, and more — no vanity metrics.' },
];

const demoMatches = [
  { handle: '@glowbyaisha', pct: '97%', bg: 'linear-gradient(135deg, #8B5CF6, #A855F7)', initial: 'G', delay: '0.15s' },
  { handle: '@skinwithsana', pct: '94%', bg: 'linear-gradient(135deg, #EC4899, #F472B6)', initial: 'S', delay: '0.3s' },
  { handle: '@dermadiaries.in', pct: '91%', bg: 'linear-gradient(135deg, #7C3AED, #EC4899)', initial: 'D', delay: '0.45s' },
];

const demoTasks = [
  { label: 'Brief sent to 12 creators', tag: 'DONE', delay: '0.1s', bg: '#ECFDF5', fg: '#10B981', color: '#111827', tagBg: '#ECFDF5', tagFg: '#10B981' },
  { label: '8 accepted · rates agreed', tag: 'DONE', delay: '0.25s', bg: '#ECFDF5', fg: '#10B981', color: '#111827', tagBg: '#ECFDF5', tagFg: '#10B981' },
  { label: 'Contracts e-signed', tag: 'DONE', delay: '0.4s', bg: '#ECFDF5', fg: '#10B981', color: '#111827', tagBg: '#ECFDF5', tagFg: '#10B981' },
  { label: 'Content review', tag: 'IN PROGRESS', delay: '0.55s', bg: '#F3EEFD', fg: '#8B5CF6', color: '#6B7280', tagBg: '#F3EEFD', tagFg: '#8B5CF6' },
];

const demoTags = [
  { label: '#glassskin', delay: '0.15s' },
  { label: '#skincareroutine', delay: '0.25s' },
  { label: '#hydraglow', delay: '0.35s' },
  { label: '#7dayglow', delay: '0.45s' },
];

const demoAudit = [
  { label: 'Real followers', value: '98.2%', color: '#10B981', delay: '0.15s' },
  { label: 'Engagement authenticity', value: 'High', color: '#10B981', delay: '0.3s' },
  { label: 'Bot activity detected', value: 'None', color: '#10B981', delay: '0.45s' },
];

const demoEscrow = [
  { label: 'Funds secured in escrow', sub: 'Jul 8 · 10:42 AM', delay: '0.1s', bg: '#ECFDF5', fg: '#10B981', line: '#D1FAE5', color: '#111827' },
  { label: 'Content approved by brand', sub: 'Jul 12 · 3:15 PM', delay: '0.3s', bg: '#ECFDF5', fg: '#10B981', line: '#E4D9FB', color: '#111827' },
  { label: 'Payout released to creator', sub: 'Instant · UPI', delay: '0.5s', bg: '#F3EEFD', fg: '#8B5CF6', line: 'transparent', color: '#7C3AED' },
];

const demoBars = [
  { h: '34%', delay: '0.05s', bg: '#E4D9FB' },
  { h: '48%', delay: '0.12s', bg: '#E4D9FB' },
  { h: '42%', delay: '0.19s', bg: '#E4D9FB' },
  { h: '62%', delay: '0.26s', bg: '#D8B4FE' },
  { h: '55%', delay: '0.33s', bg: '#D8B4FE' },
  { h: '78%', delay: '0.4s', bg: 'linear-gradient(180deg, #A855F7, #EC4899)' },
  { h: '100%', delay: '0.47s', bg: 'linear-gradient(180deg, #8B5CF6, #EC4899)' },
];

export default function Platform() {
  const [activeFeature, setActiveFeature] = useState(0);

  const showF0 = activeFeature === 0;
  const showF1 = activeFeature === 1;
  const showF2 = activeFeature === 2;
  const showF3 = activeFeature === 3;
  const showF4 = activeFeature === 4;
  const showF5 = activeFeature === 5;

  return (
    <section id="features" data-screen-label="Platform" style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 40px 0', fontFamily: "'Manrope', sans-serif", scrollMarginTop: '80px' }}>
      <style>{`
        .platform-feature-row:hover { transform: translateX(3px); box-shadow: 0 8px 20px rgba(124,58,237,0.1); }
      `}</style>
      <div style={{ maxWidth: '640px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.12em', color: '#A855F7' }}>COMPLETE PLATFORM</div>
        <h2 style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.025em', margin: '14px 0 0', lineHeight: 1.12, fontFamily: "'Baloo 2','Manrope',sans-serif" }}>Everything in between, handled.</h2>
        <p style={{ fontSize: '15.5px', color: '#6B7280', lineHeight: 1.7, margin: '18px 0 0' }}>From discovery to payout — one intelligent workspace instead of spreadsheets, DMs, and chasing invoices. Click a feature to see it in action.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '32px', marginTop: '44px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FEATURES.map((f, i) => {
            const rowBg = activeFeature === i
              ? 'linear-gradient(95deg, #FAF7FE, #FEF5FA) padding-box, linear-gradient(135deg, #F472B6, #A855F7 50%, #7C3AED) border-box'
              : 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.4), rgba(168,85,247,0.2) 45%, rgba(124,58,237,0.4)) border-box';
            const chevOpacity = activeFeature === i ? 1 : 0;
            return (
              <div key={i} className="platform-feature-row" onClick={() => setActiveFeature(i)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '15px 18px', borderRadius: '18px', border: '1.5px solid transparent', background: rowBg, cursor: 'pointer', boxShadow: '0 3px 10px rgba(124,58,237,0.05)', transition: 'all 0.25s ease' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '14px', background: f.bg, display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.25s ease' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d={f.icon} stroke={f.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '15.5px', fontWeight: 800, letterSpacing: '-0.01em' }}>{f.title}</span>
                  <span style={{ display: 'block', fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5, marginTop: '2px' }}>{f.desc}</span>
                </span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: chevOpacity, transition: 'opacity 0.25s ease' }}><path d="M9 5l7 7-7 7" stroke="#A855F7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </div>
            );
          })}
        </div>

        {/* LIVE PREVIEW PANEL */}
        <div style={{ position: 'relative', borderRadius: '28px', background: 'linear-gradient(135deg, #F3EEFD, #FBEAF4)', padding: '34px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '480px' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', border: '24px solid rgba(168,85,247,0.1)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '-30px', width: '120px', height: '120px', background: 'rgba(236,72,153,0.08)', borderRadius: '32px', transform: 'rotate(18deg)', pointerEvents: 'none' }}></div>

          {/* 1: Discovery */}
          {showF0 && (
            <>
              <div style={{ position: 'absolute', top: '44px', left: '36px', width: '220px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#F3EEFD', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 5h16M7 12h10M10 19h4" stroke="#8B5CF6" strokeWidth="2.4" strokeLinecap="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Filters applied</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Beauty · Mumbai · Reels</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>AI</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', right: '40px', width: '216px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(4deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#FBEAF4', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="#EC4899"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>12 new matches</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>since yesterday</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>NEW</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F7FC', border: '1.5px solid #E4D9FB', borderRadius: '999px', padding: '10px 18px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"></path></svg>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>beauty creators · Mumbai · Reels</span>
                  </div>
                  {demoMatches.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 4px 0', animation: 'riseIn 0.5s ease both', animationDelay: m.delay }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: m.bg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px', color: '#FFFFFF' }}>{m.initial}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{m.handle}</div>
                        <div style={{ height: '4px', background: '#F1F0F5', borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}><div style={{ height: '100%', width: m.pct, background: 'linear-gradient(90deg, #8B5CF6, #EC4899)', borderRadius: '2px' }}></div></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#A855F7' }}>{m.pct}</span>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: '-14px', right: '-10px', background: '#111827', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, borderRadius: '999px', padding: '6px 14px', animation: 'floatA 4s ease-in-out infinite' }}>0.4s ⚡</div>
              </div>
            </>
          )}

          {/* 2: Autopilot */}
          {showF1 && (
            <>
              <div style={{ position: 'absolute', top: '44px', right: '36px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#F3EEFD', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.3 19a2 2 0 003.4 0" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>@dermadiaries.in</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Auto-reminder sent</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>AUTO</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', left: '40px', width: '228px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#ECFDF5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Contract e-signed</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>@skinwithsana · 2m ago</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>DONE</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '24px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: '14px' }}>CAMPAIGN · SERUM LAUNCH</div>
                {demoTasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid #F1F0F5', animation: 'riseIn 0.5s ease both', animationDelay: t.delay }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: t.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={t.fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: t.color }}>{t.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10.5px', fontWeight: 800, color: t.tagFg, background: t.tagBg, borderRadius: '999px', padding: '3px 10px' }}>{t.tag}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 3: Content */}
          {showF2 && (
            <>
              <div style={{ position: 'absolute', top: '44px', right: '36px', width: '232px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#FBEAF4', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="#EC4899"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Hook · variant B</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>POV: 7 days to glass skin</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#EC4899', background: '#FBEAF4', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>A/B</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', left: '40px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#F3EEFD', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>On-brand voice</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Tone: playful · approved</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>98%</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '24px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', color: '#A855F7', marginBottom: '14px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" fill="#A855F7"></path></svg>
                  GENERATED CAPTION
                </div>
                <p style={{ fontSize: '14px', color: '#111827', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>Glass skin, no filter needed ✨ 7 days with the new HydraGlow serum and the difference is real — swipe for my honest before &amp; after.</p>
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '14px' }}>
                  {demoTags.map((tag, i) => (
                    <span key={i} style={{ fontSize: '11.5px', fontWeight: 700, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '5px 12px', animation: 'riseIn 0.4s ease both', animationDelay: tag.delay }}>{tag.label}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF', background: 'linear-gradient(95deg, #8B5CF6, #EC4899)', borderRadius: '999px', padding: '9px 0' }}>Use caption</span>
                  <span style={{ textAlign: 'center', fontSize: '12.5px', fontWeight: 700, color: '#7C3AED', border: '1.5px solid #E4D9FB', borderRadius: '999px', padding: '9px 18px' }}>↻ Regenerate</span>
                </div>
              </div>
            </>
          )}

          {/* 4: Fraud */}
          {showF3 && (
            <>
              <div style={{ position: 'absolute', top: '44px', right: '36px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#FDF0F6', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#F43F5E" strokeWidth="2.6" strokeLinecap="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>@viral_bot_4u</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>62% fake followers</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#F43F5E', background: '#FDF0F6', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>BLOCKED</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', left: '40px', width: '232px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-4deg)', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spinSlow 1.2s linear infinite', flexShrink: 0 }}><circle cx="12" cy="12" r="8" stroke="#F1F0F5" strokeWidth="3"></circle><path d="M20 12a8 8 0 00-8-8" stroke="#A855F7" strokeWidth="3" strokeLinecap="round"></path></svg>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>@nextinqueue</span>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Auditing engagement…</span>
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>SCANNING</span>
                </div>
                <div style={{ height: '4px', background: '#F1F0F5', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #EC4899)', borderRadius: '2px', animation: 'reelProg 2.4s ease-in-out infinite' }}></div>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '24px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ width: '46px', height: '46px', borderRadius: '16px', background: '#ECFDF5', display: 'grid', placeItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="#10B981" strokeWidth="2" strokeLinejoin="round"></path><path d="M9.2 12l2 2 3.6-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </span>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>Audit complete</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>@glowbyaisha · scanned just now</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', borderRadius: '999px', padding: '5px 12px' }}>PASSED</span>
                </div>
                {demoAudit.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderTop: '1px solid #F1F0F5', marginTop: '4px', animation: 'riseIn 0.5s ease both', animationDelay: a.delay }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>{a.label}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: a.color }}>{a.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 5: Escrow */}
          {showF4 && (
            <>
              <div style={{ position: 'absolute', top: '44px', right: '36px', width: '228px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#EEF2FE', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7l-4-4zM14 3v4h4M9 13h6M9 17h4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Invoice #RG-2481</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>Auto-generated · GST ready</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#6366F1', background: '#EEF2FE', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>PDF</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', left: '40px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#ECFDF5', display: 'grid', placeItems: 'center', color: '#10B981', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>₹</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Payout scheduled</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>UPI · after approval</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>48 HRS</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '24px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', color: '#9CA3AF' }}>ESCROW · #RG-2481</span>
                  <span style={{ fontSize: '22px', fontWeight: 800 }}>₹45,000</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: '18px' }}>
                  {demoEscrow.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', animation: 'riseIn 0.5s ease both', animationDelay: e.delay }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: e.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={e.fg} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </span>
                        <span style={{ width: '2px', flex: 1, minHeight: '18px', background: e.line }}></span>
                      </div>
                      <div style={{ paddingBottom: '16px' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: e.color }}>{e.label}</div>
                        <div style={{ fontSize: '11.5px', color: '#9CA3AF', marginTop: '1px' }}>{e.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 6: Analytics */}
          {showF5 && (
            <>
              <div style={{ position: 'absolute', top: '44px', right: '36px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(5deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'riseIn 0.5s ease 0.15s both' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#F3EEFD', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>+18.2K followers</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>across 3 platforms</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', background: '#F3EEFD', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>7 DAYS</span>
              </div>
              <div style={{ position: 'absolute', bottom: '46px', left: '40px', width: '224px', background: '#FFFFFF', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 12px 30px rgba(17,24,39,0.09)', transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'floatB 6s ease-in-out infinite', zIndex: 2 }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '10px', background: '#ECFDF5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 1.6s infinite' }}></span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#111827' }}>1,284 watching now</span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>@glowbyaisha · live reel</span>
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', borderRadius: '999px', padding: '3px 8px', flexShrink: 0 }}>LIVE</span>
              </div>
              <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 20px 50px rgba(17,24,39,0.1)', padding: '24px', animation: 'riseIn 0.4s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', color: '#9CA3AF' }}>REACH · LAST 7 DAYS</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#10B981' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 1.6s infinite' }}></span>LIVE</span>
                </div>
                <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px' }}>2.4M <span style={{ fontSize: '13px', color: '#10B981' }}>▲ 32%</span></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px', marginTop: '18px' }}>
                  {demoBars.map((b, i) => (
                    <div key={i} style={{ flex: 1, height: b.h, background: b.bg, borderRadius: '6px 6px 3px 3px', animation: 'growUp 0.7s ease both', animationDelay: b.delay, transformOrigin: 'bottom' }}></div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, color: '#C9CDD6', marginTop: '8px' }}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
