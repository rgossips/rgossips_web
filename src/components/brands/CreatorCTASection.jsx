import { MessageCircle, Instagram, Hash } from "lucide-react";

// Public-facing contact targets. wa.me uses E.164 without the leading +.
const WHATSAPP_URL = "https://wa.me/918802907907";
const INSTAGRAM_URL = "https://www.instagram.com/rgossips.agency/";

export function CreatorCTASection() {
  return (
    <>
      <section className="w-full px-4 lg:px-6 text-center lg:hidden pb-20">
        <h2 className="text-xl font-black bg-gradient-to-r from-[#5B3DF5] to-[#FF4E8E] bg-clip-text text-transparent">
          Home of creator collaborations.
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          One place. Every Creator Need 🎯
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 rounded-full hover:bg-green-600 transition cursor-pointer"
          >
            <MessageCircle size={18} />
            Talk to us
          </a>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition cursor-pointer"
          >
            <Instagram size={18} />
            Follow us
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center text-gray-400 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Hash size={14} />
            <span>Recentgossips</span>
          </div>

          <p>© 2026 recentgossips. All rights reserved.</p>
        </div>
      </section>

      <div className="w-full max-w-5xl mx-auto p-4 pb-20 hidden lg:block">
        {/* Main Container */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-100 rounded-[32px] p-6 md:p-10 shadow-sm">
          {/* Left Section: Icon and Text */}
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            {/* Brand-gradient tile + heading — matches the header's
                purple (#5B3DF5) so the page reads as one system. */}
            <div className="w-16 h-16 bg-gradient-to-br from-[#5B3DF5] to-[#FF4E8E] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <span className="text-white text-3xl font-bold">#</span>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight bg-gradient-to-r from-[#5B3DF5] to-[#FF4E8E] bg-clip-text text-transparent">
                Home of creator collaborations.
              </h2>
              <p className="text-slate-500 text-sm md:text-base mt-1 font-medium">
                One place. Every Creator Need 🎯
              </p>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all w-full sm:w-auto cursor-pointer"
            >
              <MessageCircle size={20} fill="white" />
              WhatsApp Us
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold text-sm transition-all w-full sm:w-auto shadow-sm cursor-pointer"
            >
              <Instagram size={20} className="text-slate-600" />
              Follow Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
