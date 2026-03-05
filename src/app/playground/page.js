"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/*
 ╔══════════════════════════════════════════════════════════╗
 ║  RGossips — First-Time Creator Home Screen              ║
 ║  Brand Gradient: Salmon → Magenta → Purple → Blue       ║
 ║  Aesthetic: Warm Dark Luxe — premium + energetic         ║
 ╚══════════════════════════════════════════════════════════╝
*/

// ══════════ BRAND DESIGN TOKENS ══════════
const B = {
  salmon: "#F89E8A",
  magenta: "#DA6BA4",
  purple: "#8263BD",
  blue: "#4D76BF",
  grad: "linear-gradient(135deg, #F89E8A, #DA6BA4, #8263BD, #4D76BF)",
  gradH: "linear-gradient(90deg, #F89E8A, #DA6BA4, #8263BD, #4D76BF)",
  gradSoft:
    "linear-gradient(135deg, #F89E8A18, #DA6BA412, #8263BD0C, #4D76BF08)",
  gradWarm: "linear-gradient(135deg, #F89E8A, #DA6BA4)",
  gradCool: "linear-gradient(135deg, #8263BD, #4D76BF)",
};

const T = {
  bg: "#08070C",
  bgSoft: "#0E0D14",
  s1: "#121119",
  s2: "#17161F",
  s3: "#1D1C28",
  b1: "#252336",
  b2: "#312E44",
  b3: "#3E3B55",
  t1: "#F2F0F7",
  t2: "#C8C4D4",
  t3: "#8E8AA2",
  t4: "#5C5874",
  g1: "#3DDC84",
  g1d: "#3DDC8420",
  g1s: "#3DDC8435",
  a1: "#FFD166",
  a1d: "#FFD16618",
  r1: "#FF6B8A",
  r1d: "#FF6B8A18",
};

