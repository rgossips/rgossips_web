"use client";

import { useState } from "react";

const STEPS = [
  { title: 'Write your brief', desc: 'One sentence is enough — goals, budget, vibe.', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z', badge: '~30 seconds' },
  { title: 'Meet your matches', desc: 'AI shortlists verified creators ranked by fit.', icon: 'M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z', badge: '0.4s scan' },
  { title: 'Agree & sign', desc: 'Negotiate and e-sign in a single thread.', icon: 'M8 10h8M8 14h5M21 12a9 9 0 11-4.5-7.8', badge: 'One thread' },
  { title: 'Approve & pay', desc: 'Escrow releases payment when you approve.', icon: 'M6 10V7a6 6 0 0112 0v3M5 10h14v10H5V10zM9.5 15l2 2 3.5-4', badge: 'Escrow-safe' },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const stepPct = (((activeStep + 1) / 4) * 100) + '%';

  return (
    <section id="works" data-screen-label="How it works" className="hiw-section" style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 40px 0', fontFamily: "'Manrope', sans-serif", scrollMarginTop: '80px' }}>
      <style>{`
        .how-step-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 28px rgba(124,58,237,0.12); }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="hiw-title" style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-0.025em', margin: 0, fontFamily: "'Baloo 2','Manrope',sans-serif" }}>From prompt to payout.</h2>
        <span style={{ fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.12em', color: '#9CA3AF' }}>FOUR STEPS · TEN MINUTES</span>
      </div>
      <div style={{ position: 'relative', height: '6px', background: '#F1F0F5', borderRadius: '3px', marginTop: '48px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: stepPct, background: 'linear-gradient(90deg, #8B5CF6, #EC4899)', borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      </div>
      <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
        {STEPS.map((s, i) => {
          const active = activeStep === i;
          const done = activeStep > i;
          const numLabel = done ? '✓ DONE' : 'STEP ' + (i + 1);
          const numColor = done ? '#10B981' : active ? '#A855F7' : '#C9CDD6';
          const cardBg = active
            ? 'linear-gradient(95deg, #FAF7FE, #FEF5FA) padding-box, linear-gradient(135deg, #F472B6, #A855F7 50%, #7C3AED) border-box'
            : 'linear-gradient(#FFFFFF, #FFFFFF) padding-box, linear-gradient(135deg, rgba(244,114,182,0.4), rgba(168,85,247,0.2) 45%, rgba(124,58,237,0.4)) border-box';
          const lift = active ? 'translateY(-4px)' : 'none';
          const iconBg = active ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : done ? '#ECFDF5' : '#F8F7FC';
          const iconFg = active ? '#FFFFFF' : done ? '#10B981' : '#9CA3AF';
          const badgeFg = active ? '#7C3AED' : '#9CA3AF';
          const badgeBg = active ? '#F3EEFD' : '#F8F7FC';
          return (
            <div key={i} className="how-step-card" onClick={() => setActiveStep(i)} style={{ position: 'relative', border: '1.5px solid transparent', background: cardBg, borderRadius: '20px', padding: '22px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.06)', transition: 'all 0.3s ease', transform: lift }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '14px', background: iconBg, display: 'grid', placeItems: 'center', transition: 'all 0.3s ease' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d={s.icon} stroke={iconFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: numColor }}>{numLabel}</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, marginTop: '16px', letterSpacing: '-0.01em' }}>{s.title}</div>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: '7px 0 0' }}>{s.desc}</p>
              <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 800, color: badgeFg, display: 'inline-flex', alignItems: 'center', gap: '6px', background: badgeBg, borderRadius: '999px', padding: '5px 12px', transition: 'all 0.3s ease' }}>{s.badge}</div>
            </div>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 767px) {
          .hiw-section { padding: 56px 20px 0 !important; }
          .hiw-title { font-size: 28px !important; }
          .hiw-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .how-step-card { padding: 20px !important; }
        }
      `}</style>
    </section>
  );
}
