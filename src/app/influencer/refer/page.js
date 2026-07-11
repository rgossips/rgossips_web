"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Copy, MessageCircle, Trophy, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const STATUS_PILL = {
  PENDING: { label: "Pending", class: "bg-slate-100 text-slate-500" },
  SIGNED_UP: { label: "Signed up", class: "bg-blue-50 text-blue-700" },
  QUALIFIED: { label: "Qualified", class: "bg-amber-50 text-amber-700" },
  REWARDED: { label: "Rewarded", class: "bg-emerald-50 text-emerald-700" },
  REVERSED: { label: "Reversed", class: "bg-rose-50 text-rose-600" },
  EXPIRED: { label: "Expired", class: "bg-slate-100 text-slate-400" },
  MANUAL_REVIEW: { label: "Under review", class: "bg-orange-50 text-orange-700" },
};

const REASON_LABEL = {
  REFERRAL_EARN: "Referral reward",
  WELCOME_BONUS: "Welcome bonus",
  MILESTONE_BONUS: "Milestone bonus",
  LEADERBOARD: "Leaderboard prize",
  REDEMPTION: "Applied to subscription",
  CLAWBACK: "Refund clawback",
  EXPIRY: "Auto-expired",
  ADMIN_ADJUSTMENT: "Admin adjustment",
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function ReferPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [referralCode, setReferralCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [referrals, setReferrals] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: prof }, { data: bal }, { data: availBal }, { data: refs }, { data: led }, { data: board }, { data: rank }] = await Promise.all([
          supabase
            .from("influencer_profiles")
            .select("referral_code")
            .eq("influencer_id", user.id)
            .maybeSingle(),
          supabase
            .from("v_reward_credits_balance")
            .select("balance")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("v_reward_credits_available_balance")
            .select("available_balance, locked_balance")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("referrals")
            .select("id, referral_code, status, referee_first_plan, referrer_reward_rc, created_at, qualified_at, rewarded_at")
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("reward_credits_ledger")
            .select("id, delta_rc, reason, balance_after, expires_at, unlocks_at, created_at, note")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
          // Top 10 referrers this IST month + this user's rank on the
          // same board. Both are SECURITY DEFINER RPCs so they bypass
          // referrals RLS while only exposing public identity fields.
          supabase.rpc("get_referral_leaderboard", { top_n: 10 }),
          supabase.rpc("get_my_referral_rank"),
        ]);
        if (cancelled) return;
        setReferralCode(prof?.referral_code || "");
        setBalance(bal?.balance || 0);
        setAvailableBalance(availBal?.available_balance || 0);
        setLockedBalance(availBal?.locked_balance || 0);
        setReferrals(refs || []);
        setLedger(led || []);
        setLeaderboard(Array.isArray(board) ? board : []);
        setMyRank(Array.isArray(rank) && rank[0] ? rank[0] : null);
      } catch (e) {
        console.error("refer page load failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  // Subscription-locked gate. `subscription_plan` is 'trial' for
  // unpaid users; anything else means they've paid at some point.
  const isSubscribed = profile?.subscription_plan && profile.subscription_plan !== "trial";
  const shareUrl = referralCode ? `https://rgossips.com/login?ref=${referralCode}` : "";

  // Self-heal a missing code. ensureReferralCode normally runs in the
  // payment webhooks, so subscriptions that predate the Refer & Earn
  // deploy — or admin-comped plans that never touch a gateway — have an
  // active plan but no code, which rendered a blank share link. The
  // server re-verifies the subscription before generating.
  useEffect(() => {
    if (loading || !isSubscribed || referralCode || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const { data } = await supabase.functions.invoke("ensure-referral-code", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {},
        });
        if (!cancelled && data?.referralCode) setReferralCode(data.referralCode);
      } catch { /* next visit retries */ }
    })();
    return () => { cancelled = true; };
  }, [loading, isSubscribed, referralCode, user?.id, supabase]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  };

  const shareOnWhatsApp = () => {
    if (!shareUrl) return;
    const msg = `Try RGossips — your first month is 50% off with my link: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <Loader2 size={28} className="animate-spin text-pink-500" />
      </div>
    );
  }

  const qualifiedCount = referrals.filter((r) => r.status === "REWARDED").length;
  const pendingCount = referrals.filter((r) => r.status === "SIGNED_UP" || r.status === "QUALIFIED").length;
  const totalEarned = referrals
    .filter((r) => r.status === "REWARDED")
    .reduce((s, r) => s + (r.referrer_reward_rc || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Refer & Earn</h1>
          <p className="text-sm text-slate-500 mt-1">
            Share RGossips with other creators. When they subscribe to any plan you both win — they get 50% off their first month, you earn Reward Credits (RC) redeemable on your next renewal.
          </p>
        </div>

        {!isSubscribed ? (
          // Gate: only subscribed users can share.
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#9810FA] to-[#E60076] flex items-center justify-center">
              <Sparkles className="text-white" size={28} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Subscribe to unlock referrals</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Refer & Earn is available to paid subscribers. Upgrade to any plan and start sharing your referral link right after.
            </p>
            <button
              onClick={() => router.push("/influencer/pricing")}
              className="btn-purple text-white text-sm font-black py-3 px-6 rounded-2xl shadow-md shadow-pink-100 cursor-pointer"
            >
              See plans
            </button>
          </div>
        ) : (
          <>
            {/* Wallet + Share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Balance card */}
              <div
                className="lg:col-span-1 rounded-3xl p-6 text-white flex flex-col justify-between"
                style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Available RC</p>
                  <p className="text-4xl font-black mt-1">{availableBalance}</p>
                  <p className="text-xs opacity-80 mt-1">
                    ₹{availableBalance} redeemable at checkout
                  </p>
                  {lockedBalance > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-90">
                        Locked
                      </span>
                      <span className="text-[11px] font-black">+{lockedBalance} RC</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] opacity-70 mt-4">
                  {lockedBalance > 0
                    ? "Your welcome bonus unlocks 30 days after signup. Referral rewards are spendable immediately."
                    : "Redeem up to 50% of any plan price at checkout."}
                </p>
              </div>

              {/* Share card */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Your referral link</p>
                  <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <p className="flex-1 text-sm font-mono text-slate-800 truncate">{shareUrl}</p>
                    <button
                      onClick={copyLink}
                      className="shrink-0 text-xs font-black text-pink-500 hover:text-pink-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={shareOnWhatsApp}
                  className="w-full py-3 rounded-2xl bg-[#25D366] text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-100 hover:opacity-90"
                >
                  <MessageCircle size={16} />
                  Share on WhatsApp
                </button>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <StatTile label="Qualified" value={qualifiedCount} />
                  <StatTile label="Pending" value={pendingCount} />
                  <StatTile label="RC earned" value={totalEarned} />
                </div>
              </div>
            </div>

            {/* Reward tiers */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Instant rewards</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <TierTile plan="Starter" price="₹99" rc={50} />
                <TierTile plan="Pro" price="₹299" rc={150} highlight />
                <TierTile plan="Elite" price="₹699" rc={300} />
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-snug">
                RC lands the moment your friend pays. Reversed if they refund within 7 days. Auto-expires 90 days after credit.
              </p>
            </div>

            {/* Monthly leaderboard — self-hides when nobody has qualified
                yet this month. Ranks by RC earned, ties broken by count. */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Top referrers this month
                  </h3>
                  {myRank && (
                    <span className="text-[11px] font-black bg-slate-50 text-slate-700 px-2 py-1 rounded">
                      You: #{myRank.rank}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {leaderboard.map((row) => {
                    const isMe = user?.id === row.referrer_id;
                    return (
                      <div
                        key={row.referrer_id}
                        className={`py-3 flex items-center gap-3 ${isMe ? "bg-pink-50/50 -mx-6 px-6" : ""}`}
                      >
                        <div className="w-7 text-center text-[13px] font-black text-slate-500">
                          #{row.rank}
                        </div>
                        {row.profile_photo_url ? (
                          <img
                            src={row.profile_photo_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 truncate">
                            {row.full_name || row.username || "Unknown"}
                            {isMe && <span className="text-[10px] text-pink-500 font-black ml-1">YOU</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {row.instagram_handle ? `@${row.instagram_handle}` : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">
                            {row.rc_earned} RC
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {row.rewarded_count} referral{row.rewarded_count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Resets on the 1st of each month (IST).
                </p>
              </div>
            )}

            {/* Referrals list */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Your referrals</h3>
              {referrals.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No referrals yet — share your link to get started.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {referrals.map((r) => {
                    const pill = STATUS_PILL[r.status] || { label: r.status, class: "bg-slate-100 text-slate-500" };
                    return (
                      <div key={r.id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900">
                            {r.referee_first_plan ? `${r.referee_first_plan} subscription` : "New referral"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(r.rewarded_at || r.qualified_at || r.created_at)}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${pill.class}`}>
                          {pill.label}
                        </span>
                        {r.status === "REWARDED" && (
                          <span className="text-[13px] font-black text-emerald-600 whitespace-nowrap">
                            +{r.referrer_reward_rc} RC
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ledger */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">RC wallet history</h3>
              {ledger.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Wallet is empty.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ledger.map((row) => {
                    const isLocked =
                      row.unlocks_at && new Date(row.unlocks_at) > new Date() && row.delta_rc > 0;
                    return (
                      <div key={row.id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                            {REASON_LABEL[row.reason] || row.reason}
                            {isLocked && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                Locked
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatDate(row.created_at)}
                            {isLocked && ` · unlocks ${formatDate(row.unlocks_at)}`}
                            {row.expires_at && row.delta_rc > 0 && ` · expires ${formatDate(row.expires_at)}`}
                            {row.note && ` · ${row.note}`}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-black whitespace-nowrap ${
                            row.delta_rc > 0 ? "text-emerald-600" : "text-slate-500"
                          }`}
                        >
                          {row.delta_rc > 0 ? "+" : ""}
                          {row.delta_rc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function TierTile({ plan, price, rc, highlight }) {
  return (
    <div
      className={`rounded-2xl p-4 text-center border ${
        highlight ? "border-pink-200 bg-pink-50" : "border-slate-100 bg-slate-50"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{plan}</p>
      <p className="text-[13px] font-bold text-slate-700 mt-0.5">{price}</p>
      <p className={`text-lg font-black mt-1 ${highlight ? "text-[#E60076]" : "text-slate-900"}`}>+{rc} RC</p>
    </div>
  );
}