// ══════════ LOGO COMPONENT ══════════
const Logo = ({ w = 105 }) => (
  <svg width={w} height={w * 0.1437} viewBox="0 0 1225 176" fill="none">
    <defs>
      <linearGradient
        id="rgl"
        x1="0"
        y1="87.56"
        x2="502.88"
        y2="-504.47"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#F89E8A" />
        <stop offset=".4" stopColor="#DA6BA4" />
        <stop offset=".637" stopColor="#8263BD" />
        <stop offset="1" stopColor="#4D76BF" />
      </linearGradient>
    </defs>
    {[
      "M123.026 94.987C112.189 101.53 96.151 83.535 109.155 74.128L132.995 62.267C125.58 56.939 120.858 54.905 109.155 58.177C97.451 61.858 91.137 75.764 94.851 90.488C99.08 107.256 126.927 115.436 141.665 97.85C146.866 94.578 167.239 106.438 162.904 112.573C153.657 125.661 143.316 130.646 130.395 133.023C110.598 136.665 85.605 135.259 71.428 105.822C57.37 76.632 74.044 39.364 105.687 30.366C119.991 27.094 139.931 29.957 148.167 38.546C163.338 51.224 169.406 71.265 154.669 79.036L123.026 94.987Z",
      "M0 129.897C0 133.632.415 134.877 4.565 134.877H22.824C26.559 134.877 26.591 134.082 26.559 129.897L27.389 74.289C27.389 69.309 36.104 58.52 43.159 58.52H53.118C57.268 58.52 56.853 56.86 56.853 53.125V36.11C56.853 32.79 56.853 31.545 51.873 31.545H38.594C19.504 31.545 0 56.03 0 72.629V129.897Z",
      "M262.6 112.882C265.505 107.531 247.661 94.222 243.511 97.942C231.476 108.732 218.612 111.222 207.822 103.752C190.807 90.058 196.202 64.744 211.972 58.104C222.761 54.784 233.69 57.404 245.586 68.063C250.98 72.898 267.428 58.934 260.94 50.219C249.545 34.913 240.926 30.105 221.101 29.055C190.807 29.055 169.228 53.954 169.228 80.928C169.228 109.977 190.392 134.876 221.931 134.876C239.956 134.971 254.715 127.407 262.6 112.882Z",
      "M328.676 95.147C317.839 101.69 301.801 83.695 314.805 74.288L338.645 62.427C331.23 57.099 326.508 55.065 314.805 58.337C303.101 62.018 296.787 75.924 300.5 90.648C304.73 107.416 332.577 115.596 347.314 98.01C352.516 94.738 372.889 106.598 368.554 112.733C359.307 125.821 348.966 130.806 336.044 133.183C316.248 136.825 291.255 135.419 277.078 105.982C263.02 76.792 279.694 39.524 311.337 30.526C325.641 27.254 345.581 30.117 353.816 38.706C368.988 51.384 375.056 71.425 360.318 79.196L328.676 95.147Z",
      "M398.106 134.877H380.676C376.941 134.877 375.282 133.632 375.282 129.897V72.214C376.111 50.635 397.276 29.886 420.1 29.886C444.169 29.886 465.334 51.88 465.334 72.214V129.897C465.334 134.462 464.504 134.877 460.769 134.877H443.339C439.605 134.877 438.775 134.462 438.775 129.897L438.36 72.214C438.36 65.989 429.645 57.69 420.1 57.69C412.63 57.69 402.256 65.574 402.256 72.214V129.897C402.118 134.368 401.426 134.877 398.106 134.877Z",
      "M486.083 0C482.348 0 481.103 1.66 481.103 4.565V95.032C481.103 118.271 505.172 134.041 527.167 134.041C552.481 134.456 573.645 114.536 573.645 80.923C573.645 77.603 573.23 76.773 569.495 76.773H550.406C546.256 76.773 545.841 78.848 545.841 81.338V92.957C545.011 99.597 536.711 107.482 527.167 107.482C517.207 107.482 508.492 99.182 508.492 93.372V56.023H542.936C546.256 56.023 547.916 55.193 547.916 50.628V34.029C547.916 30.709 546.256 29.049 542.936 29.049H508.492V4.565C508.492 1.66 507.247 0 503.512 0H486.083Z",
      "M602.976 132.796L585.962 148.15C593.017 161.845 608.371 175.125 638.25 175.125C660.66 175.125 685.144 150.225 685.144 131.136V74.698C685.144 55.608 661.905 31.539 634.515 31.539C601.316 31.539 583.472 56.023 583.472 90.467C583.472 111.632 608.283 137.576 647.795 131.136C654.02 131.136 653.19 104.992 647.795 104.992C638.862 106.496 632.026 106.652 626.631 104.992C613.478 97.826 611.177 91.853 612.106 79.263C613.351 69.718 622.481 59.758 634.515 59.758C646.965 59.758 657.755 72.208 657.755 79.263V131.136C653.111 143.297 647.919 146.895 634.515 148.15C622.896 148.15 616.256 142.341 608.371 132.796C606.167 131.21 605.466 130.721 602.976 132.796Z",
      "M748.637 31.539C777.286 31.539 800.51 54.764 800.51 83.412C800.51 112.061 777.286 135.286 748.637 135.286C719.988 135.286 696.763 112.061 696.763 83.412C696.763 54.764 719.988 31.539 748.637 31.539ZM749.882 58.928C736.13 58.928 724.983 70.076 724.983 83.827C724.983 97.579 736.13 108.727 749.882 108.727C763.633 108.727 774.781 97.579 774.781 83.827C774.781 70.076 763.633 58.928 749.882 58.928Z",
      "M859.527 108.312H815.953C813.463 108.312 812.218 109.142 812.218 112.462V116.426C812.218 120.52 812.218 125.969 812.218 128.646C812.218 132.381 812.633 133.626 815.953 133.626H864.092C878.528 133.626 891.991 118.683 892.311 103.332C892.691 85.072 885.671 69.718 868.242 70.133L843.757 69.718C837.533 69.718 837.533 56.853 843.757 56.853H885.671C888.161 56.853 890.236 54.778 890.236 51.873V35.689C890.236 32.784 888.991 31.539 884.426 31.539H838.778C823.008 31.539 810.973 46.064 812.218 67.228C813 80.508 826.743 94.202 839.192 94.202L859.527 94.617C866.582 94.617 866.582 108.312 859.527 108.312Z",
      "M951.342 108.312H907.768C905.278 108.312 904.033 109.142 904.033 112.462V116.426C904.034 120.52 904.034 125.969 904.033 128.646C904.033 132.381 904.448 133.626 907.768 133.626H955.907C970.343 133.626 983.806 118.683 984.126 103.332C984.506 85.072 977.486 69.718 960.057 70.133L935.573 69.718C929.348 69.718 929.348 56.853 935.573 56.853H977.486C979.976 56.853 982.051 54.778 982.051 51.873V35.689C982.051 32.784 980.806 31.539 976.241 31.539H930.593C914.823 31.539 902.788 46.064 904.033 67.228C904.815 80.508 918.558 94.202 931.008 94.202L951.342 94.617C958.397 94.617 958.397 108.312 951.342 108.312Z",
      "M1016.09 31.539H1000.74C997.42 31.539 995.76 34.859 995.76 38.179V128.231C995.76 131.966 997.005 134.041 1001.16 134.041H1017.34C1020.66 134.041 1021.05 131.71 1021.07 128.231V38.179C1021.07 33.614 1019.83 31.539 1016.09 31.539Z",
      "M1032.69 168.485C1032.69 172.22 1033.11 173.05 1036.84 173.05H1055.52C1058.42 173.05 1059.67 172.635 1059.67 168.485L1060.08 79.678C1060.08 66.398 1072.53 57.683 1087.47 59.343C1106.56 62.663 1117.35 95.032 1087.47 105.407C1073.78 108.312 1067.14 102.502 1066.31 109.142V124.911C1066.31 130.721 1075.44 132.796 1087.47 132.381C1117.35 128.231 1134.37 109.142 1133.12 75.943C1133.12 52.703 1109.88 31.539 1083.32 31.539C1056.76 31.539 1032.69 51.873 1032.69 75.943V168.485Z",
      "M1192.2 108.312H1148.63C1146.14 108.312 1144.89 109.142 1144.89 112.462V116.426C1144.89 120.52 1144.89 125.969 1144.89 128.646C1144.89 132.381 1145.31 133.626 1148.63 133.626H1196.77C1211.2 133.626 1224.67 118.683 1224.99 103.332C1225.37 85.072 1218.35 69.718 1200.92 70.133L1176.43 69.718C1170.21 69.718 1170.21 56.853 1176.43 56.853H1218.35C1220.84 56.853 1222.91 54.778 1222.91 51.873V35.689C1222.91 32.784 1221.67 31.539 1217.1 31.539H1171.45C1155.68 31.539 1143.65 46.064 1144.89 67.228C1145.67 80.508 1159.42 94.202 1171.87 94.202L1192.2 94.617C1199.26 94.617 1199.26 108.312 1192.2 108.312Z",
    ].map((d, i) => (
      <path
        key={i}
        d={d}
        fill="url(#rgl)"
        fillRule={i === 7 ? "evenodd" : undefined}
        clipRule={i === 7 ? "evenodd" : undefined}
      />
    ))}
  </svg>
);

