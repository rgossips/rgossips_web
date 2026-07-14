"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Footer = () => {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Only links that point at a real route or external resource. Dead links
  // were trimmed — add them back as content is written. `name` is a message
  // key resolved via t(`links.${name}`) at render.
  const navigation = {
    platform: [
      { name: "forBrands", href: "/brands" },
      { name: "forInfluencers", href: "/influencer" },
      // Landing-page pricing section (public) — /influencer/pricing is
      // behind auth and dead-ends logged-out visitors.
      { name: "pricing", href: "/#pricing" },
    ],
    legal: [
      { name: "privacy", href: "/consent/privacy" },
      { name: "refund", href: "/consent/refund" },
      { name: "influencerConsent", href: "/consent/influencer" },
      { name: "brandConsent", href: "/consent/brand" },
    ],
    social: [
      { Icon: FaInstagram, href: "https://www.instagram.com/rgossips.agency/" },
      {
        Icon: FaWhatsapp,
        href: "https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146",
      },
    ],
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");

    try {
      // Add email to Firestore collection 'subscribers'
      await addDoc(collection(db, "subscribers"), {
        email: email,
        subscribedAt: serverTimestamp(),
      });
      setMessage(t("subscribeSuccess"));
      setEmail(""); // Clear input
    } catch (error) {
      console.error("Error adding document: ", error);
      setMessage(t("subscribeError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#0a051a] text-slate-400 py-16 px-6 md:px-12 lg:px-20 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-white text-3xl font-bold tracking-tight">RGossips</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{t("tagline")}</p>
            <p className="text-white text-sm font-medium pt-2">{t("newsletterPrompt")}</p>

            {/* Newsletter Subscription */}
            <div className="flex gap-2 pt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder={t("emailPlaceholder")}
                className="bg-[#1a142c] border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white w-full max-w-[280px]"
              />
              <button disabled={loading} onClick={handleSubscribe} className="px-6 py-3 cursor-pointer bg-[#6C4DFF] text-white rounded-xl font-semibold text-sm hover:bg-[#5b21b6] transition-all">
                {t("subscribe")}
              </button>
            </div>
            {message && <div className="text-[#6C4DFF] font-semiboldm">{message}</div>}

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-4">
              {navigation.social.map((social, i) => (
                <Link
                  key={i}
                  target="_blank"
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-[#1a142c] flex items-center justify-center hover:bg-white/10 transition-all border border-slate-700/50"
                >
                  <social.Icon size={16} className="text-slate-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 gap-8">
            {[
              { key: "platform", title: t("sections.platform"), links: navigation.platform },
              { key: "legal", title: t("sections.legal"), links: navigation.legal },
            ].map((section) => (
              <div key={section.key}>
                <h4 className="text-white font-semibold mb-6 text-sm tracking-wide">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                        {t(`links.${link.name}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500">
          <p>{t("copyright", { year: currentYear })}</p>

          <div className="flex items-center gap-6">
            <span>{t("stats.brands")}</span>
            <span>•</span>
            <span>{t("stats.influencers")}</span>
            <span>•</span>
            <span>{t("stats.iso")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
