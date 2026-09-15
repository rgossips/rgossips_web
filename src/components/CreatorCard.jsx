import Image from "next/image";
import { FaCheckCircle, FaInstagram } from "react-icons/fa";
import { useTranslations } from "next-intl";
import EliteBadge from "./EliteBadge";

export default function CreatorCard({
  name,
  verified,
  elite = false,
  image,
  posts,
  followers,
  following,
  bio,
  link,
}) {
  const t = useTranslations("CreatorCard");
  return (
    <div className="border rounded-xl p-6 w-full sm:w-72 md:w-80 flex flex-col gap-4 shadow-sm bg-white mb-10">
      {/* Name */}
      <div className="flex items-center gap-1 text-lg font-semibold justify-center">
        {name}
        {elite ? (
          <EliteBadge className="ml-1" />
        ) : (
          verified && <FaCheckCircle className="text-blue-500 text-sm ml-1" />
        )}
      </div>

      {/* Gradient Border Image Container */}
      <div className="flex justify-center">
        {/* The Outer Wrapper creates the gradient effect */}
        <div className="p-2 rounded-full bg-gradient-to-tr from-[#F6339A] to-[#FDC700] shadow-sm">
          {/* The Inner Wrapper creates the white gap between image and gradient (optional) */}
          <div className="bg-white rounded-full">
            {image ? (
              <Image
                width={700}
                height={700}
                src={image}
                className="w-52 h-52 rounded-full object-cover"
                alt={name}
              />
            ) : (
              // A spotlighted Elite creator may have no photo yet; next/image
              // throws on an empty src.
              <div className="w-52 h-52 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 grid place-items-center text-white text-6xl font-black">
                {(name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers only — `posts` and `following` are still received in
          props but intentionally not rendered. The data source
          (featured_creators table) doesn't expose them anyway, and we
          want a cleaner, single-stat card on the influencer home. */}
      <div className="flex justify-center text-center w-full text-sm mt-1">
        <div>
          <p className="font-semibold text-base">{followers}</p>
          <p className="text-gray-500 text-xs">{t("followers")}</p>
        </div>
      </div>

      {/* View on Instagram — opens in a new tab. Hidden when no link is
          available on the creator row (e.g. an admin row without the
          instagram_url column populated). */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-white text-sm font-bold rounded-full px-4 py-2.5 mt-1 shadow-md hover:opacity-90 transition-opacity"
          style={{
            background:
              "linear-gradient(135deg, #FCAF45 0%, #E1306C 50%, #833AB4 100%)",
          }}
        >
          <FaInstagram className="text-base" />
          {t("viewOnInstagram")}
        </a>
      )}
    </div>
  );
}
