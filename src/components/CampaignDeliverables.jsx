import { CheckCircle2 } from "lucide-react";

export function CampaignDeliverables() {
  const items = [
    {
      count: 2,
      title: "Instagram Reel",
      desc: "60-90 seconds showcasing product features",
    },
    {
      count: 2,
      title: "Instagram Story",
      desc: "24-hour highlights with swipe-up links",
    },
    {
      count: 1,
      title: "YouTube Video",
      desc: "5-7 minute detailed review and styling tips",
    },
    {
      count: 5,
      title: "Hashtags",
      desc: "#SummerVibes #StyleBrand #FashionForward",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800">
        Campaign Deliverables
      </h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-50 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              {item.count}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-tight">
                {item.desc}
              </p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
        ))}
      </div>

      <div className="bg-[#FFF5F8] p-5 rounded-3xl border border-pink-50">
        <h4 className="text-sm font-bold text-[#E60076] mb-3">
          Content Guidelines
        </h4>
        <ul className="space-y-2">
          {[
            "Original content aligned with brand aesthetics",
            "Product features clearly visible",
            "Include brand tags and hashtags",
          ].map((note, i) => (
            <li key={i} className="text-[11px] text-slate-600 flex gap-2">
              <span className="w-1 h-1 bg-pink-400 rounded-full mt-1.5 shrink-0" />{" "}
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
