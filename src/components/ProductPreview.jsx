import React from "react";
import { BarChart3, Target } from "lucide-react";

const ProductPreview = () => {
  const cards = [
    {
      title: "Brand Campaign Dashboard",
      description: "Manage campaigns, track ROI",
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      bg: "bg-indigo-50/50",
    },
    {
      title: "Creator Campaign Browser",
      description: "Find & apply to campaigns",
      icon: <Target className="w-5 h-5 text-rose-500" />,
      bg: "bg-purple-50/50",
    },
  ];

  return (
    <section className="py-20 bg-white w-full">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="group relative bg-white rounded-[2rem] p-1 border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.15)] transition-all duration-500"
            >
              <div
                className={`rounded-[1.8rem] ${card.bg} h-[320px] flex flex-col items-center justify-center p-8 text-center`}
              >
                <div className="bg-white p-3 rounded-xl shadow-sm mb-6">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-500 text-sm">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductPreview;
