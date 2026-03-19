"use client";

import ResumeViewer from "@/components/ResumeViewer";
import OwnerControls from "@/components/OwnerControls";
import { Download } from "lucide-react";

export default function ResumePage({ params }) {
  const influencer = {
    id: "123",
    name: "Rohan Sharma",
    niche: "Tech Creator",
    followers: "145K",
    engagement: "6.2%",
    resume_pdf_url:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    resume_last_generated_at: "2026-03-01",
  };

  const loggedUser = { id: "123" };
  const isOwner = loggedUser.id === influencer.id;

  const handleDownload = () => {
    window.open(influencer.resume_pdf_url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-12 px-4 md:px-8">
      {/* Header Section */}
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Media Kit / Resume
          </h1>
          <p className="text-gray-400 mt-2">
            AI-Powered insights for {influencer.name}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center cursor-pointer justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
        >
          <Download size={20} />
          Download PDF
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:items-start">
        {/* Left Side: Resume Viewer (Scrollable) */}
        <div className="flex-1 w-full overflow-hidden">
          <div className="relative w-full aspect-[1/1.414] bg-[#1a1a20] rounded-2xl shadow-2xl border border-white/5 overflow-y-auto scrollbar-hide">
            <div className="p-4 md:p-8">
              {/* Aspect Ratio 1:1.414 mimics an A4 paper. 
                  ResumeViewer should handle the actual rendering 
                */}
              <ResumeViewer pdf={influencer.resume_pdf_url} />
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-4 italic">
            Scroll inside the viewer to see full details
          </p>
        </div>

        {/* Right Side: Controls (Fixed on Desktop) */}
        <aside className="w-full lg:w-[400px] lg:sticky lg:top-28">
          <div className="space-y-6">
            {/* Brand/Viewer Stats (Visible to everyone) */}
            <div className="bg-[#16161d] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                Creator Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Reach</p>
                  <p className="text-xl font-bold">{influencer.followers}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Engagement</p>
                  <p className="text-xl font-bold">{influencer.engagement}</p>
                </div>
              </div>
            </div>

            {/* Owner Specific Controls */}
            {isOwner ? (
              <OwnerControls influencer={influencer} />
            ) : (
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-indigo-400 mb-2">
                  Hire this Creator
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Contact {influencer.name} directly for your next campaign.
                </p>
                <button className="w-full py-3 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-600 transition-colors">
                  Send Collaboration Inquiry
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
