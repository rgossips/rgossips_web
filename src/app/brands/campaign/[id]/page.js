import React from "react";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  MapPin,
  Instagram,
  Users,
  Briefcase,
  Calendar,
  Eye,
  Send,
  ArrowRight,
  TrendingUp,
  Package,
} from "lucide-react";
import Image from "next/image";

const CampaignDetails = () => {
  return (
    <div className="bg-[#F8F9FE] min-h-screen">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-50">
        <button className="p-2 -ml-2 rounded-full hover:bg-gray-50">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <button className="p-2 -mr-2 rounded-full hover:bg-gray-50">
          <Share2 size={24} className="text-gray-900" />
        </button>
      </nav>

      {/* Main Content Card */}
      <div className="px-6 pt-4">
        <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  height={56}
                  width={56}
                  src="https://i.pravatar.cc/150?u=brand"
                  className="w-14 h-14 rounded-full border-2 border-[#5851DB] p-0.5 object-cover"
                  alt="Brand"
                />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-1">
                  Saher Nadeem{" "}
                  <CheckCircle2
                    size={14}
                    className="text-[#5851DB] fill-[#5851DB]/10"
                  />
                </h2>
                <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                  Founder @Workstop • 13m ago
                </p>
              </div>
            </div>
            <button className="text-[11px] font-bold text-[#5851DB]">
              View Profile
            </button>
          </div>

          <button className="w-full py-4 bg-[#5851DB] text-white rounded-2xl font-bold flex items-center justify-center gap-2 mb-6 shadow-lg shadow-purple-100">
            Submit Proposal <ArrowRight size={18} />
          </button>

          <p className="text-[11px] text-gray-400 font-bold uppercase mb-3">
            Looking for
          </p>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm">🤝</span>
            <p className="text-[13px] font-bold text-gray-800">
              Agencies (Influencers & Talent)
            </p>
          </div>

          {/* Highlights Row */}
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold text-gray-900 uppercase">
              Highlights
            </h4>
            <button className="text-[10px] font-bold text-[#5851DB] flex items-center gap-1">
              View more{" "}
              <span className="bg-[#5851DB] text-white rounded-full p-0.5 text-[8px]">
                ▼
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <HighlightTile
              icon={<Briefcase size={16} />}
              label="Brand Type"
              value="Food"
            />
            <HighlightTile
              icon={<Users size={16} />}
              label="Category"
              value="Food"
            />
            <HighlightTile
              icon={<Users size={16} />}
              label="No. of creators"
              value="200 creators"
            />
          </div>

          {/* Campaign Description */}
          <div className="space-y-4">
            <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
              Food bloggers 200 needed 5K+: Pan India store visit, food brand.
            </p>

            <ul className="space-y-3 pt-2">
              <DescriptionItem
                emoji="🏙️"
                label="Brand Name"
                value="Confidential"
              />
              <DescriptionItem
                emoji="🚀"
                label="Campaign Type"
                value="Food brand, bulk requirement"
              />
              <DescriptionItem
                emoji="📍"
                label="Platform"
                value="IG (mostly)"
              />
              <DescriptionItem
                emoji="👥"
                label="Creators Category"
                value="Food bloggers (good views, Pan India)"
              />
              <DescriptionItem emoji="📊" label="Follower Range" value="5K+" />
              <DescriptionItem
                emoji="🎁"
                label="Deliverables"
                value="Store visit"
              />
              <DescriptionItem
                emoji="💰"
                label="Budget Range"
                value="Rate card post-discussion"
              />
            </ul>
          </div>

          <button className="w-full py-4 bg-[#F1F0FF] text-[#5851DB] rounded-2xl font-bold flex items-center justify-center gap-2 mt-8">
            <Share2 size={16} /> Share this post
          </button>
        </div>
      </div>

      {/* Key Details Section */}
      <div className="px-6 mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">
          Key Highlighted Details
        </h3>
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
          {[
            { icon: <Users size={18} />, label: "Category", val: "Food" },
            { icon: <MapPin size={18} />, label: "Location", val: "Pan India" },
            {
              icon: <Instagram size={18} />,
              label: "Platform",
              val: "Instagram",
            },
            {
              icon: <Users size={18} />,
              label: "No. of creators",
              val: "200 creators",
            },
            { icon: <Briefcase size={18} />, label: "Brand Type", val: "Food" },
            {
              icon: <TrendingUp size={18} />,
              label: "Required followers",
              val: "Instagram • 1K - 10K",
            },
            {
              icon: <Package size={18} />,
              label: "Deliverables",
              val: "Store visit",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-5 border-b border-gray-50 last:border-none"
            >
              <div className="p-2.5 bg-[#F8F9FE] rounded-xl text-gray-400">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-gray-400 uppercase font-extrabold">
                  {item.label}
                </p>
                <p className="text-[11px] font-bold text-gray-900 mt-0.5">
                  {item.val}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Section */}
      <div className="px-6 mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">
          Activity on this post
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <ActivityCard
            icon={<Eye size={14} />}
            count="2"
            label="Total views"
          />
          <ActivityCard
            icon={<Calendar size={14} />}
            count="18 Mar 2026"
            label="Posted on"
          />
          <ActivityCard
            icon={<Send size={14} />}
            count="25 Mar 2026"
            label="Post expires on"
          />
        </div>
      </div>

      {/* Bottom Sticky CTA */}
      <div className="mt-8 mb-10 p-6 bg-white border-t border-gray-100 rounded-t-[32px]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Image
            height={32}
            width={32}
            src="https://i.pravatar.cc/100"
            className="w-8 h-8 rounded-full"
            alt="user"
          />
          <p className="text-[11px] font-bold text-gray-700">
            Submit Proposal to get connected
          </p>
        </div>
        <button className="w-full py-5 bg-[#5851DB] text-white rounded-[24px] font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-purple-200">
          Submit Proposal <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

const HighlightTile = ({ icon, label, value }) => (
  <div className="bg-[#F8F9FE] p-4 rounded-2xl flex items-center gap-3">
    <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-[8px] text-gray-400 uppercase font-bold">{label}</p>
      <p className="text-[10px] font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const DescriptionItem = ({ emoji, label, value }) => (
  <li className="text-[11px] text-gray-600 flex items-start gap-2">
    <span>{emoji}</span>
    <span className="font-bold text-gray-700">{label}:</span>
    <span className="text-gray-500 font-medium">{value}</span>
  </li>
);

const ActivityCard = ({ icon, count, label }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-50 text-center">
    <div className="mx-auto w-fit mb-2 text-gray-300">{icon}</div>
    <p className="text-[11px] font-extrabold text-gray-900 mb-1 leading-tight">
      {count}
    </p>
    <p className="text-[8px] text-gray-400 uppercase font-bold leading-tight">
      {label}
    </p>
  </div>
);

export default CampaignDetails;
