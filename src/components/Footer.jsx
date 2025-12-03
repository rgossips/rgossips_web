"use client";

import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaDribbble,
  FaInstagram,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#f8fafc] text-gray-600 px-6 sm:px-12 md:px-20 lg:px-24 py-16 z-50">
      <div className="w-full flex flex-col md:flex-row gap-5 md:gap-0 items-center justify-between mb-10">
        <div className="text-3xl font-bold text-black">Logo</div>
        <div className="flex items-center gap-5 md:gap-3 font-semibold text-xl md:text-2xl text-black">
          <div className="cursor-pointer">Our Blog</div>
          <div className="cursor-pointer">My Projects</div>
          <div className="cursor-pointer">Contact </div>
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row justify-between items-center md:items-start gap-10 border-t border-gray-300 pt-10">
        {/* Logo + Address */}
        <div className="flex-1">
          <p className="text-gray-500 mb-1">Germany —</p>
          <p className="text-gray-500">785 15h Street, Office 478</p>
          <p className="text-gray-500">Berlin, De 81566</p>
        </div>

        {/* Contact */}
        <div className="flex-1">
          <p className="font-semibold text-2xl text-black mb-1">
            +1840 841 25 69
          </p>
          <p className="text-gray-500 text-lg underline cursor-pointer hover:text-black">
            info@email.com
          </p>
        </div>

        {/* Subscribe */}
        <div className="flex items-center justify-center flex-col text-lg text-gray-500">
          <p>Get Fresh Updates.</p>
          <p className="text-black font-medium">Just Subscribe</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 gap-6">
        {/* Copyright */}
        <p className="text-gray-500 text-sm">
          AncoraThemes © 2025. All Rights Reserved.
        </p>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          {[FaFacebookF, FaTwitter, FaDribbble, FaInstagram].map((Icon, i) => (
            <div
              key={i}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow hover:bg-black hover:text-white transition-all duration-300 cursor-pointer"
            >
              <Icon size={18} />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
