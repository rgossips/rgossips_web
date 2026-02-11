import React from "react";
import {
  CheckCircle,
  Eye,
  BarChart3,
  Users,
  Bookmark,
  Star,
  Share2,
  ExternalLink,
  ChevronRight,
  Heart,
} from "lucide-react";

export const CampaignCompletedView = () => {
  const deliveredContent = [
    {
      type: "REEL",
      title: "Summer Style Guide",
      views: "125K",
      likes: "8.2K",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80",
    },
    {
      type: "POST",
      title: "Product Showcase",
      views: "85K",
      likes: "4.5K",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Payment Status Card */}
      <div className="bg-[#F2FCF9] rounded-[24px] p-5 border border-emerald-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00BA88] rounded-full flex items-center justify-center text-white">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Payment Status
            </p>
            <p className="text-sm font-black text-[#00BA88]">Paid</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Amount
          </p>
          <p className="text-xl font-black text-slate-900">₹22,500</p>
        </div>
      </div>

      {/* Performance Highlights */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#8B5CF6] rounded-xl flex items-center justify-center text-white">
            <BarChart3 size={16} />
          </div>
          <h3 className="font-black text-slate-900">Performance Highlights</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <HighlightCard
            label="Total Views"
            value="287.5K"
            icon={<Eye size={14} />}
            color="bg-orange-50 text-orange-500"
          />
          <HighlightCard
            label="Engagement"
            value="5.8%"
            icon={<Heart size={14} />}
            color="bg-emerald-50 text-emerald-500"
          />
          <HighlightCard
            label="Reach"
            value="320K"
            icon={<Users size={14} />}
            color="bg-blue-50 text-blue-500"
          />
          <HighlightCard
            label="Saves"
            value="12.4K"
            icon={<Bookmark size={14} />}
            color="bg-amber-50 text-amber-500"
          />
        </div>
      </div>

      {/* 3. Content Delivered Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">
          Content Delivered
        </h3>
        <div className="space-y-3">
          {deliveredContent.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  className="w-full h-full object-cover"
                  alt={item.title}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-[#B38B59] uppercase tracking-widest mb-0.5">
                  {item.type}
                </p>
                <h4 className="text-sm font-bold text-slate-800 truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <ExternalLink size={10} /> {item.views}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    ❤️ {item.likes}
                  </span>
                </div>
              </div>

              <ChevronRight
                size={18}
                className="text-slate-300 mr-2 group-hover:text-slate-500 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Brand Feedback */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-900">Brand Feedback</h3>
          <div className="flex gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
          <div className="w-10 h-10 bg-[#00BA88] rounded-xl flex items-center justify-center text-white font-bold">
            GB
          </div>
          <div>
            <p className="text-xs font-black text-slate-900">GreenEarth Co.</p>
            <p className="text-[10px] font-bold text-slate-400">
              Brand Partner
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-500 italic leading-relaxed">
          "Outstanding collaboration! Professional content delivery and
          exceptional engagement rates. Highly recommend!"
        </p>
      </div>

      {/* Congratulations Card */}
      <div className="bg-[#FAF9F6] rounded-[32px] p-8 text-center border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-[#B38B59] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
          <Star size={32} />
        </div>
        <h4 className="text-lg font-black text-slate-900 mb-2">
          Congratulations! 🎉
        </h4>
        <p className="text-xs font-bold text-slate-400 mb-6">
          You've successfully completed this campaign with outstanding results.
        </p>
        <button className="w-full h-12 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
          <Share2 size={18} /> Share Results
        </button>
      </div>
    </div>
  );
};

const HighlightCard = ({ label, value, icon, color }) => (
  <div
    className={`p-4 rounded-2xl border border-slate-50 ${color.split(" ")[0]}`}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <span className={color.split(" ")[1]}>{icon}</span>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
    </div>
    <p className="text-lg font-black text-slate-900">{value}</p>
  </div>
);
