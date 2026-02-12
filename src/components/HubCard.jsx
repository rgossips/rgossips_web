import { ChevronRight } from "lucide-react";

// components/ui/HubCard.jsx
export const HubCard = ({
  title,
  sub,
  bgColor,
  icon: Icon,
  iconGradient,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`${bgColor} p-5 rounded-[2.2rem] border border-white shadow-sm flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all`}
  >
    <div
      className={`w-12 h-12 bg-gradient-to-br ${iconGradient} rounded-2xl flex items-center justify-center text-white shadow-md`}
    >
      <Icon size={22} strokeWidth={2.5} />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-[#2D2D2D] text-sm">{title}</h4>
      <p className="text-[11px] text-gray-500 font-medium leading-tight">
        {sub}
      </p>
    </div>
    <ChevronRight size={18} className="text-gray-400" />
  </div>
);
