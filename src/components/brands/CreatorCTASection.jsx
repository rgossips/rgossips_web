import { MessageCircle, Instagram, Hash } from "lucide-react";

export function CreatorCTASection() {
  return (
    <section className="w-full px-4 lg:px-6 text-center">
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
  );
}
