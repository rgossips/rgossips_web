"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Star,
  CheckCircle2,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Gift,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CampaignOverview() {
  const t = useTranslations("CampaignOverview");
  return (
    <div className="space-y-10">
      {/* About Campaign */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800">
          {t("aboutCampaign.title")}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t("aboutCampaign.description")}
        </p>
      </section>

      {/* Requirements */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">
          {t("requirements.title")}
        </h3>
        <div className="grid gap-3">
          {[
            {
              label: t("requirements.minFollowers.label"),
              sub: t("requirements.minFollowers.sub"),
              icon: <Users size={18} />,
            },
            {
              label: t("requirements.engagement.label"),
              sub: t("requirements.engagement.sub"),
              icon: <TrendingUp size={18} />,
            },
            {
              label: t("requirements.niche.label"),
              sub: t("requirements.niche.sub"),
              icon: <Star size={18} />,
            },
            {
              label: t("requirements.activeProfile.label"),
              sub: t("requirements.activeProfile.sub"),
              icon: <History size={18} />,
            },
          ].map((req, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-50 shadow-sm"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                {req.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{req.label}</p>
                <p className="text-[11px] text-slate-400">{req.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment & Benefits */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {t("payment.title")}
          </h3>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-tight">
            <ShieldCheck size={12} /> {t("payment.verified")}
          </span>
        </div>

        <div className="space-y-3">
          {[
            {
              label: t("payment.basePayment.label"),
              val: "₹25,000",
              icon: <Wallet className="text-emerald-500" />,
            },
            {
              label: t("payment.performanceBonus.label"),
              val: "₹5,000",
              sub: t("payment.performanceBonus.sub"),
              icon: <TrendingUp className="text-blue-500" />,
            },
            {
              label: t("payment.productWorth.label"),
              val: t("payment.productWorth.val"),
              sub: t("payment.productWorth.sub"),
              icon: <Gift className="text-purple-500" />,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-50 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {item.label}
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {item.val}
                  </p>
                </div>
              </div>
              {item.sub && (
                <p className="text-[9px] font-bold text-slate-400 max-w-[80px] text-right">
                  {item.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* About Brand */}
      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#B38B59] rounded-2xl flex items-center justify-center text-white font-bold text-xl border-4 border-slate-50">
            SB
          </div>
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-1">
              StyleBrand Co.{" "}
              <CheckCircle2 size={14} className="text-blue-500 fill-blue-50" />
            </h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
              <Star size={12} className="text-slate-200 fill-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                4.8
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("aboutBrand.stats.campaigns"), val: "156" },
            { label: t("aboutBrand.stats.success"), val: "94%" },
            { label: t("aboutBrand.stats.response"), val: "24h" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-2 bg-slate-50/50 rounded-2xl">
              <p className="text-xs font-black text-slate-800">{stat.val}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
