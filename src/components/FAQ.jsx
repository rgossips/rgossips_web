"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, MessageCircle, Instagram } from "lucide-react";

const SUPPORT_EMAIL = "grievance@rgossips.com";
const SUPPORT_WHATSAPP = "https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146";
const SUPPORT_INSTAGRAM = "https://www.instagram.com/rgossips.agency/";

const faqs = [
  { key: "howItWorks" },
  { key: "influencerTypes" },
  { key: "cost" },
  { key: "authenticity" },
  { key: "trackPerformance" },
  { key: "platforms" },
  { key: "payments" },
  { key: "contract" },
];

export default function FaqSection() {
  const t = useTranslations("FAQ");
  return (
    <section className="w-full bg-slate-50/30 py-24 px-4 md:px-8" id="faq">
      {/* Badge & Heading */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-purple-50 border border-purple-100 shadow-sm">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">{t("badge")}</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          {t.rich("heading", { grad: (c) => <span className="bg-linear-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">{c}</span> })}
        </h2>

        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">{t("subheading")}</p>
      </div>

      {/* FAQ Accordion List */}
      <div className="max-w-4xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-slate-200 bg-white rounded-2xl px-6 py-1 transition-all hover:border-blue-200 hover:shadow-md data-[state=open]:border-blue-300 data-[state=open]:shadow-lg shadow-sm"
            >
              <AccordionTrigger className="text-base cursor-pointer md:text-lg font-bold text-slate-700 hover:no-underline text-left py-5">{t(`faqs.${item.key}.question`)}</AccordionTrigger>

              <AccordionContent className="text-slate-500 text-base md:text-lg leading-relaxed pb-6 font-medium">{t(`faqs.${item.key}.answer`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Footer Support Card */}
      <div className="max-w-4xl mx-auto mt-20">
        <div className="bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] border border-slate-100 rounded-[2.5rem] p-10 md:p-14 text-center shadow-inner">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">{t("support.title")}</h3>
          <p className="text-slate-500 text-lg mb-8 font-medium">{t("support.subtitle")}</p>

          {/* Contact options grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-100">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t("contact.emailLabel")}</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors break-all">{SUPPORT_EMAIL}</p>
              </div>
            </a>

            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-100">
                <MessageCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t("contact.whatsappLabel")}</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{t("contact.whatsappValue")}</p>
              </div>
            </a>

            <a
              href={SUPPORT_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl hover:border-pink-200 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center shadow-md shadow-pink-100">
                <Instagram size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t("contact.instagramLabel")}</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors">@rgossips.agency</p>
              </div>
            </a>
          </div>

          <Button asChild className="h-14 cursor-pointer px-10 bg-linear-to-r from-[#155DFC] to-[#9810FA] text-white rounded-2xl text-lg font-bold transition-all shadow-lg shadow-blue-100">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Question%20about%20RGossips`}>{t("support.emailButton")}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
