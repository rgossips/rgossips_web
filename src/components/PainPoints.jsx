import React from "react";
import { SearchX, Wallet, Clock, BarChartHorizontal } from "lucide-react";

const PainPoints = () => {
  const points = [
    {
      icon: SearchX,
      title: "Finding the right influencer is a full-time job.",
      description:
        "Scrolling through thousands of profiles, wrong niches, fake followers, zero ROI.",
    },
    {
      icon: Wallet,
      title: "Agencies eat your budget before a single post goes live.",
      description: "30-40% commissions, slow turnarounds.",
    },
    {
      icon: Clock,
      title: "Creators get paid late — or not at all.",
      description: "Broken payment chains, ambiguous contracts.",
    },
    {
      icon: BarChartHorizontal,
      title: "Zero visibility into what's actually performing.",
      description: "Vanity metrics, delayed reports.",
    },
  ];

  return (
    <section className="bg-white py-20 w-full">
      <div className="container mx-auto px-4">
        {/* Header Text */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Influencer Marketing Shouldn't Feel This Hard.
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Brands waste weeks hunting creators. Influencers wait months for
            payments. Agencies take 30%+ commissions for work you can do in
            minutes on RGossips.
          </p>
        </div>

        {/* Dark Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {points.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div
                key={idx}
                className="bg-[#0D0D12] rounded-3xl p-8 border border-white/5 hover:border-rose-500/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-rose-500" />
                </div>
                <h4 className="text-white text-xl font-bold mb-4 leading-tight">
                  {point.title}
                </h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PainPoints;
