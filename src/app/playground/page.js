"use client";

import { useState } from "react";

const C = {
  bg: "#0C0B0A",
  card: "#161514",
  cardHover: "#1C1B19",
  border: "#2A2825",
  borderLight: "#353330",
  primary: "#E8553A",
  primaryDim: "#E8553A40",
  primaryGlow: "#E8553A18",
  green: "#34D399",
  greenDim: "#34D39930",
  blue: "#60A5FA",
  blueDim: "#60A5FA25",
  amber: "#FBBF24",
  amberDim: "#FBBF2425",
  purple: "#A78BFA",
  purpleDim: "#A78BFA25",
  rose: "#FB7185",
  text: "#F5F2ED",
  textSoft: "#A8A29E",
  textMuted: "#6B6560",
  wireframe: "#2A2825",
};

const fonts = {
  display: "'Instrument Serif', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', 'Courier New', monospace",
};

// ============== ANALYSIS SECTION COMPONENTS ==============

const AnalysisCard = ({ number, title, children, color = C.primary, icon }) => (
  <div
    style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "24px 24px 20px",
      position: "relative",
      borderLeft: `3px solid ${color}`,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: 10,
            fontFamily: fonts.mono,
            color: C.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Insight {number}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: C.text,
            fontFamily: fonts.body,
            lineHeight: 1.3,
            marginTop: 2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
    <div
      style={{
        fontSize: 13,
        color: C.textSoft,
        lineHeight: 1.7,
        fontFamily: fonts.body,
      }}
    >
      {children}
    </div>
  </div>
);

const DataPoint = ({ value, label, source }) => (
  <div
    style={{
      display: "inline-flex",
      flexDirection: "column",
      padding: "10px 14px",
      background: C.primaryGlow,
      borderRadius: 10,
      border: `1px solid ${C.primaryDim}`,
      marginRight: 8,
      marginBottom: 8,
    }}
  >
    <span
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: C.primary,
        fontFamily: fonts.body,
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 10,
        color: C.textSoft,
        fontFamily: fonts.body,
        marginTop: 2,
      }}
    >
      {label}
    </span>
    {source && (
      <span
        style={{
          fontSize: 9,
          color: C.textMuted,
          fontFamily: fonts.mono,
          marginTop: 4,
        }}
      >
        {source}
      </span>
    )}
  </div>
);

const DesignPrinciple = ({ number, title, description, maps }) => (
  <div
    style={{
      padding: "16px 18px",
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: C.primary,
          fontFamily: fonts.display,
        }}
      >
        {number}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: C.text,
          fontFamily: fonts.body,
        }}
      >
        {title}
      </span>
    </div>
    <div
      style={{
        fontSize: 12,
        color: C.textSoft,
        lineHeight: 1.6,
        fontFamily: fonts.body,
      }}
    >
      {description}
    </div>
    {maps && (
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: C.amber,
          fontFamily: fonts.mono,
          padding: "6px 10px",
          background: C.amberDim,
          borderRadius: 6,
        }}
      >
        → Maps to: {maps}
      </div>
    )}
  </div>
);

// ============== WIREFRAME COMPONENTS ==============

const WireTag = ({ children, color = C.primary }) => (
  <span
    style={{
      fontSize: 8,
      fontWeight: 700,
      fontFamily: fonts.mono,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      padding: "2px 6px",
      borderRadius: 4,
      border: `1px solid ${color}40`,
      background: `${color}15`,
    }}
  >
    {children}
  </span>
);

const WireSection = ({ id, title, children, annotation, principle }) => {
  const [showNote, setShowNote] = useState(false);
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${showNote ? C.primary : C.border}`,
        borderRadius: 14,
        padding: 14,
        position: "relative",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
      onClick={() => setShowNote(!showNote)}
    >
      <div
        style={{
          position: "absolute",
          top: -8,
          left: 12,
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            fontFamily: fonts.mono,
            color: C.bg,
            background: C.primary,
            padding: "2px 8px",
            borderRadius: 4,
            letterSpacing: "0.08em",
          }}
        >
          {id}
        </span>
        {principle && <WireTag color={C.amber}>P{principle}</WireTag>}
      </div>
      {children}
      {showNote && annotation && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            background: `${C.primary}10`,
            border: `1px dashed ${C.primaryDim}`,
            borderRadius: 8,
            fontSize: 11,
            color: C.textSoft,
            lineHeight: 1.6,
            fontFamily: fonts.body,
          }}
        >
          <span style={{ color: C.primary, fontWeight: 700 }}>
            UX Rationale:{" "}
          </span>
          {annotation}
        </div>
      )}
    </div>
  );
};

const Avatar = ({ size = 36, color = C.wireframe }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
    }}
  />
);

const Pill = ({ children, color = C.primary, bg }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 9,
      fontWeight: 700,
      color,
      background: bg || `${color}20`,
      fontFamily: fonts.body,
    }}
  >
    {children}
  </span>
);

const MiniBar = ({ percent, color = C.primary, h = 5 }) => (
  <div
    style={{
      width: "100%",
      height: h,
      background: C.wireframe,
      borderRadius: h,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${percent}%`,
        height: "100%",
        background: color,
        borderRadius: h,
      }}
    />
  </div>
);

