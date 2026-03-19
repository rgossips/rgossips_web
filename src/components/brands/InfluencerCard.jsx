import { MessageCircle, UserPlus, Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export const InfluencerCard = ({
  name,
  category,
  instagram,
  youtube,
  imageUrl,
}) => (
  <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
    {/* Avatar with subtle ring */}
    <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-sm">
      <Image
        height={200}
        width={200}
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
      />
    </div>

    {/* Details */}
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-bold text-gray-900 truncate">{name}</h3>
      <p className="text-[11px] text-gray-500 mb-2 truncate">{category}</p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Instagram size={12} className="text-pink-600" />
          <span className="text-[10px] font-bold text-gray-700">
            {instagram}
          </span>
        </div>
        {youtube && (
          <div className="flex items-center gap-1">
            <Youtube size={12} className="text-red-600" />
            <span className="text-[10px] font-bold text-gray-700">
              {youtube}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
        <MessageCircle size={20} strokeWidth={1.5} />
      </button>
      <button className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
        <UserPlus size={20} strokeWidth={1.5} />
      </button>
    </div>
  </div>
);
