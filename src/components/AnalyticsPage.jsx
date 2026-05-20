"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  Coins,
  Eye,
  Heart,
  Star,
  Search,
  Target,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const RUPEE = "₹";

const formatINR = (n) => {
  if (!Number.isFinite(n) || n <= 0) return `${RUPEE}0`;
  if (n >= 10_00_000) return `${RUPEE}${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_00_000) return `${RUPEE}${(n / 1_00_000).toFixed(2)}L`;
  return `${RUPEE}${n.toLocaleString("en-IN")}`;
};

const formatCount = (n) => {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 10_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const parseBudget = (s) => {
  if (typeof s === "number") return s;
  if (!s) return 0;
  const digits = String(s).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const monthLabel = (d) =>
  d.toLocaleDateString("en-IN", { month: "short" });

const initials = (name) =>
  (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 1)
    .join("")
    .toUpperCase();

const BRAND_GRADIENTS = [
  "linear-gradient(135deg,#FF5C8A 0%,#E94560 100%)",
  "linear-gradient(135deg,#A78BFA 0%,#7F47CD 100%)",
  "linear-gradient(135deg,#34D399 0%,#10B981 100%)",
  "linear-gradient(135deg,#FBBF24 0%,#D97706 100%)",
];

// Build the SVG path for a smooth-ish line + filled area chart from monthly values.
function buildChartPaths(values, w = 400, h = 160, padX = 10, padBot = 35, padTop = 20) {
  if (!values || values.length === 0) return { line: "", area: "", points: [] };
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? (w - padX * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = padX + i * stepX;
    const y = h - padBot - ((v / max) * (h - padBot - padTop));
    return { x, y };
  });
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${(h - padBot).toFixed(1)} L${points[0].x.toFixed(1)},${(h - padBot).toFixed(1)} Z`;
  return { line, area, points };
}

