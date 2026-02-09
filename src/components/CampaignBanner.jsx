import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const CampaignBanner = () => {
  return (
    <div className="relative w-full mt-12 mb-6">
      <div className="bg-gradient-to-r from-[#FFF0F7] to-[#FFE4F2] rounded-[30px] p-6 flex items-center justify-between overflow-hidden min-h-[160px]">
        <div className="max-w-[60%] space-y-2">
          <p className="text-[10px] font-bold text-[#D61F69] uppercase">
            Earn with every post
          </p>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            Get approved now
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            Link your socials and start getting campaign invites today.
          </p>
          <Button className="bg-[#D61F69] hover:bg-[#b01a56] text-white text-[10px] font-bold rounded-full h-8 px-6 mt-2">
            Apply For Campaigns
          </Button>
        </div>

        {/* This is where you use the PNG you download from Figma */}
        <div className="absolute right-0 bottom-0 w-[45%] h-full">
          <img
            src="/assets/campaign-girl.png"
            alt="Campaign"
            className="object-contain object-bottom h-full w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CampaignBanner;
