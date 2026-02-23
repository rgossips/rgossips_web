"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import logo from "@/assets/logo2.png";
import { useRouter } from "next/navigation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  const footerLinks = {
    product: [
      { name: "Features", href: "/" }, // Set to root as requested
      { name: "For Brands", href: "/brands" }, // Set to /brands
      { name: "For Influencers", href: "/influencer" }, // Set to /influencers
      { name: "Categories", href: "#" },
      { name: "FAQ", href: "/" }, // Set to root as requested
    ],
    legal: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Cookies", href: "#" },
    ],
  };

  return (
    <footer className="bg-[#0f172a] text-slate-400 py-16 px-6 md:px-12 lg:px-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <Image src={logo} alt="Recent Gossip" width={250} />
            </div>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              The all-in-one platform connecting brands with perfect
              influencers. Launch campaigns, track performance, and drive real
              results.
            </p>
            <div className="flex items-center gap-4">
              {[
                {
                  Icon: FaInstagram,
                  href: "https://www.instagram.com/rgossips_/",
                },
                { Icon: FaYoutube, href: "#" },
                { Icon: FaLinkedinIn, href: "#" },
              ].map((social, i) => (
                <Link
                  key={i}
                  target="_blank" // Fixed to "_blank"
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 border border-slate-700/50"
                >
                  <social.Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Column */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
              Product
            </h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <div
                    onClick={() => {
                      if (
                        link.href == "/influencer" ||
                        link.href == "/brands"
                      ) {
                        //check login

                        router.push(link.href);
                      } else {
                        router.push(link.href);
                      }
                    }}
                    className="hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                  >
                    {link.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="md:col-span-5 space-y-6">
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
              Stay Updated
            </h4>
            <p className="text-slate-400">
              Get the latest influencer marketing insights
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
              />
              <button className="h-12 px-8 cursor-pointer bg-gradient-to-r from-[#155DFC] to-[#9810FA] text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <p>© {currentYear} Recent Gossip. All rights reserved.</p>

          <div className="flex items-center gap-8">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