const AnalyticsPage = ({ onBack }) => {
  const { user, profile } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
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
          body: JSON.stringify({ influencerId: user.id }),
        });
        const data = await res.json();
        if (!cancelled) setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
      } catch (e) {
        console.error("Failed to fetch campaigns for analytics:", e);
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const aggregates = useMemo(() => {
    const my = campaigns.filter((c) => c.applicationStatus); // only those user applied to
    const completed = my.filter((c) => c.applicationStatus === "completed");
    const approved = my.filter((c) =>
      ["approved", "accepted", "completed", "submitted", "payment"].includes(c.applicationStatus)
    );

    const totalEarnings = completed.reduce((s, c) => s + parseBudget(c.budget), 0);

    // Earnings this month (uses endDate, falls back to applicationDeadline)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const earningsThisMonth = completed
      .filter((c) => {
        const d = c.endDate ? new Date(c.endDate) : c.applicationDeadline ? new Date(c.applicationDeadline) : null;
        return d && d >= thisMonthStart;
      })
      .reduce((s, c) => s + parseBudget(c.budget), 0);

    // Last 6 months earnings buckets
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), value: 0 });
    }
    completed.forEach((c) => {
      const d = c.endDate ? new Date(c.endDate) : c.applicationDeadline ? new Date(c.applicationDeadline) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.value += parseBudget(c.budget);
    });
    const earningsTrend = (() => {
      if (months.length < 2) return null;
      const lastTwo = months.slice(-2).map((m) => m.value);
      if (lastTwo[0] === 0) return lastTwo[1] > 0 ? 100 : null;
      const pct = ((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100;
      return Number.isFinite(pct) ? Math.round(pct) : null;
    })();

    // Earnings by category
    const catMap = new Map();
    completed.forEach((c) => {
      const cat = (c.tags && c.tags[0]) || "Other";
      const cur = catMap.get(cat) || { name: cat, count: 0, total: 0 };
      cur.count += 1;
      cur.total += parseBudget(c.budget);
      catMap.set(cat, cur);
    });
    const earningsByCategory = [...catMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    // Brands worked with — unique by brand name from completed applications
    // only. A brand only counts once the campaign actually wrapped, not
    // mid-flight (approved / submitted / payment in progress).
    const brandMap = new Map();
    completed.forEach((c) => {
      const name = c.brandName || "Brand";
      const cur = brandMap.get(name) || { name, count: 0, logo: c.brandLogo };
      cur.count += 1;
      brandMap.set(name, cur);
    });
    const brands = [...brandMap.values()].sort((a, b) => b.count - a.count);
    const repeatCount = brands.filter((b) => b.count > 1).length;

    // Recent — last 4 from approved (sorted by endDate or applicationDeadline desc)
    const sortableDate = (c) =>
      c.endDate ? new Date(c.endDate).getTime() : c.applicationDeadline ? new Date(c.applicationDeadline).getTime() : 0;
    const recent = [...my].sort((a, b) => sortableDate(b) - sortableDate(a)).slice(0, 4);

    // Reach across all my approved/completed campaigns (proxy from profile reach × campaigns)
    const totalReach = profile?.total_reach || 0;

    // Application accept rate
    const acceptRate =
      my.length > 0
        ? Math.round((approved.length / my.length) * 100)
        : 0;

    return {
      totalEarnings,
      earningsThisMonth,
      months,
      earningsTrend,
      earningsByCategory,
      brands,
      repeatCount,
      recent,
      totalReach,
      completedCount: completed.length,
      approvedCount: approved.length,
      myCount: my.length,
      acceptRate,
    };
  }, [campaigns, profile?.total_reach]);

  const chartValues = aggregates.months.map((m) => m.value);
  const chartHasData = chartValues.some((v) => v > 0);
  const { line, area, points } = buildChartPaths(chartValues);

  const audience = profile?.audience_demographics || {};
  const gender = audience.gender || {};
  const ageRanges = Array.isArray(audience.ageRanges) ? audience.ageRanges : [];
  const topCities = Array.isArray(audience.topCities) ? audience.topCities : [];
  const topCountries = Array.isArray(audience.topCountries) ? audience.topCountries : [];

  const engagementPct = profile?.engagement_rate || 0;

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-24 lg:pb-12 lg:pt-24 font-sans text-[#1A1A2E]">
      {/* Header */}
      <div className="sticky top-0 lg:top-20 z-20 bg-[#F7F8FB] border-b border-[#EEF1F6]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-7 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#FCE5EC] text-[#E94560] flex items-center justify-center hover:bg-[#FAD0DD] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl lg:text-[26px] font-bold text-[#1A1A2E] tracking-tight leading-tight">
              Campaign Analytics
            </h1>
            <p className="text-xs lg:text-[13px] text-[#6B7280] mt-0.5">
              Your performance across all campaigns on RGossips
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-7 py-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            iconClass="bg-gradient-to-br from-[#34D399] to-[#10B981]"
            icon={<Coins size={18} />}
            label="Total earnings"
            value={formatINR(aggregates.totalEarnings)}
            sub={
              aggregates.earningsThisMonth > 0 ? (
                <span className="text-[#10B981] flex items-center gap-1">
                  <TrendingUp size={11} /> +{formatINR(aggregates.earningsThisMonth)} this month
                </span>
              ) : (
                <span className="text-[#6B7280]">no earnings this month</span>
              )
            }
          />
          <KPI
            iconClass="bg-gradient-to-br from-[#FF5C8A] to-[#E94560]"
            icon={<Eye size={18} />}
            label="Total reach"
            value={formatCount(aggregates.totalReach)}
            sub={
              <span className="text-[#6B7280]">
                across {aggregates.myCount} {aggregates.myCount === 1 ? "campaign" : "campaigns"}
              </span>
            }
          />
          <KPI
            iconClass="bg-gradient-to-br from-[#A78BFA] to-[#7F47CD]"
            icon={<Heart size={18} />}
            label="Avg engagement"
            value={`${engagementPct.toFixed(1)}%`}
            sub={<span className="text-[#6B7280]">on your Instagram</span>}
          />
          <KPI
            iconClass="bg-gradient-to-br from-[#FBBF24] to-[#D97706]"
            icon={<Star size={18} />}
            label="Brand rating"
            value={"—"}
            sub={<span className="text-[#6B7280]">no reviews yet</span>}
          />
        </div>

        {/* Earnings chart + Earnings by category */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <Card>
            <CardHeader
              title="Earnings over time"
              sub="last 6 months on RGossips"
              right={
                aggregates.earningsTrend != null && (
                  <span className="bg-gradient-to-r from-[#E94560] to-[#7F47CD] text-white text-[11px] font-semibold px-3 py-1 rounded-xl">
                    {aggregates.earningsTrend >= 0 ? "+" : ""}
                    {aggregates.earningsTrend}%
                  </span>
                )
              }
            />
            <div className="h-40 relative">
              {chartHasData ? (
                <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E94560" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#7F47CD" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E94560" />
                      <stop offset="100%" stopColor="#7F47CD" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#earnGrad)" />
                  <path d={line} stroke="url(#lineGrad)" strokeWidth="2.5" fill="none" />
                  {points.length > 0 && (
                    <>
                      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="9" fill="#E94560" fillOpacity="0.2" />
                      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#E94560" />
                    </>
                  )}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF]">
                  No completed campaigns yet
                </div>
              )}
            </div>
            <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-2 px-1">
              {aggregates.months.map((m) => (
                <span key={m.key}>{m.label}</span>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Earnings by category" sub="where you earn most" />
            {aggregates.earningsByCategory.length === 0 ? (
              <div className="text-xs text-[#9CA3AF] py-6 text-center">
                Complete a campaign to see your category split.
              </div>
            ) : (
              aggregates.earningsByCategory.map((c, i) => (
                <div
                  key={c.name}
                  className={`flex justify-between items-center py-3 ${
                    i < aggregates.earningsByCategory.length - 1 ? "border-b border-[#F1F3F8]" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A2E]">{c.name}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {c.count} {c.count === 1 ? "campaign" : "campaigns"}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold bg-gradient-to-r from-[#E94560] to-[#7F47CD] bg-clip-text text-transparent">
                    {formatINR(c.total)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Demographics + Discovery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Audience demographics" sub="from your Instagram account" />
            {Object.keys(audience).length === 0 ? (
              <div className="text-xs text-[#9CA3AF] py-6 text-center">
                Refresh your Instagram in Profile to see audience insights.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <DemoTitle>Gender</DemoTitle>
                  <DemoRow label="Female" pct={gender.female || 0} />
                  <DemoRow label="Male" pct={gender.male || 0} />
                  <DemoRow label="Other" pct={gender.other || 0} />

                  <DemoTitle className="mt-4">Age</DemoTitle>
                  {ageRanges.length === 0 ? (
                    <div className="text-[11px] text-[#9CA3AF]">Not enough data</div>
                  ) : (
                    ageRanges.slice(0, 5).map((a) => (
                      <DemoRow key={a.range} label={a.range} pct={a.pct || 0} />
                    ))
                  )}
                </div>
                <div>
                  <DemoTitle>Top cities</DemoTitle>
                  {topCities.length === 0 ? (
                    <div className="text-[11px] text-[#9CA3AF]">Not enough data</div>
                  ) : (
                    topCities.slice(0, 4).map((c) => (
                      <DemoRow key={c.name} label={c.name} pct={c.pct || 0} />
                    ))
                  )}

                  <DemoTitle className="mt-4">Countries</DemoTitle>
                  {topCountries.length === 0 ? (
                    <div className="text-[11px] text-[#9CA3AF]">Not enough data</div>
                  ) : (
                    topCountries.slice(0, 3).map((c) => (
                      <DemoRow key={c.name} label={c.name} pct={c.pct || 0} />
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Discovery & growth" sub="across your campaigns" />
            <DiscoveryRow
              iconClass="bg-gradient-to-br from-[#FF5C8A] to-[#E94560]"
              icon={<Eye size={16} />}
              label="Followers"
              value={formatCount(profile?.followers_count || 0)}
              sub={<span className="text-[#9CA3AF]">on Instagram</span>}
            />
            <DiscoveryRow
              iconClass="bg-gradient-to-br from-[#A78BFA] to-[#7F47CD]"
              icon={<Search size={16} />}
              label="Accounts engaged"
              value={formatCount(profile?.accounts_engaged || 0)}
              sub={<span className="text-[#9CA3AF]">last 28 days</span>}
            />
            <DiscoveryRow
              iconClass="bg-gradient-to-br from-[#34D399] to-[#10B981]"
              icon={<Target size={16} />}
              label="Application accept rate"
              value={`${aggregates.acceptRate}%`}
              sub={
                <span className="text-[#9CA3AF]">
                  {aggregates.approvedCount} of {aggregates.myCount}
                </span>
              }
            />
          </Card>
        </div>

        {/* Brands worked with */}
        <Card>
          <CardHeader
            title="Brands you've worked with"
            sub={
              aggregates.brands.length === 0
                ? "no collaborations yet"
                : `${aggregates.brands.length} brand${aggregates.brands.length === 1 ? "" : "s"} · ${aggregates.repeatCount} repeat collaboration${aggregates.repeatCount === 1 ? "" : "s"}`
            }
          />
          {aggregates.brands.length === 0 ? (
            <div className="text-xs text-[#9CA3AF] py-6 text-center">
              Get approved on your first campaign to see brands here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {aggregates.brands.map((b, i) => (
                <BrandTile key={b.name} brand={b} index={i} />
              ))}
            </div>
          )}
        </Card>

        {/* Recent campaigns */}
        <Card>
          <CardHeader
            title="Recent campaigns"
            sub={
              aggregates.recent.length === 0
                ? "no campaigns yet"
                : `your latest ${aggregates.recent.length} campaign${aggregates.recent.length === 1 ? "" : "s"}`
            }
          />
          {aggregates.recent.length === 0 ? (
            <div className="text-xs text-[#9CA3AF] py-6 text-center">
              Apply to a campaign to see it here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <Th>Campaign</Th>
                    <Th>Brand</Th>
                    <Th>Status</Th>
                    <Th align="right">Reach</Th>
                    <Th align="right">Engagement</Th>
                    <Th align="right">Earnings</Th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.recent.map((c) => (
                    <RecentRow key={c.id} c={c} engagementPct={engagementPct} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {loading && (
          <div className="text-xs text-[#9CA3AF] text-center py-2">Loading your campaign data…</div>
        )}
      </div>
    </div>
  );
};

// ──────────── sub-components ────────────

const KPI = ({ iconClass, icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-[#EEF1F6]">
    <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center mb-3 ${iconClass}`}>
      {icon}
    </div>
    <div className="text-[11px] font-semibold text-[#E94560] uppercase tracking-wide mb-1">
      {label}
    </div>
    <div className="text-[22px] lg:text-[26px] font-bold text-[#1A1A2E] tracking-tight">{value}</div>
    <div className="text-xs mt-1 font-medium">{sub}</div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl p-5 border border-[#EEF1F6] ${className}`}>{children}</div>
);

const CardHeader = ({ title, sub, right }) => (
  <div className="flex justify-between items-start mb-4">
    <div>
      <div className="text-base font-semibold text-[#1A1A2E]">{title}</div>
      {sub && <div className="text-xs text-[#9CA3AF] mt-0.5">{sub}</div>}
    </div>
    {right}
  </div>
);

const DemoTitle = ({ children, className = "" }) => (
  <div className={`text-[11px] text-[#9CA3AF] uppercase tracking-wide font-semibold mb-2 ${className}`}>
    {children}
  </div>
);

const DemoRow = ({ label, pct }) => (
  <div className="flex items-center py-1 text-[13px]">
    <span className="text-[#1A1A2E] font-medium w-20 truncate">{label}</span>
    <div className="flex-1 h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden mx-2">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#E94560] to-[#7F47CD]"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
    <span className="text-xs font-bold text-[#1A1A2E] w-9 text-right">{Math.round(pct)}%</span>
  </div>
);

const DiscoveryRow = ({ iconClass, icon, label, value, sub }) => (
  <div className="bg-[#FAFBFC] border border-[#EEF1F6] rounded-xl p-3 flex items-center gap-3 mb-2 last:mb-0">
    <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center flex-shrink-0 ${iconClass}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wide font-semibold">{label}</div>
      <div className="text-[20px] font-bold text-[#1A1A2E] leading-tight">{value}</div>
    </div>
    <div className="text-xs font-medium">{sub}</div>
  </div>
);

const BrandTile = ({ brand, index }) => {
  const gradient = BRAND_GRADIENTS[index % BRAND_GRADIENTS.length];
  return (
    <div className="bg-[#FAFBFC] rounded-2xl p-3.5 text-center border border-[#EEF1F6] relative">
      {brand.count > 1 && (
        <span className="absolute top-2 right-2 bg-gradient-to-r from-[#E94560] to-[#7F47CD] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide">
          {brand.count}×
        </span>
      )}
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logo}
          alt={brand.name}
          className="w-10 h-10 rounded-full object-cover mx-auto mb-2"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-[15px]"
          style={{ background: gradient }}
        >
          {initials(brand.name)}
        </div>
      )}
      <div className="text-[13px] font-semibold text-[#1A1A2E] truncate">{brand.name}</div>
      <div className="text-[11px] text-[#9CA3AF] mt-0.5">
        {brand.count} {brand.count === 1 ? "campaign" : "campaigns"}
      </div>
    </div>
  );
};

const Th = ({ children, align = "left" }) => (
  <th
    className={`text-[11px] text-[#9CA3AF] uppercase tracking-wide font-semibold py-2.5 px-3 border-b border-[#F1F3F8] ${
      align === "right" ? "text-right" : "text-left"
    }`}
  >
    {children}
  </th>
);

const RecentRow = ({ c, engagementPct }) => {
  const status = c.status || "Active";
  const statusClass =
    status === "Completed"
      ? "bg-[#E6F1FB] text-[#1F6FB5]"
      : "bg-gradient-to-r from-[#FFC1D1] to-[#E94560] text-white";
  const earnings = c.applicationStatus === "completed" ? parseBudget(c.budget) : 0;
  // Real per-campaign metrics from refresh-application-metrics, with the
  // influencer-level engagement rate as a fallback when no live links have
  // been measured yet.
  const m = c.applicationMetrics;
  const reach = m?.reach || 0;
  const rowEngagement = m && m.engagement > 0 ? m.engagement : engagementPct;

  return (
    <tr className="hover:bg-[#FAFBFC]">
      <td className="py-3.5 px-3 border-b border-[#F1F3F8]">
        <Link
          href={`/influencer/offers/${c.id}`}
          className="font-semibold text-[#1A1A2E] hover:text-[#E94560] hover:underline cursor-pointer"
        >
          {c.title}
        </Link>
        <div className="text-[11px] text-[#9CA3AF] mt-0.5">{c.deadline || ""}</div>
      </td>
      <td className="py-3.5 px-3 border-b border-[#F1F3F8] text-[#1A1A2E]">
        <Link
          href={`/influencer/campaigns?brand=${encodeURIComponent(c.brandName || "")}`}
          className="hover:text-[#E94560] hover:underline cursor-pointer"
        >
          {c.brandName}
        </Link>
      </td>
      <td className="py-3.5 px-3 border-b border-[#F1F3F8]">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md inline-block ${statusClass}`}>
          {status}
        </span>
      </td>
      <td className="py-3.5 px-3 border-b border-[#F1F3F8] text-right text-[#1A1A2E]">
        {reach > 0 ? formatCount(reach) : "—"}
      </td>
      <td className="py-3.5 px-3 border-b border-[#F1F3F8] text-right text-[#1A1A2E]">
        {rowEngagement > 0 ? `${rowEngagement.toFixed(1)}%` : "—"}
      </td>
      <td className="py-3.5 px-3 border-b border-[#F1F3F8] text-right">
        <span className="font-bold bg-gradient-to-r from-[#E94560] to-[#7F47CD] bg-clip-text text-transparent">
          {earnings > 0 ? formatINR(earnings) : "—"}
        </span>
      </td>
    </tr>
  );
};

export default AnalyticsPage;
