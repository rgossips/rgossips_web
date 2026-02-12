// components/ui/StatCard.jsx
export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
}) => (
  <div
    className={`${bgColor} p-4 rounded-[2rem] border border-white shadow-sm`}
  >
    <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center mb-3">
      <Icon className={color} size={20} />
    </div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
      {title}
    </p>
    <div className="flex items-baseline gap-1.5 mt-1">
      <h3 className="text-lg font-black text-[#1A1A1A]">{value}</h3>
      <span className="text-[10px] font-black text-emerald-500">+{change}</span>
    </div>
  </div>
);
