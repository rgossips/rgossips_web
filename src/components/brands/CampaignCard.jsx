import {
  CheckCircle2,
  MessageCircle,
  PhoneCall,
  ArrowUpRight,
} from "lucide-react";

export const CampaignCard = ({
  name = "Shivakant Pandey",
  role = "Marketing Manager @ Birga Global Pvt",
  lookingFor = "Marketing Specialists",
  tags = ["Photography", "Videography"],
  avatar = "https://i.pravatar.cc/150?u=shiva",
}) => {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-0.5">
              <CheckCircle2
                size={16}
                className="text-[#5851DB] fill-[#5851DB]/10"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
              {name}{" "}
              <span className="text-[#5851DB] text-[10px]">Verified</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">{role}</p>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex gap-2">
          <button className="p-2.5 rounded-full bg-blue-50 text-[#5851DB] hover:bg-blue-100 transition-colors">
            <MessageCircle size={18} />
          </button>
          <button className="p-2.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
            <PhoneCall size={18} />
          </button>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          Looking For
        </p>
        <h4 className="text-[15px] font-extrabold text-gray-900 leading-tight">
          {lookingFor}
        </h4>
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
          Looking for product reviewers, budget can be discussed. please drop a
          note with your portfolio...
        </p>
      </div>

      {/* Skill Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-4 py-2 bg-[#F8F9FE] text-gray-600 rounded-xl text-[10px] font-bold border border-gray-50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="pt-2 border-t border-gray-50 flex items-center justify-between mt-1">
        <button className="text-[12px] font-bold text-[#5851DB] hover:underline">
          Be first to apply
        </button>
        <button className="p-2 bg-[#F1F0FF] rounded-full text-[#5851DB]">
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
};
