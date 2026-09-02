import Link from "next/link";
import { ArrowUpRight, Calendar, Users, IndianRupee, Briefcase } from "lucide-react";

const statusStyles = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  under_review: "bg-purple-100 text-purple-700",
};

const statusLabel = (s) => (s === "under_review" ? "Under Review" : s ? s.charAt(0).toUpperCase() + s.slice(1) : "Draft");

const formatBudget = (n) => {
  if (!n) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export const CampaignCard = ({
  id,
  title,
  description,
  status = "draft",
  campaignType,
  maxInfluencers,
  budgetTotal,
  budgetPerInfluencer,
  applicationDeadline,
  applicationsTotal = 0,
  applicationsPending = 0,
  categories = [],
  bannerImage,
}) => {
  return (
    <Link
      href={`/brands/campaign/${id}`}
      className="block bg-white rounded-[28px] p-5 shadow-sm border border-[#E4E9F4] hover:shadow-md transition-shadow"
    >
      {bannerImage && (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-4 bg-gray-100">
          <img src={bannerImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {/* A campaign can be DB-status "active" with its application
                deadline already past — creators can't apply anymore, so it
                gets its own display status instead of a misleading Active. */}
            {status === "active" &&
            applicationDeadline &&
            new Date(applicationDeadline).getTime() < Date.now() ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                Applications Closed
              </span>
            ) : (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  statusStyles[status] || statusStyles.draft
                }`}
              >
                {statusLabel(status)}
              </span>
            )}
            {campaignType && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#6A66C9] capitalize">
                {campaignType}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-extrabold text-[#16224E] leading-tight line-clamp-2">
            {title || "Untitled Campaign"}
          </h3>
          {description && (
            <p className="text-[11px] text-[#6B6785] mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <button className="p-2 bg-[#F1F0FF] rounded-full text-[#6A66C9] shrink-0">
          <ArrowUpRight size={16} />
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.slice(0, 3).map((c) => (
            <span
              key={c}
              className="px-2.5 py-1 bg-[#F3F5FA] text-gray-600 rounded-lg text-[10px] font-semibold border border-[#E4E9F4]"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <IndianRupee size={12} className="text-[#9C97B8]" />
          <span className="font-semibold">
            {formatBudget(budgetPerInfluencer || budgetTotal)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <Users size={12} className="text-[#9C97B8]" />
          <span className="font-semibold">
            {applicationsTotal}/{maxInfluencers} applied
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <Calendar size={12} className="text-[#9C97B8]" />
          <span className="font-semibold">{formatDate(applicationDeadline)}</span>
        </div>
        {applicationsPending > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <Briefcase size={12} />
            <span className="font-bold">{applicationsPending} pending</span>
          </div>
        )}
      </div>
    </Link>
  );
};
