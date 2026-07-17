import { Instagram, Users, FileText, Languages } from "lucide-react";
import { useTranslations } from "next-intl";

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
  languages,
  media_kit_published,
}) => {
  const t = useTranslations("BrandsInfluencerCard");
  const handle = instagram_handle || username || "";
  const displayName = full_name || handle || t("unknown");
  const categoryLabel = Array.isArray(categories)
    ? categories.slice(0, 2).join(", ")
    : categories || "";
  const languageLabel = Array.isArray(languages)
    ? languages.slice(0, 3).join(", ")
    : "";
  const initial = displayName.charAt(0).toUpperCase();

  const instagramUrl = handle ? `https://instagram.com/${handle}` : null;
  // B4 — only offer the media-kit action when the creator has actually
  // published one; a bare /kit/<handle> link 404s otherwise.
  const mediaKitUrl = handle && media_kit_published ? `/kit/${handle}` : null;

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
          {handle && (
            <div className="flex items-center gap-1">
              <Instagram size={12} className="text-pink-600" />
              <span className="text-[10px] font-bold text-gray-700">
                @{handle}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={12} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-700">
              {formatCount(followers_count)}
            </span>
          </div>
          {languageLabel && (
            <div className="flex items-center gap-1 min-w-0">
              <Languages size={12} className="text-gray-500 shrink-0" />
              <span className="text-[10px] font-bold text-gray-700 truncate">
                {languageLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors cursor-pointer"
            title={t("openInstagram")}
          >
            <Instagram size={18} strokeWidth={1.75} />
          </a>
        )}
        {mediaKitUrl && (
          <a
            href={mediaKitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#5851DB] bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors cursor-pointer"
            title={t("openMediaKit")}
          >
            <FileText size={18} strokeWidth={1.75} />
          </a>
        )}
      </div>
    </div>
  );
};