// ============== THE WIREFRAME ==============

const CreatorWireframe = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {/* === SECTION 1: ROI BANNER === */}
    <WireSection
      id="S1"
      title="ROI Banner"
      principle="1"
      annotation="This is the MOST important element on the entire page. Research shows 56% cancel due to 'lack of perceived value'. This banner kills that objection on sight. It reframes every visit from 'I'm spending ₹699' to 'I've earned 26× what I paid.' Auto-calculates from campaign earnings attributed to RGossips-sourced deals. For new users with no earnings yet, this shows a progress message: 'You've applied to 3 campaigns — your first deal is closer than you think.'"
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary}15, ${C.green}10)`,
          borderRadius: 10,
          padding: "14px 16px",
          border: `1px solid ${C.primaryDim}`,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontFamily: fonts.mono,
            color: C.textMuted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Your plan this month
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: C.green,
              fontFamily: fonts.body,
            }}
          >
            26×
          </span>
          <span
            style={{ fontSize: 12, color: C.textSoft, fontFamily: fonts.body }}
          >
            return on your ₹699 Pro plan
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <span
            style={{ fontSize: 10, color: C.textSoft, fontFamily: fonts.body }}
          >
            💰 <strong style={{ color: C.text }}>₹18,500</strong> earned
          </span>
          <span
            style={{ fontSize: 10, color: C.textSoft, fontFamily: fonts.body }}
          >
            📢 <strong style={{ color: C.text }}>4</strong> campaigns landed
          </span>
          <span
            style={{ fontSize: 10, color: C.textSoft, fontFamily: fonts.body }}
          >
            👁 <strong style={{ color: C.text }}>12</strong> brand views
          </span>
        </div>
      </div>
    </WireSection>

    {/* === SECTION 2: ACTION CENTER === */}
    <WireSection
      id="S2"
      title="Action Center"
      principle="2"
      annotation="Creators check the app between shoots, in transit, between meals. They have 30-90 seconds. This section answers: 'What do I need to do RIGHT NOW?' Sorted by urgency. Red = overdue, amber = due today, blue = upcoming. Each item is one-tap to take action. No extra navigation. This replaces the traditional 'Active Campaigns' card — campaigns alone don't tell you what needs doing."
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              fontFamily: fonts.body,
            }}
          >
            Today
          </span>
          <Pill color={C.rose} bg={`${C.rose}20`}>
            3 actions
          </Pill>
        </div>
        <span
          style={{ fontSize: 10, color: C.textMuted, fontFamily: fonts.body }}
        >
          Mar 1
        </span>
      </div>
      {[
        {
          icon: "🔴",
          task: "Submit BoAt Reel — overdue by 1 day",
          action: "Upload",
          urgency: C.rose,
        },
        {
          icon: "🟡",
          task: "Reply to Mamaearth — brief clarification",
          action: "Reply",
          urgency: C.amber,
        },
        {
          icon: "🔵",
          task: "Sugar Cosmetics — shoot scheduled tomorrow",
          action: "View Brief",
          urgency: C.blue,
        },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 0",
            borderTop: i > 0 ? `1px solid ${C.border}` : "none",
          }}
        >
          <span style={{ fontSize: 12 }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                color: C.text,
                fontFamily: fonts.body,
                fontWeight: 500,
              }}
            >
              {item.task}
            </div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: fonts.body,
              color: item.urgency,
              border: `1px solid ${item.urgency}40`,
              background: `${item.urgency}15`,
            }}
          >
            {item.action}
          </div>
        </div>
      ))}
    </WireSection>

    {/* === SECTION 3: MONEY CENTER === */}
    <WireSection
      id="S3"
      title="Money Center"
      principle="3"
      annotation="88% of Indian creators earn less than 75% of their income from social media. Every rupee matters. This section answers: 'Where's my money?' — the #1 anxiety after 'Am I getting campaigns?' Split into cleared/pending/next payout. The 'next payout' countdown creates positive anticipation instead of anxiety. Showing the payment timeline builds trust — the biggest differentiator for Indian creator platforms."
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          fontFamily: fonts.body,
          marginBottom: 10,
        }}
      >
        Earnings
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div
          style={{
            flex: 1,
            background: `${C.green}12`,
            borderRadius: 10,
            padding: "10px 12px",
            border: `1px solid ${C.green}25`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: C.green,
              fontWeight: 700,
              fontFamily: fonts.mono,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Cleared
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.green,
              fontFamily: fonts.body,
              marginTop: 2,
            }}
          >
            ₹12,500
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: C.amberDim,
            borderRadius: 10,
            padding: "10px 12px",
            border: `1px solid ${C.amber}25`,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: C.amber,
              fontWeight: 700,
              fontFamily: fonts.mono,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Pending
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.amber,
              fontFamily: fonts.body,
              marginTop: 2,
            }}
          >
            ₹6,000
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: C.blueDim,
          borderRadius: 8,
          border: `1px solid ${C.blue}25`,
        }}
      >
        <span style={{ fontSize: 12 }}>⏱</span>
        <span style={{ fontSize: 11, color: C.blue, fontFamily: fonts.body }}>
          Next payout:{" "}
          <strong style={{ color: C.text }}>₹6,000 on Mar 3</strong> (in 2 days)
        </span>
      </div>
    </WireSection>

    {/* === SECTION 4: OPPORTUNITY FEED === */}
    <WireSection
      id="S4"
      title="New Opportunities"
      principle="4"
      annotation="55% of creators say finding brand deals is their #1 challenge. This IS the product. AI-matched campaigns with urgency signals ('3 spots left', 'Closing in 2d'). Pay range shown upfront — creators hate applying blind. 'Quick Apply' sends pre-filled media kit. The '94% match' score builds confidence to apply. Pro users see these 48hrs before Starter — making the tier upgrade tangible."
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            fontFamily: fonts.body,
          }}
        >
          For You
        </span>
        <Pill color={C.green}>4 new</Pill>
      </div>
      {[
        {
          brand: "Sugar Cosmetics",
          type: "Reel",
          pay: "₹8K – ₹12K",
          match: 94,
          spots: "3 spots left",
          tag: "Beauty",
          closing: "2d",
        },
        {
          brand: "Zomato",
          type: "Story ×3",
          pay: "₹5K + credits",
          match: 87,
          spots: "8 spots left",
          tag: "Food",
          closing: "5d",
        },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 12,
            marginBottom: i < 1 ? 8 : 0,
            background: C.bg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: C.wireframe,
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.text,
                    fontFamily: fonts.body,
                  }}
                >
                  {c.brand}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.textMuted,
                    fontFamily: fonts.body,
                  }}
                >
                  {c.type} · Closes in {c.closing}
                </div>
              </div>
            </div>
            <Pill color={C.green}>{c.match}% match</Pill>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: C.green,
                fontFamily: fonts.body,
              }}
            >
              {c.pay}
            </span>
            <span
              style={{ fontSize: 9, color: C.amber, fontFamily: fonts.mono }}
            >
              {c.spots}
            </span>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "8px 0",
              textAlign: "center",
              background: C.primary,
              color: "#fff",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: fonts.body,
            }}
          >
            Quick Apply →
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <span
          style={{
            fontSize: 11,
            color: C.primary,
            fontWeight: 600,
            fontFamily: fonts.body,
            cursor: "pointer",
          }}
        >
          See all 12 matched campaigns →
        </span>
      </div>
    </WireSection>

    {/* === SECTION 5: GROWTH PULSE === */}
    <WireSection
      id="S5"
      title="Growth Pulse"
      principle="5"
      annotation="Creators obsess over growth metrics — but raw numbers without context feel meaningless. This section shows RELATIVE growth: 'You gained 240 followers this week vs 180 last week.' The mini spark-lines give a visceral sense of trajectory without needing a full analytics page. The '↑ vs last month' framing triggers progress bias — people are more motivated by improvement than by absolutes."
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          fontFamily: fonts.body,
          marginBottom: 10,
        }}
      >
        Your Growth
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          {
            label: "Engagement Rate",
            value: "4.2%",
            delta: "↑ 0.3%",
            color: C.green,
          },
          {
            label: "Profile Views",
            value: "142",
            delta: "↑ 23% this week",
            color: C.blue,
          },
          {
            label: "Brand Invites",
            value: "6",
            delta: "↑ 2 vs last month",
            color: C.purple,
          },
          {
            label: "Avg. Deal Size",
            value: "₹9.2K",
            delta: "↑ ₹1.1K",
            color: C.amber,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              background: C.bg,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.textMuted,
                fontFamily: fonts.mono,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: C.text,
                fontFamily: fonts.body,
                marginTop: 4,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: s.color,
                fontFamily: fonts.body,
                marginTop: 2,
              }}
            >
              {s.delta}
            </div>
          </div>
        ))}
      </div>
    </WireSection>

    {/* === SECTION 6: AI TOOLS === */}
    <WireSection
      id="S6"
      title="AI Tools"
      principle="6"
      annotation="AI tools are the 'tangible product' of the subscription — the thing creators can touch and use daily even when no campaigns are active. Showing usage quota ('3/50 used') creates two effects: (a) it makes the value tangible, and (b) low usage triggers 'I should use this more since I'm paying for it' — reducing churn. Locked tools with '🔒 Elite' create natural upsell moments without being pushy."
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            fontFamily: fonts.body,
          }}
        >
          AI Tools
        </span>
        <span
          style={{ fontSize: 10, color: C.textMuted, fontFamily: fonts.mono }}
        >
          3/50 used this month
        </span>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
      >
        {[
          { icon: "✍️", name: "Captions", sub: "3/50" },
          { icon: "📋", name: "Media Kit", sub: "Update" },
          { icon: "#️⃣", name: "Hashtags", sub: "0/50" },
          { icon: "📊", name: "Rate Card", sub: "Generate" },
          { icon: "📝", name: "Scripts", sub: "0/50" },
          { icon: "🔍", name: "Audit", sub: "🔒 Elite" },
        ].map((t, i) => (
          <div
            key={i}
            style={{
              padding: "10px 8px",
              textAlign: "center",
              background: C.bg,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              opacity: t.sub.includes("🔒") ? 0.45 : 1,
            }}
          >
            <div style={{ fontSize: 18 }}>{t.icon}</div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.text,
                marginTop: 4,
                fontFamily: fonts.body,
              }}
            >
              {t.name}
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.textMuted,
                marginTop: 2,
                fontFamily: fonts.mono,
              }}
            >
              {t.sub}
            </div>
          </div>
        ))}
      </div>
    </WireSection>

    {/* === SECTION 7: MESSAGES === */}
    <WireSection
      id="S7"
      title="Messages"
      principle="2"
      annotation="Collapsed preview — 2 most recent threads. Brand messages = money conversations. Every unanswered message is a potentially lost deal. That's why unread count also lives in the bottom nav badge. For Starter tier (30 DMs/mo), a subtle 'Messages: 18/30 used' counter reinforces the limit and nudges upgrades."
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            fontFamily: fonts.body,
          }}
        >
          Messages
        </span>
        <Pill color={C.rose}>2 unread</Pill>
      </div>
      {[
        {
          name: "BoAt Lifestyle",
          msg: "Can you share the draft by tmrw?",
          time: "2h",
          unread: true,
        },
        {
          name: "Sugar Cosmetics",
          msg: "Loved your proposal! Let's discuss…",
          time: "5h",
          unread: true,
        },
      ].map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "8px 0",
            borderTop: i > 0 ? `1px solid ${C.border}` : "none",
          }}
        >
          <Avatar size={28} color={m.unread ? C.primary : C.wireframe} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.text,
                fontFamily: fonts.body,
              }}
            >
              {m.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.textMuted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: fonts.body,
              }}
            >
              {m.msg}
            </div>
          </div>
          <span
            style={{
              fontSize: 9,
              color: C.textMuted,
              fontFamily: fonts.mono,
              flexShrink: 0,
            }}
          >
            {m.time}
          </span>
        </div>
      ))}
    </WireSection>

    {/* === SECTION 8: LEARN === */}
    <WireSection
      id="S8"
      title="Learn & Grow"
      principle="6"
      annotation="Creator Academy = retention engine. When creators aren't getting campaigns, they still feel value if they're LEARNING. 'Trending Audio' report is a Pro-exclusive feature — it's the kind of thing creators screenshot and share with friends, which is organic marketing for RGossips. Content refreshes weekly to give a reason to come back."
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          fontFamily: fonts.body,
        }}
      >
        Trending & Learn
      </span>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {[
          {
            title: "Negotiate Higher Rates",
            type: "Article · 5 min",
            color: C.blue,
          },
          {
            title: "Trending Reels Audio",
            type: "Weekly · Pro",
            color: C.purple,
          },
          { title: "Perfect Media Kit", type: "Video · 8 min", color: C.green },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              minWidth: 140,
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
              border: `1px solid ${C.border}`,
              background: C.bg,
            }}
          >
            <div style={{ height: 50, background: `${c.color}20` }} />
            <div style={{ padding: "8px 10px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.text,
                  fontFamily: fonts.body,
                  lineHeight: 1.3,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.textMuted,
                  marginTop: 4,
                  fontFamily: fonts.mono,
                }}
              >
                {c.type}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WireSection>
  </div>
);

// ============== PHONE FRAME ==============

const PhoneFrame = () => (
  <div
    style={{
      width: "100%",
      maxWidth: 380,
      background: C.bg,
      borderRadius: 28,
      overflow: "hidden",
      boxShadow: `0 0 0 1px ${C.border}, 0 30px 80px rgba(0,0,0,0.5)`,
      flexShrink: 0,
    }}
  >
    {/* Status bar */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px 4px",
        fontSize: 11,
        fontWeight: 600,
        color: C.text,
        fontFamily: fonts.mono,
      }}
    >
      <span>9:41</span>
      <div
        style={{ width: 72, height: 20, background: C.text, borderRadius: 20 }}
      />
      <span style={{ fontSize: 10, letterSpacing: "0.05em" }}>●●● ▐▐</span>
    </div>

    {/* App header */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px 12px",
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: C.primary,
          fontFamily: fonts.body,
          letterSpacing: "-0.02em",
        }}
      >
        RGossips
      </span>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ fontSize: 17, filter: "grayscale(0.3)" }}>🔔</span>
          <div
            style={{
              position: "absolute",
              top: -3,
              right: -5,
              width: 13,
              height: 13,
              background: C.rose,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${C.bg}`,
            }}
          >
            <span style={{ fontSize: 7, color: "#fff", fontWeight: 800 }}>
              3
            </span>
          </div>
        </div>
        <Avatar size={26} color={C.wireframe} />
      </div>
    </div>

    {/* Content */}
    <div style={{ padding: "0 12px 12px", maxHeight: 640, overflowY: "auto" }}>
      <CreatorWireframe />
    </div>

    {/* Bottom nav */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 0 14px",
        borderTop: `1px solid ${C.border}`,
        background: C.card,
      }}
    >
      {[
        { icon: "🏠", label: "Home", active: true },
        { icon: "🔍", label: "Campaigns", active: false },
        { icon: "✍️", label: "AI Tools", active: false },
        { icon: "💬", label: "Chat", active: false, badge: 2 },
        { icon: "👤", label: "Profile", active: false },
      ].map((n, i) => (
        <div
          key={i}
          style={{ textAlign: "center", flex: 1, position: "relative" }}
        >
          <div
            style={{
              fontSize: 17,
              filter: n.active ? "none" : "grayscale(0.6) opacity(0.5)",
            }}
          >
            {n.icon}
          </div>
          <div
            style={{
              fontSize: 8,
              marginTop: 2,
              fontFamily: fonts.body,
              fontWeight: 600,
              color: n.active ? C.primary : C.textMuted,
            }}
          >
            {n.label}
          </div>
          {n.badge && (
            <div
              style={{
                position: "absolute",
                top: -2,
                right: "50%",
                marginRight: -16,
                width: 13,
                height: 13,
                background: C.rose,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${C.card}`,
              }}
            >
              <span style={{ fontSize: 7, color: "#fff", fontWeight: 800 }}>
                {n.badge}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ============== MAIN COMPONENT ==============

export default function RGossipsCreatorAnalysis() {
  const [tab, setTab] = useState("psychology");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: fonts.body,
        color: C.text,
        padding: "32px 16px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: C.primary,
                fontFamily: fonts.body,
              }}
            >
              RGossips
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "3px 10px",
                fontFamily: fonts.mono,
                background: C.card,
                color: C.textMuted,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                letterSpacing: "0.1em",
              }}
            >
              CREATOR HOME · DEEP DIVE
            </span>
          </div>
          <h1
            style={{
              fontSize: 32,
              fontFamily: fonts.display,
              fontWeight: 400,
              color: C.text,
              lineHeight: 1.2,
              margin: "12px 0 8px",
              fontStyle: "italic",
            }}
          >
            What does a paying creator <em>actually</em> need to see?
          </h1>
          <p
            style={{
              fontSize: 14,
              color: C.textSoft,
              lineHeight: 1.7,
              maxWidth: 600,
            }}
          >
            A psychological & marketing analysis of the creator home screen —
            informed by research on Indian creator economics, subscription churn
            patterns, and platform UX across 15+ competitors.
          </p>
        </div>

        {/* TAB NAV */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 24,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            width: "fit-content",
          }}
        >
          {[
            { id: "psychology", label: "🧠 Psychology" },
            { id: "marketing", label: "📈 Marketing" },
            { id: "principles", label: "🎯 Design Principles" },
            { id: "wireframe", label: "📱 Wireframe" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px",
                border: "none",
                background: tab === t.id ? C.primary : "transparent",
                color: tab === t.id ? "#fff" : C.textMuted,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: fonts.body,
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ============== PSYCHOLOGY TAB ============== */}
        {tab === "psychology" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "20px 24px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fonts.mono,
                  color: C.primary,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                The Core Question
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontFamily: fonts.display,
                  color: C.text,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                "I'm a micro-creator in Jaipur earning ₹25K–₹60K/month from
                brand deals. I just paid ₹699 for a Pro subscription. I open the
                app. What goes through my mind in the first 3 seconds?"
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <DataPoint
                value="88%"
                label="of Indian creators earn < 75% from social"
                source="Kofluence 2024-25"
              />
              <DataPoint
                value="55%"
                label="say finding deals is #1 challenge"
                source="NeoReach"
              />
              <DataPoint
                value="56%"
                label="cancel subscriptions due to cost"
                source="PYMNTS 2024"
              />
              <DataPoint
                value="₹8K–₹40K"
                label="typical micro-influencer rate per project"
                source="India Pricing Guides"
              />
            </div>

            <AnalysisCard
              number="01"
              title="The ROI Anxiety Loop"
              icon="😰"
              color={C.rose}
            >
              <p>
                When a nano creator earning ₹15K/month pays ₹249, that's nearly{" "}
                <strong style={{ color: C.text }}>
                  1.7% of their monthly income
                </strong>
                . For a micro creator paying ₹699 on ₹40K/month, it's 1.75%.
                This isn't Netflix — this is a <em>business investment</em>{" "}
                they're constantly evaluating.
              </p>
              <p style={{ marginTop: 8 }}>
                Every time they open the app, the subconscious question is:{" "}
                <strong style={{ color: C.primary }}>
                  "Has this paid for itself yet?"
                </strong>{" "}
                If the home screen doesn't answer this in 3 seconds, anxiety
                builds. If it goes unanswered for 2 weeks, they start
                considering cancellation.
              </p>
              <p style={{ marginTop: 8, color: C.green }}>
                → <strong>Design implication:</strong> The FIRST element on the
                screen must be an ROI indicator. Not a greeting. Not stats. A
                clear "Your plan earned you X this month" calculation.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="02"
              title="The Urgency-Scarcity Cocktail"
              icon="⏰"
              color={C.amber}
            >
              <p>
                Indian influencer marketing is intensely competitive — there are{" "}
                <strong style={{ color: C.text }}>
                  3.5 to 4.5 million creators
                </strong>{" "}
                fighting for brand budgets. When a campaign drops, the window to
                apply is narrow. Creators live in FOMO.
              </p>
              <p style={{ marginTop: 8 }}>
                This isn't just about showing new campaigns — it's about{" "}
                <strong style={{ color: C.amber }}>
                  manufactured scarcity signals
                </strong>
                : "3 spots left", "Closes in 2 days", "Pro members see this
                48hrs early." These aren't dark patterns — they're real
                constraints presented honestly. But the psychological effect is
                powerful: the creator feels their subscription gave them an
                edge.
              </p>
              <p style={{ marginTop: 8, color: C.green }}>
                → <strong>Design implication:</strong> Campaign cards need
                urgency markers. Time-left counters. Spot-left counters. The
                subscription tier advantage should be subtly visible.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="03"
              title="The Trust Deficit Around Money"
              icon="💸"
              color={C.green}
            >
              <p>
                In India's creator economy,{" "}
                <strong style={{ color: C.text }}>
                  delayed payments are the norm
                </strong>
                . Agencies take 30-60 days. Some ghost entirely. Creators have
                been burned.
              </p>
              <p style={{ marginTop: 8 }}>
                Your pricing doc already differentiates on payment speed: 3-5
                days for Starter, 48hrs for Pro, 24hrs for Elite. This is a{" "}
                <strong style={{ color: C.green }}>massive trust signal</strong>
                . But it only works if creators can SEE their money moving. A
                clear earnings tracker with "Cleared / Pending / Next Payout
                Date" does more for retention than any feature you could build.
              </p>
              <p style={{ marginTop: 8, color: C.green }}>
                → <strong>Design implication:</strong> Money visibility must be
                above the fold. Not buried in a settings page. The payment
                countdown creates positive anticipation instead of payment
                anxiety.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="04"
              title="The Progress Illusion"
              icon="📈"
              color={C.blue}
            >
              <p>
                Psychologically, humans are more motivated by{" "}
                <strong style={{ color: C.text }}>
                  relative progress than absolute numbers
                </strong>
                . A creator doesn't care that their engagement rate is 4.2% —
                they care that it's <em>up 0.3% from last month</em>.
              </p>
              <p style={{ marginTop: 8 }}>
                Every metric on the home screen should show a delta: ↑/↓ vs.
                previous period. This creates what behavioral economists call{" "}
                <strong style={{ color: C.blue }}>the "progress bias"</strong> —
                even small improvements feel motivating. And when metrics are
                flat or declining, it creates a reason to engage more with the
                platform's tools (AI suite, academy, etc.).
              </p>
              <p style={{ marginTop: 8, color: C.green }}>
                → <strong>Design implication:</strong> Never show a naked
                number. Always pair it with a delta comparison. Growth =
                validation. Decline = motivation to use more tools.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="05"
              title="The 90-Second Window"
              icon="⚡"
              color={C.purple}
            >
              <p>
                Creators check the app{" "}
                <strong style={{ color: C.text }}>
                  between shoots, in autos, waiting for coffee
                </strong>
                . They don't have 10 minutes to browse. They have 90 seconds.
                The home screen must answer exactly 3 questions in that window:
              </p>
              <p style={{ marginTop: 8 }}>
                1.{" "}
                <strong style={{ color: C.text }}>
                  "Do I need to do anything RIGHT NOW?"
                </strong>{" "}
                (deadlines, replies, submissions)
              </p>
              <p>
                2.{" "}
                <strong style={{ color: C.text }}>
                  "Is there new money on the table?"
                </strong>{" "}
                (new campaigns, payment updates)
              </p>
              <p>
                3. <strong style={{ color: C.text }}>"Am I growing?"</strong>{" "}
                (metrics, profile views)
              </p>
              <p style={{ marginTop: 8, color: C.green }}>
                → <strong>Design implication:</strong> Replace "Active
                Campaigns" (a static list) with an "Action Center" (a dynamic
                to-do). Each item should be one-tap actionable — no navigation,
                no extra screens.
              </p>
            </AnalysisCard>
          </div>
        )}

        {/* ============== MARKETING TAB ============== */}
        {tab === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "20px 24px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fonts.mono,
                  color: C.primary,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Marketing Framework
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontFamily: fonts.display,
                  color: C.text,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                The home screen isn't a dashboard. It's a daily retention ad for
                your own subscription.
              </div>
            </div>

            <AnalysisCard
              number="01"
              title="The 'Silent Justification' Layer"
              icon="🔄"
              color={C.green}
            >
              <p>
                Research shows subscription businesses must{" "}
                <strong style={{ color: C.text }}>
                  "actively remind customers what they're paying for"
                </strong>
                . This isn't marketing fluff — it's the difference between a
                3-month subscriber and a 12-month subscriber.
              </p>
              <p style={{ marginTop: 8 }}>
                Every section on the home screen should subtly whisper:{" "}
                <em style={{ color: C.green }}>"This is why you pay."</em> The
                ROI banner says it explicitly. The "48hrs early access" tag on
                campaigns says it implicitly. The AI tools with usage counters
                say "you're getting value you haven't even fully used yet."
                Together, they form a{" "}
                <strong>passive justification layer</strong> that runs on every
                visit.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="02"
              title="Tier Upgrade Without Hard Selling"
              icon="🪜"
              color={C.amber}
            >
              <p>
                Your 3-tier model (₹249 → ₹699 → ₹1,499) is designed for natural
                progression. The home screen should make the upgrade feel like
                an{" "}
                <strong style={{ color: C.text }}>
                  unlock, not a purchase
                </strong>
                .
              </p>
              <p style={{ marginTop: 8 }}>
                How: Starter users see "🔒 Pro" on AI Script Writer. They see
                "Pro members saw this campaign 48hrs ago." They see "Upgrade →
                48hr payouts." These are{" "}
                <strong style={{ color: C.amber }}>
                  aspiration triggers, not ads
                </strong>
                . The creator thinks "when I'm earning more, I'll upgrade" — and
                since the platform IS helping them earn more, the upgrade
                becomes a natural step.
              </p>
              <p style={{ marginTop: 8 }}>
                The "Your plan this month" ROI banner also works for downsell
                prevention: if a Pro user sees "26× return", they'll never
                downgrade to Starter.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="03"
              title="The Daily Habit Loop"
              icon="🔁"
              color={C.blue}
            >
              <p>
                The home screen needs to create a daily opening ritual. The
                structure should follow the{" "}
                <strong style={{ color: C.text }}>
                  Hook → Variable Reward → Investment
                </strong>{" "}
                model:
              </p>
              <p style={{ marginTop: 8 }}>
                <strong style={{ color: C.blue }}>Hook:</strong> Push
                notification — "New campaign from Sugar Cosmetics (94% match)"
                or "₹6,000 payout arriving tomorrow"
              </p>
              <p>
                <strong style={{ color: C.blue }}>Variable Reward:</strong> The
                opportunity feed changes daily. New campaigns, updated match
                scores, trend reports. Every visit has something new.
              </p>
              <p>
                <strong style={{ color: C.blue }}>Investment:</strong> Each
                action (applying, completing deliverables, using AI tools)
                builds stored value — profile completeness, reputation score,
                earnings history. This makes switching to another platform
                costly.
              </p>
            </AnalysisCard>

            <AnalysisCard
              number="04"
              title="Platform-Lock Through Data"
              icon="🔐"
              color={C.purple}
            >
              <p>
                The Growth Pulse and Earnings sections aren't just features —
                they're{" "}
                <strong style={{ color: C.text }}>
                  switching cost generators
                </strong>
                . Once a creator has 6 months of earnings history, analytics
                trends, and campaign track records on RGossips, leaving means
                losing all that data.
              </p>
              <p style={{ marginTop: 8 }}>
                This is why the "Annual Creator Report" in the Elite plan is
                brilliant — it creates a{" "}
                <strong style={{ color: C.purple }}>data artifact</strong> that
                creators use for tax filing, brand pitches, and personal
                tracking. They literally can't function without it.
              </p>
              {/* <p style={{marginTop: 8}}>The home screen should always show <em>trajectory</em> — not snapshots. "Your earnings over 6 months" > "Your earnings this month." Trajectory = history = lock-in.</p> */}
            </AnalysisCard>

            <AnalysisCard
              number="05"
              title="Community as Retention Glue"
              icon="👥"
              color={C.rose}
            >
              <p>
                The Creator Academy and trending content aren't growth features
                — they're{" "}
                <strong style={{ color: C.text }}>churn prevention</strong>.
                When a creator has a slow month with no campaigns, the Academy
                gives them a reason to open the app. The trending audio report
                gives them content ideas. The community forums give them peer
                support.
              </p>
              <p style={{ marginTop: 8 }}>
                The industry is shifting from{" "}
                <strong style={{ color: C.text }}>
                  "creators as influencers" to "creators as media brands."
                </strong>{" "}
                Your Academy positions RGossips as the platform that helps them
                make that transition. That's a much deeper value proposition
                than just campaign matching.
              </p>
            </AnalysisCard>
          </div>
        )}

        {/* ============== DESIGN PRINCIPLES TAB ============== */}
        {tab === "principles" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                padding: "20px 24px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fonts.mono,
                  color: C.primary,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Section Hierarchy
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: C.text,
                  fontFamily: fonts.body,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                Every section maps back to a core principle. Here's the order
                and why:
              </div>
            </div>

            <DesignPrinciple
              number="P1"
              title="Value Proof First"
              description="The first thing on screen must prove the subscription's worth. Not a greeting. Not stats. A clear, numerical ROI that says 'your ₹699 earned you ₹18,500.' This single element likely reduces churn more than any feature."
              maps="S1 · ROI Banner"
            />
            <DesignPrinciple
              number="P2"
              title="Action Over Information"
              description="Don't tell creators what's happening — tell them what to DO. Replace passive campaign lists with an urgency-sorted action center. Every item should be completable in one tap. Creators have 90 seconds — respect that."
              maps="S2 · Action Center, S7 · Messages"
            />
            <DesignPrinciple
              number="P3"
              title="Money Visibility = Trust"
              description="In a market where 88% of creators earn unstable income, showing clear payment status (cleared/pending/next payout) builds trust that no feature can match. This is the #1 differentiator vs. platforms that hide payment status in settings."
              maps="S3 · Money Center"
            />
            <DesignPrinciple
              number="P4"
              title="Discovery Is the Product"
              description="55% of creators say finding brand deals is their biggest challenge. The campaign feed IS the product they're paying for. AI-matching, urgency signals, and quick-apply make this feel worth the subscription every single day."
              maps="S4 · Opportunity Feed"
            />
            <DesignPrinciple
              number="P5"
              title="Progress Over Absolutes"
              description="Never show a naked number. Always pair it with a comparison to the previous period. '4.2% engagement' means nothing. '4.2% ↑ 0.3% vs last month' means everything. Delta comparisons trigger progress bias and keep creators motivated."
              maps="S5 · Growth Pulse"
            />
            <DesignPrinciple
              number="P6"
              title="Tangible Value in Quiet Moments"
              description="When there are no campaigns to apply to, the subscription still needs to feel valuable. AI tools (with visible usage quotas) and the Creator Academy fill this gap. Usage counters ('3/50 used') trigger 'I should use this more' — reducing churn."
              maps="S6 · AI Tools, S8 · Learn & Grow"
            />

            <div
              style={{
                padding: "16px 20px",
                background: `${C.primary}10`,
                border: `1px dashed ${C.primaryDim}`,
                borderRadius: 12,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.primary,
                  fontFamily: fonts.body,
                  marginBottom: 6,
                }}
              >
                Section Order (Top → Bottom):
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: C.textSoft,
                  fontFamily: fonts.mono,
                  lineHeight: 2,
                }}
              >
                S1 ROI Banner → S2 Action Center → S3 Money → S4 Campaigns → S5
                Growth → S6 AI Tools → S7 Messages → S8 Learn
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  fontFamily: fonts.body,
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                This order reflects emotional priority:{" "}
                <strong style={{ color: C.text }}>
                  Justify → Act → Earn → Discover → Grow → Create → Communicate
                  → Learn
                </strong>
                . The first three sections should be visible without scrolling
                on most devices.
              </div>
            </div>
          </div>
        )}

        {/* ============== WIREFRAME TAB ============== */}
        {tab === "wireframe" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                textAlign: "center",
                maxWidth: 480,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: C.textSoft,
                  fontFamily: fonts.body,
                  lineHeight: 1.6,
                }}
              >
                Tap any section to reveal the UX rationale behind it.
                <br />
                <span
                  style={{
                    color: C.amber,
                    fontFamily: fonts.mono,
                    fontSize: 10,
                  }}
                >
                  P1–P6 tags
                </span>
                <span style={{ color: C.textMuted }}>
                  {" "}
                  show which design principle each section serves.
                </span>
              </div>
            </div>

            <PhoneFrame />

            <div
              style={{
                padding: "16px 20px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                maxWidth: 380,
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: fonts.body,
                  marginBottom: 8,
                }}
              >
                📋 Section Map
              </div>
              {[
                { id: "S1", name: "ROI Banner", principle: "P1 · Value Proof" },
                {
                  id: "S2",
                  name: "Action Center",
                  principle: "P2 · Action Over Info",
                },
                {
                  id: "S3",
                  name: "Money Center",
                  principle: "P3 · Money = Trust",
                },
                {
                  id: "S4",
                  name: "Opportunities",
                  principle: "P4 · Discovery = Product",
                },
                {
                  id: "S5",
                  name: "Growth Pulse",
                  principle: "P5 · Progress Over Absolutes",
                },
                {
                  id: "S6",
                  name: "AI Tools",
                  principle: "P6 · Tangible Value",
                },
                {
                  id: "S7",
                  name: "Messages",
                  principle: "P2 · Action Over Info",
                },
                {
                  id: "S8",
                  name: "Learn & Grow",
                  principle: "P6 · Tangible Value",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        fontFamily: fonts.mono,
                        color: C.bg,
                        background: C.primary,
                        padding: "2px 6px",
                        borderRadius: 3,
                      }}
                    >
                      {s.id}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: C.text,
                        fontFamily: fonts.body,
                      }}
                    >
                      {s.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: C.textMuted,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {s.principle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
