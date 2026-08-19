"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { useGlobal } from "@/context/GlobalContext";

const Footer = () => {
  const t = useTranslations("Footer");
  const router = useRouter();
  const pathname = usePathname();
  const { setScrollTo, setType } = useGlobal();
  const currentYear = new Date().getFullYear();

  // Switch the Audiences tab via GlobalContext (same as the header nav) and
  // scroll to it.
  //
  // The push and the scroll used to race. A push — even to the URL you are
  // already on — makes the App Router scroll the window to top on commit, and
  // that landed on top of (and cancelled) the smooth scroll RGLanding starts
  // 120ms later. From the landing itself, where this footer is most often
  // clicked, the result was a link that visibly did nothing.
  //
  // So: on "/" skip the router entirely and scroll here, and from another page
  // push with `scroll: false` and let RGLanding's effect do it on mount.
  const scrollToAudience = (audienceType) => {
    setType(audienceType);
    if (pathname === "/") {
      document
        .getElementById("brands-influencers-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setScrollTo("brands-influencers-section");
    router.push("/", { scroll: false });
  };

  // Only links that point at a real route or external resource. Dead links
  // were trimmed — add them back as content is written. `name` is a message
  // key resolved via t(`links.${name}`) at render.
  const navigation = {
    platform: [
      { name: "forBrands", onClick: () => scrollToAudience("brands") },
      { name: "forInfluencers", onClick: () => scrollToAudience("influencers") },
      // Landing-page pricing section (public) — /influencer/pricing is
      // behind auth and dead-ends logged-out visitors.
      { name: "pricing", href: "/#pricing" },
      // Public support page. Also the Support URL on both store listings, so
      // it has to stay reachable and linked from somewhere obvious.
      { name: "support", href: "/support" },
    ],
    legal: [
      { name: "privacy", href: "/consent/privacy" },
      { name: "refund", href: "/consent/refund" },
      { name: "influencerConsent", href: "/consent/influencer" },
      { name: "brandConsent", href: "/consent/brand" },
      // Google Play requires the account-deletion route to be discoverable
      // without installing the app; a footer link is the plainest way to
      // satisfy "readily discoverable".
      { name: "deleteAccount", href: "/consent/delete-account" },
    ],
    social: [
      { Icon: FaInstagram, href: "https://www.instagram.com/rgossips.agency/" },
      {
        Icon: FaWhatsapp,
        href: "https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146",
      },
    ],
  };

  return (
    <footer className="bg-[#0a051a] text-slate-400 py-16 px-6 md:px-12 lg:px-20 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-white text-3xl font-bold tracking-tight">RGossips</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{t("tagline")}</p>

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
                      {link.onClick ? (
                        <button onClick={link.onClick} className="text-slate-400 hover:text-white text-sm transition-colors duration-200 text-left cursor-pointer">
                          {t(`links.${link.name}`)}
                        </button>
                      ) : (
                        <Link href={link.href} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                          {t(`links.${link.name}`)}
                        </Link>
                      )}
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
