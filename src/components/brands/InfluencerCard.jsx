import { MessageCircle, UserPlus, Instagram, Users } from "lucide-react";

const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

export const InfluencerCard = ({
  full_name,
  username,
  instagram_handle,
  profile_photo_url,
  followers_count,
  categories,
}) => {
  const displayName = full_name || username || instagram_handle || "Unknown";
  const categoryLabel = Array.isArray(categories)
    ? categories.slice(0, 2).join(", ")
    : categories || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
        {profile_photo_url ? (
          <img
            src={profile_photo_url}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-gray-900 truncate">{displayName}</h3>
        {categoryLabel && (
          <p className="text-[11px] text-gray-500 mb-2 truncate">{categoryLabel}</p>
        )}

        <div className="flex items-center gap-3">
          {instagram_handle && (
            <div className="flex items-center gap-1">
              <Instagram size={12} className="text-pink-600" />
              <span className="text-[10px] font-bold text-gray-700">
                @{instagram_handle}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={12} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-700">
              {formatCount(followers_count)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer">
          <MessageCircle size={20} strokeWidth={1.5} />
        </button>
        <button className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors cursor-pointer">
          <UserPlus size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