// ══════════ ANIMATION HOOK ══════════
const useReveal = (delay = 0) => {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return [ref, vis];
};

const Reveal = ({ children, delay = 0, y = 20, style = {} }) => {
  const [ref, vis] = useReveal(delay);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)`,
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ══════════ MICRO COMPONENTS ══════════
const Grad = ({ children, style = {} }) => (
  <span
    style={{
      background: B.grad,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

const GBorder = ({ children, r = 16, p = 1.5, style = {} }) => (
  <div style={{ background: B.grad, borderRadius: r, padding: p, ...style }}>
    <div
      style={{
        background: T.s1,
        borderRadius: r - 1,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  </div>
);

const Chip = ({ children, color = B.salmon, bg, icon }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 100,
      fontSize: 10,
      fontWeight: 700,
      color,
      background: bg || `${color}18`,
      letterSpacing: "0.01em",
    }}
  >
    {icon && <span style={{ fontSize: 8 }}>{icon}</span>}
    {children}
  </span>
);

const Ring = ({ pct, sz = 46, sw = 3.5 }) => {
  const r = (sz - sw) / 2,
    c = 2 * Math.PI * r;
  return (
    <svg
      width={sz}
      height={sz}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx={sz / 2}
        cy={sz / 2}
        r={r}
        fill="none"
        stroke={T.b1}
        strokeWidth={sw}
      />
      <circle
        cx={sz / 2}
        cy={sz / 2}
        r={r}
        fill="none"
        stroke="url(#ringG)"
        strokeWidth={sw}
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      <defs>
        <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={B.salmon} />
          <stop offset="100%" stopColor={B.magenta} />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Av = ({ n, sz = 36, grad }) => (
  <div
    style={{
      width: sz,
      height: sz,
      borderRadius: "50%",
      flexShrink: 0,
      background: grad ? B.grad : T.b2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: sz * 0.38,
      fontWeight: 800,
      color: "#fff",
    }}
  >
    {n}
  </div>
);

// ══════════ MAIN COMPONENT ══════════
export default function RGossipsApp() {
  const [done, setDone] = useState(new Set([0]));
  const [clOpen, setClOpen] = useState(true);
  const [activeNav, setActiveNav] = useState(0);
  const [hoveredCamp, setHoveredCamp] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);

  const toggle = (i) =>
    setDone((p) => {
      const n = new Set(p);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  const pct = (done.size / 5) * 100;

  const steps = [
    { ico: "✅", label: "Create your account", reward: null, cta: null },
    {
      ico: "📱",
      label: "Connect Instagram",
      reward: "Brands discover you instantly",
      cta: "Connect",
    },
    {
      ico: "📋",
      label: "Generate AI Media Kit",
      reward: "Look pro in 60 seconds",
      cta: "Create",
    },
    {
      ico: "💰",
      label: "Set your rate card",
      reward: "Know your worth",
      cta: "Set Rates",
    },
    {
      ico: "🚀",
      label: "Apply to first campaign",
      reward: "Land your first deal",
      cta: "Browse",
    },
  ];

  const camps = [
    {
      brand: "Sugar Cosmetics",
      type: "Instagram Reel",
      pay: "₹8K – ₹12K",
      spots: 3,
      tot: 10,
      close: "3d",
      niche: "Beauty",
      col: B.salmon,
      initial: "S",
    },
    {
      brand: "boAt Lifestyle",
      type: "Unboxing + Story",
      pay: "₹10K – ₹15K",
      spots: 5,
      tot: 15,
      close: "5d",
      niche: "Tech",
      col: B.purple,
      initial: "B",
    },
    {
      brand: "Zomato",
      type: "Story Series ×3",
      pay: "₹5K + Credits",
      spots: 8,
      tot: 20,
      close: "7d",
      niche: "Food",
      col: B.blue,
      initial: "Z",
    },
  ];

  const creators = [
    {
      n: "Ananya S.",
      nich: "Beauty · 15K",
      earn: "₹32K",
      time: "3 weeks",
      q: "Got my first brand deal in just 4 days!",
      ini: "A",
    },
    {
      n: "Vikram R.",
      nich: "Tech · 42K",
      earn: "₹58K",
      time: "1 month",
      q: "The AI media kit impressed every brand I pitched",
      ini: "V",
    },
    {
      n: "Priya M.",
      nich: "Food · 8K",
      earn: "₹12K",
      time: "2 weeks",
      q: "Even with 8K followers, brands found me here",
      ini: "P",
    },
  ];

  const tools = [
    { ico: "✍️", n: "Captions", sub: "Try free →", hot: true },
    { ico: "#️⃣", n: "Hashtags", sub: "0/50" },
    { ico: "📝", n: "Scripts", sub: "0/50" },
    { ico: "📊", n: "Rate Card", sub: "Generate" },
    { ico: "🎯", n: "Hook Ideas", sub: "0/50" },
    { ico: "📋", n: "Brief Helper", sub: "0/50" },
  ];

  const threads = [
    {
      t: "How I landed my first ₹10K deal as a 5K creator",
      rep: 24,
      hot: true,
    },
    { t: "Rate card thread — what's everyone charging?", rep: 18, hot: true },
    { t: "New here? Introduce yourself 👋", rep: 42 },
  ];

  const navItems = [
    { ico: "🏠", l: "Home" },
    { ico: "🔍", l: "Campaigns" },
    { ico: "✨", l: "AI Tools" },
    { ico: "💬", l: "Community" },
    { ico: "👤", l: "Profile" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        justifyContent: "center",
        padding: "16px 0",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&family=Azeret+Mono:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Urbanist', sans-serif; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes shimmer { 0% { background-position: -300% center; } 100% { background-position: 300% center; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 12px ${B.salmon}25; } 50% { box-shadow: 0 0 24px ${B.salmon}40; } }
        @keyframes countPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        .hlift { transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-color .22s ease; }
        .hlift:hover { transform: translateY(-2px); box-shadow: 0 12px 40px #0004; }
        .hglow:hover { border-color: ${B.salmon}50 !important; }
        .shimmer-bg { background: linear-gradient(90deg, transparent 30%, ${B.salmon}12 50%, transparent 70%); background-size: 300% 100%; animation: shimmer 3s infinite; }
      `}</style>

      {/* ══ PHONE SHELL ══ */}
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: T.bg,
          borderRadius: 36,
          overflow: "hidden",
          position: "relative",
          boxShadow: `0 0 0 1px ${T.b1}, 0 4px 6px #0002, 0 48px 120px #0006`,
          display: "flex",
          flexDirection: "column",
          maxHeight: "100vh",
        }}
      >
        {/* ═══ STATUS BAR ═══ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 26px 4px",
            fontFamily: "'Azeret Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            color: T.t1,
            flexShrink: 0,
            background: `linear-gradient(180deg, ${T.bg}, ${T.bg}00)`,
            position: "relative",
            zIndex: 10,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              width: 86,
              height: 26,
              background: T.t1,
              borderRadius: 20,
            }}
          />
          <span style={{ fontSize: 11 }}>●●● ▐▐</span>
        </div>

        {/* ═══ APP HEADER ═══ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "4px 20px 12px",
            flexShrink: 0,
            background: `${T.bg}E8`,
            backdropFilter: "blur(24px)",
            position: "sticky",
            top: 0,
            zIndex: 9,
          }}
        >
          <Logo w={108} />
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{ fontSize: 20, lineHeight: 1 }}>🔔</div>
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  right: -5,
                  width: 17,
                  height: 17,
                  background: B.gradWarm,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${T.bg}`,
                  fontSize: 8,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                3
              </div>
            </div>
            <Av n="U" sz={30} grad />
          </div>
        </div>

        {/* ═══ SCROLLABLE BODY ═══ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 14px 0",
          }}
        >
          {/* ════════════ F1 · TRIAL BANNER ════════════ */}
          <Reveal delay={80}>
            <div
              style={{
                borderRadius: 22,
                overflow: "hidden",
                position: "relative",
                border: `1px solid ${T.b1}`,
                marginBottom: 14,
                background: T.s1,
              }}
            >
              {/* Ambient glow orbs */}
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -30,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${B.magenta}16, transparent 70%)`,
                  filter: "blur(40px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: -20,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${B.salmon}12, transparent 70%)`,
                  filter: "blur(30px)",
                  pointerEvents: "none",
                }}
              />

              <div style={{ padding: "20px 20px 18px", position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Chip color={B.magenta} icon="✦">
                    PRO TRIAL ACTIVE
                  </Chip>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 5 }}
                  >
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        animation: "countPulse 3s ease infinite",
                      }}
                    >
                      <Grad>27</Grad>
                    </span>
                    <span
                      style={{ fontSize: 11, color: T.t3, fontWeight: 500 }}
                    >
                      days left
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.t1,
                    lineHeight: 1.45,
                    marginBottom: 16,
                  }}
                >
                  <Grad style={{ fontWeight: 900 }}>142 brands</Grad> are
                  actively looking for creators in your niche
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    "Unlimited applies",
                    "50 AI tools/mo",
                    "Priority search",
                    "48hr payouts",
                  ].map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: T.g1,
                        padding: "5px 11px",
                        borderRadius: 100,
                        background: T.g1d,
                        border: `1px solid ${T.g1}18`,
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Gradient bottom line */}
              <div style={{ height: 2, background: B.grad, opacity: 0.5 }} />
            </div>
          </Reveal>

          {/* ════════════ F2 · SETUP CHECKLIST ════════════ */}
          <Reveal delay={200}>
            <div
              style={{
                background: T.s1,
                borderRadius: 22,
                border: `1px solid ${T.b1}`,
                marginBottom: 14,
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setClOpen(!clOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
              >
                <Ring pct={pct} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.t1 }}>
                    Get Your First Brand Deal
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.t3,
                      marginTop: 2,
                      fontWeight: 500,
                    }}
                  >
                    {done.size}/{steps.length} steps
                    {done.size < 5 ? " — keep going!" : " — all done! 🎉"}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: T.t4,
                    transition: "transform .3s",
                    transform: clOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▾
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  padding: "0 20px",
                  marginTop: -6,
                  marginBottom: clOpen ? 4 : 14,
                }}
              >
                <div
                  style={{
                    height: 4,
                    background: T.b1,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: B.grad,
                      borderRadius: 4,
                      transition: "width .6s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                </div>
              </div>

              {clOpen && (
                <div style={{ padding: "4px 20px 18px" }}>
                  {steps.map((s, i) => {
                    const d = done.has(i);
                    const cur = !d && (i === 0 || done.has(i - 1));
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "13px 0",
                          borderTop: i > 0 ? `1px solid ${T.b1}` : "none",
                          opacity: d ? 0.45 : cur ? 1 : 0.55,
                          transition: "opacity .3s",
                        }}
                      >
                        <div
                          onClick={() => toggle(i)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            flexShrink: 0,
                            border: d
                              ? "none"
                              : `2px solid ${cur ? B.salmon : T.b2}`,
                            background: d ? B.grad : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all .3s",
                            boxShadow: d ? `0 0 12px ${B.salmon}30` : "none",
                          }}
                        >
                          {d ? (
                            <span
                              style={{
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              style={{
                                color: T.t4,
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: "'Azeret Mono'",
                              }}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: cur ? 700 : 500,
                              color: d ? T.t3 : T.t1,
                              textDecoration: d ? "line-through" : "none",
                            }}
                          >
                            {s.label}
                          </div>
                          {s.reward && !d && (
                            <div
                              style={{
                                fontSize: 11,
                                color: B.salmon,
                                marginTop: 2,
                                fontWeight: 500,
                              }}
                            >
                              {s.reward}
                            </div>
                          )}
                        </div>
                        {s.cta && !d && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(i);
                            }}
                            style={{
                              padding: cur ? "7px 16px" : "6px 14px",
                              borderRadius: 10,
                              border: cur ? "none" : `1.5px solid ${T.b2}`,
                              background: cur ? B.grad : "transparent",
                              color: cur ? "#fff" : T.t3,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              boxShadow: cur
                                ? `0 4px 16px ${B.salmon}25`
                                : "none",
                              transition: "all .25s",
                            }}
                          >
                            {s.cta}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Reveal>

          {/* ════════════ F3 · LIVE CAMPAIGNS ════════════ */}
          <Reveal delay={360}>
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0 6px",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: T.t1 }}>
                  Live Campaigns
                </span>
                <Chip color={T.g1} icon="●">
                  12 open
                </Chip>
              </div>

              {camps.map((c, i) => (
                <Reveal key={i} delay={420 + i * 70}>
                  <div
                    className="hlift hglow"
                    onMouseEnter={() => setHoveredCamp(i)}
                    onMouseLeave={() => setHoveredCamp(null)}
                    style={{
                      background: T.s1,
                      border: `1px solid ${hoveredCamp === i ? `${c.col}40` : T.b1}`,
                      borderRadius: 18,
                      padding: 18,
                      marginBottom: 10,
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    {/* Niche accent corner */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 80,
                        height: 80,
                        borderRadius: "0 18px 0 80px",
                        background: `${c.col}08`,
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <Av n={c.initial} sz={40} />
                        <div>
                          <div
                            style={{
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: T.t1,
                            }}
                          >
                            {c.brand}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: T.t3,
                              marginTop: 2,
                              fontWeight: 500,
                            }}
                          >
                            {c.type} · Closes in {c.close}
                          </div>
                        </div>
                      </div>
                      <Chip color={c.col}>{c.niche}</Chip>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{ fontSize: 18, fontWeight: 800, color: T.g1 }}
                      >
                        {c.pay}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: T.a1,
                          fontWeight: 700,
                          fontFamily: "'Azeret Mono'",
                        }}
                      >
                        {c.spots}/{c.tot} spots
                      </span>
                    </div>

                    {/* Spot indicator bars */}
                    <div
                      style={{ display: "flex", gap: 2.5, marginBottom: 14 }}
                    >
                      {Array.from({ length: c.tot }).map((_, j) => (
                        <div
                          key={j}
                          style={{
                            flex: 1,
                            height: 3.5,
                            borderRadius: 2,
                            background:
                              j < c.tot - c.spots ? T.t4 : `${T.g1}35`,
                            transition: "background .3s",
                          }}
                        />
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "11px 0",
                        textAlign: "center",
                        borderRadius: 12,
                        background: `${B.salmon}10`,
                        border: `1.5px dashed ${B.salmon}30`,
                        fontSize: 12,
                        fontWeight: 700,
                        color: B.salmon,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "background .2s",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>🔗</span>Complete profile
                      to apply
                    </div>
                  </div>
                </Reveal>
              ))}

              <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
                <span
                  style={{ fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  <Grad>View all 12 campaigns →</Grad>
                </span>
              </div>
            </div>
          </Reveal>

          {/* ════════════ F4 · AI MEDIA KIT ════════════ */}
          <Reveal delay={600}>
            <GBorder r={22} style={{ marginBottom: 14 }}>
              <div style={{ padding: 20, borderRadius: 21 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: T.t1 }}>
                    Your AI Media Kit
                  </span>
                  <Chip color={B.blue}>Free with trial</Chip>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    border: `1px solid ${T.b1}`,
                    background: T.bg,
                  }}
                >
                  {/* Kit preview */}
                  <div
                    style={{
                      background: B.gradSoft,
                      padding: "28px 20px 22px",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse at top, ${B.purple}0C, transparent 60%)`,
                      }}
                    />
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: B.grad,
                        margin: "0 auto 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        border: `3px solid ${T.bg}`,
                        boxShadow: `0 0 30px ${B.salmon}22`,
                        animation: "glow 3s ease infinite",
                        position: "relative",
                      }}
                    >
                      👤
                    </div>

                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: T.t1,
                        position: "relative",
                      }}
                    >
                      Your Name
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: T.t3,
                        marginTop: 3,
                        fontWeight: 500,
                        position: "relative",
                      }}
                    >
                      @handle · Your Niche
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 32,
                        marginTop: 18,
                        position: "relative",
                      }}
                    >
                      {[
                        { v: "—", l: "Followers" },
                        { v: "—", l: "Eng. Rate" },
                        { v: "—", l: "Avg. Views" },
                      ].map((s, i) => (
                        <div key={i}>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 900,
                              color: T.t4,
                            }}
                          >
                            {s.v}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: T.t4,
                              marginTop: 3,
                              fontFamily: "'Azeret Mono'",
                              fontWeight: 500,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{ padding: "18px 20px 20px", textAlign: "center" }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: T.t2,
                        lineHeight: 1.55,
                        marginBottom: 14,
                        fontWeight: 500,
                      }}
                    >
                      Connect Instagram to auto-generate a professional media
                      kit
                    </p>
                    <button
                      style={{
                        width: "100%",
                        padding: "12px 0",
                        borderRadius: 12,
                        border: "none",
                        background: B.grad,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: `0 6px 24px ${B.salmon}30`,
                        transition: "transform .2s, box-shadow .2s",
                      }}
                      onMouseDown={(e) =>
                        (e.currentTarget.style.transform = "scale(0.97)")
                      }
                      onMouseUp={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      Generate My Media Kit →
                    </button>
                  </div>
                </div>
              </div>
            </GBorder>
          </Reveal>

          {/* ════════════ F5 · SOCIAL PROOF ════════════ */}
          <Reveal delay={720}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ padding: "0 6px", marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.t1 }}>
                  Creators Like You
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  padding: "2px 0 10px",
                  scrollSnapType: "x mandatory",
                }}
              >
                {creators.map((c, i) => (
                  <div
                    key={i}
                    className="hlift"
                    style={{
                      minWidth: 230,
                      maxWidth: 230,
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                      background: T.s1,
                      border: `1px solid ${T.b1}`,
                      borderRadius: 18,
                      padding: 18,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <Av n={c.ini} sz={34} grad />
                      <div>
                        <div
                          style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}
                        >
                          {c.n}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: T.t3,
                            fontWeight: 500,
                          }}
                        >
                          {c.nich}
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 12.5,
                        color: T.t2,
                        fontStyle: "italic",
                        lineHeight: 1.55,
                        marginBottom: 14,
                        minHeight: 40,
                        fontWeight: 500,
                      }}
                    >
                      "{c.q}"
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: T.g1d,
                      }}
                    >
                      <span
                        style={{ fontSize: 19, fontWeight: 900, color: T.g1 }}
                      >
                        {c.earn}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: T.g1,
                          opacity: 0.7,
                          fontWeight: 500,
                        }}
                      >
                        in {c.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ════════════ F6 · AI TOOLS ════════════ */}
          <Reveal delay={820}>
            <div
              style={{
                background: T.s1,
                borderRadius: 22,
                border: `1px solid ${T.b1}`,
                padding: "18px 18px 14px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: T.t1 }}>
                  AI Creator Tools
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: T.t4,
                    fontFamily: "'Azeret Mono'",
                    fontWeight: 500,
                  }}
                >
                  0/50 used · all free
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {tools.map((t, i) => (
                  <div
                    key={i}
                    className="hlift"
                    onMouseEnter={() => setHoveredTool(i)}
                    onMouseLeave={() => setHoveredTool(null)}
                    style={{
                      padding: "16px 8px 12px",
                      textAlign: "center",
                      background: T.bg,
                      borderRadius: 16,
                      border: `1.5px solid ${t.hot ? `${B.salmon}35` : hoveredTool === i ? `${B.salmon}25` : T.b1}`,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      transition: "border-color .25s",
                    }}
                  >
                    {t.hot && (
                      <div
                        className="shimmer-bg"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 16,
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontSize: 24,
                        position: "relative",
                        marginBottom: 4,
                      }}
                    >
                      {t.ico}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: T.t1,
                        position: "relative",
                      }}
                    >
                      {t.n}
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        marginTop: 3,
                        fontFamily: "'Azeret Mono'",
                        position: "relative",
                        color: t.hot ? B.salmon : T.t4,
                        fontWeight: t.hot ? 700 : 400,
                      }}
                    >
                      {t.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ════════════ F7 · COMMUNITY ════════════ */}
          <Reveal delay={920}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ padding: "0 6px", marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.t1 }}>
                  Creator Community
                </span>
              </div>

              {threads.map((t, i) => (
                <div
                  key={i}
                  className="hglow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "15px 18px",
                    marginBottom: 8,
                    background: T.s1,
                    borderRadius: 16,
                    border: `1px solid ${T.b1}`,
                    cursor: "pointer",
                    transition: "border-color .2s",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: T.t1,
                        lineHeight: 1.45,
                      }}
                    >
                      {t.t}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 6,
                        fontSize: 10.5,
                        fontFamily: "'Azeret Mono'",
                        color: T.t4,
                        fontWeight: 500,
                      }}
                    >
                      <span>💬 {t.rep}</span>
                      {t.hot && (
                        <span style={{ color: T.a1 }}>🔥 trending</span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: T.t4, fontSize: 18, fontWeight: 300 }}>
                    ›
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <div style={{ height: 16 }} />
        </div>

        {/* ═══ BOTTOM NAV ═══ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "6px 8px 18px",
            flexShrink: 0,
            borderTop: `1px solid ${T.b1}`,
            background: `${T.s1}F0`,
            backdropFilter: "blur(24px)",
          }}
        >
          {navItems.map((n, i) => {
            const act = activeNav === i;
            return (
              <div
                key={i}
                onClick={() => setActiveNav(i)}
                style={{
                  textAlign: "center",
                  flex: 1,
                  cursor: "pointer",
                  padding: "4px 0",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    lineHeight: 1,
                    marginBottom: 2,
                    filter: act ? "none" : "grayscale(.7) opacity(.4)",
                    transition: "filter .2s",
                  }}
                >
                  {n.ico}
                </div>
                {act && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: B.grad,
                      margin: "2px auto 0",
                    }}
                  />
                )}
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: act ? 800 : 500,
                    color: act ? T.t1 : T.t4,
                    marginTop: 1,
                    transition: "color .2s",
                  }}
                >
                  {n.l}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
