"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does Recent Gossip work?",
    answer:
      "Recent Gossip connects brands with top-tier influencers through an automated discovery and campaign management system. We use data-driven insights to ensure the perfect match for your target audience.",
  },
  {
    question: "What types of influencers are on the platform?",
    answer:
      "Our network includes nano, micro, and mega-influencers across various niches including fashion, tech, lifestyle, and gaming, primarily on Instagram, TikTok, and YouTube.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Registration is free for both brands and influencers. We offer various tiered partnership models and take a small service fee only when a successful collaboration is completed.",
  },
  {
    question: "How do you verify influencer authenticity?",
    answer:
      "We use advanced AI audit tools to check for fake followers, engagement consistency, and audience demographics to ensure you only work with authentic creators.",
  },
  {
    question: "Can I track campaign performance?",
    answer:
      "Yes, our dashboard provides real-time analytics including reach, impressions, click-through rates, and conversion tracking for every influencer in your campaign.",
  },
  {
    question: "What platforms do you support?",
    answer:
      "Currently, we provide deep integration with Instagram, TikTok, YouTube, and X (formerly Twitter).",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments are held in a secure escrow system and are only released to the influencer once the brand approves the content delivery as per the agreement.",
  },
  {
    question: "Is there a contract required?",
    answer:
      "Every collaboration on our platform is protected by a standardized digital agreement that outlines deliverables, timelines, and usage rights.",
  },
];

export default function FaqSection() {
  return (
    <section className="w-full bg-slate-50/30 py-24 px-4 md:px-8">
      {/* Badge & Heading */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-purple-50 border border-purple-100 shadow-sm">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold tracking-widest text-purple-600 uppercase">
            FAQ
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Frequently Asked{" "}
          <span className="bg-linear-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
            Questions
          </span>
        </h2>

        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Everything you need to know about Recent Gossip
        </p>
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
              <AccordionTrigger className="text-base cursor-pointer md:text-lg font-bold text-slate-700 hover:no-underline text-left py-5">
                {item.question}
              </AccordionTrigger>

              <AccordionContent className="text-slate-500 text-base md:text-lg leading-relaxed pb-6 font-medium">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Footer Support Card */}
      <div className="max-w-4xl mx-auto mt-20">
        <div className="bg-linear-to-b from-[#EFF6FF] to-[#FAF5FF] border border-slate-100 rounded-[2.5rem] p-10 md:p-14 text-center shadow-inner">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Still have questions?
          </h3>
          <p className="text-slate-500 text-lg mb-10 font-medium">
            Our support team is here to help you get started
          </p>
          <Button className="h-14 cursor-pointer px-10 bg-linear-to-r from-[#155DFC] to-[#9810FA] text-white rounded-2xl text-lg font-bold transition-all shadow-lg shadow-blue-100">
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  );
}
