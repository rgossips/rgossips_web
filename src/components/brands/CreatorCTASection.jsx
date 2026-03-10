import { MessageCircle, Instagram, Hash } from "lucide-react";

export function CreatorCTASection() {
  return (
    <>
      <section className="w-full px-4 lg:px-6 text-center lg:hidden">
        <h2 className="text-xl font-semibold text-gray-900">
          Home of creator collaborations.
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          One place. Every Creator Need 🎯
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <button className="flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 rounded-full hover:bg-green-600 transition">
            <MessageCircle size={18} />
            Talk to us
          </button>

          <button className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition">
            <Instagram size={18} />
            Follow us
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center text-gray-400 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Hash size={14} />
            <span>Recentgossips</span>
          </div>

          <p>© 2026 recentgossips. All rights reserved.</p>
        </div>
      </section>

      <div className="w-full max-w-5xl mx-auto p-4 pb-20">
        {/* Main Container */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-slate-100 rounded-[32px] p-6 md:p-10 shadow-sm">
          {/* Left Section: Icon and Text */}
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            {/* Brand Icon */}
            <div className="w-16 h-16 bg-[#131722] rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <span className="text-white text-3xl font-bold">#</span>
            </div>

            {/* Heading and Subtext */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                Home of creator collaborations.
              </h2>
              <p className="text-slate-500 text-sm md:text-base mt-1 font-medium">
                One place. Every Creator Need 🎯
              </p>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* WhatsApp Button */}
            <button className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all w-full sm:w-auto">
              <MessageCircle size={20} fill="white" />
              WhatsApp Us
            </button>

            {/* Instagram Button */}
            <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold text-sm transition-all w-full sm:w-auto shadow-sm">
              <Instagram size={20} className="text-slate-600" />
              Follow Us
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
