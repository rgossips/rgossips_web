const ServiceQuickLinks = () => {
  const links = [
    { label: "Flights", icon: "✈️", color: "bg-pink-50" },
    { label: "Hotels", icon: "🏨", color: "bg-blue-50" },
    { label: "Activities", icon: "🎢", color: "bg-purple-50" },
  ];
  return (
    <div className="flex justify-around px-4">
      {links.map((link) => (
        <div key={link.label} className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 ${link.color} rounded-full flex items-center justify-center text-2xl shadow-sm cursor-pointer`}
          >
            {link.icon}
          </div>
          <span className="text-[10px] font-bold text-slate-600">
            {link.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ServiceQuickLinks;
