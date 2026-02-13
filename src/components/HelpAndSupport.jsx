import React from "react";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const HelpSupport = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans lg:px-40 lg:pt-24">
      {/* Header - Matching previous screens */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-20 px-6 py-5 flex items-center gap-4 border-b border-gray-50">
        <button
          onClick={onBack}
          className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-xl active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-xl font-black tracking-tight text-gray-900">
          Help & Support
        </h1>
      </div>

      <div className="px-5 pt-6 space-y-8">
        {/* Search Bar - Removed extra pink, made cleaner */}
        <div className="relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full bg-white border border-gray-100 rounded-xl py-5 pl-14 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-pink-50 transition-all placeholder:text-gray-300 shadow-sm"
          />
        </div>

        {/* Contact Us Section */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            Contact Us
          </h3>
          <div className="space-y-3 grid grid-cols-1 lg:grid-cols-3 lg:gap-4">
            <ContactCard
              icon={<MessageCircle size={22} />}
              title="Live Chat"
              subtitle="Chat with our support team"
              iconBg="bg-blue-500"
            />
            <ContactCard
              icon={<Mail size={22} />}
              title="Email Support"
              subtitle="support@mywall.com"
              iconBg="bg-pink-500"
            />
            <ContactCard
              icon={<Phone size={22} />}
              title="Call Us"
              subtitle="1-800-MY-WALL"
              iconBg="bg-emerald-500"
            />
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-gray-400 ml-2 uppercase tracking-[0.15em]">
            Frequently Asked Questions
          </h3>

          <FAQGroup icon="🚀" title="Getting Started">
            <FAQItem label="How do I create my profile?" />
            <FAQItem label="How do campaigns work?" />
            <FAQItem label="What are the requirements?" />
          </FAQGroup>

          <FAQGroup icon="💰" title="Payments">
            <FAQItem label="When will I get paid?" />
            <FAQItem label="What payment methods are supported?" />
            <FAQItem label="Are there any fees?" />
          </FAQGroup>
        </section>

        {/* Help Center CTA - High Contrast */}
        <div className="bg-linear-to-b from-[#FEF3C7] to-[#f7f5c9] p-6 rounded-xl border border-gray-50 space-y-5 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 flex items-center justify-center bg-linear-to-b from-[#B68C4A] to-[#9A7238] text-white rounded-xl aspect-square shadow-lg shadow-amber-100">
              <HelpCircle size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-gray-900">
                Need More Help?
              </h4>
              <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                Visit our comprehensive help center for detailed guides and
                tutorials.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <button className="px-3 mx-auto py-4 bg-linear-to-b from-[#B68C4A] to-[#9A7238] text-white rounded-[1.25rem] text-sm font-black shadow-xl active:scale-[0.98] transition-all">
              Visit Help Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactCard = ({ icon, title, subtitle, iconBg }) => (
  <div className="flex items-center gap-5 p-5 bg-white border border-gray-50 rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer group">
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-xl text-white ${iconBg} shadow-lg shadow-gray-100`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-black text-gray-900">{title}</h4>
      <p className="text-[11px] font-bold text-gray-400">{subtitle}</p>
    </div>
    <ChevronRight
      size={18}
      className="text-gray-300 group-hover:text-pink-500 transition-colors"
    />
  </div>
);

const FAQGroup = ({ icon, title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 ml-2">
      <span className="text-xl">{icon}</span>
      <h4 className="text-sm font-black text-gray-800 tracking-tight">
        {title}
      </h4>
    </div>
    <div className="bg-white border border-gray-50 rounded-xl overflow-hidden shadow-sm">
      {children}
    </div>
  </div>
);

const FAQItem = ({ label }) => (
  <button className="w-full cursor-pointer flex items-center justify-between p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
    <span className="text-base font-bold text-gray-700 group-hover:text-gray-900">
      {label}
    </span>
    <ChevronRight
      size={18}
      className="text-gray-200 group-hover:text-pink-500 transition-colors"
    />
  </button>
);

export default HelpSupport;
