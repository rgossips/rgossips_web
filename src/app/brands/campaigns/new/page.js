"use client";

// Create a campaign — the full-page version of CreateCampaignDialog.
//
// It used to be a 720px modal with its own inner scrollbar. The brief is
// long (basic info, banner, targeting, budget, deliverables, guidelines,
// schedule) and most of it sat below the fold of a box that was itself
// below the fold, which is how required fields were missed. Same component,
// same validation, same submit path — only the shell changes, via `asPage`.
//
// Edit and duplicate deliberately stay modal: both are launched from a
// campaign already on screen and prefilled from an object in memory, so
// routing them would mean serialising a campaign into the URL for no gain.

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import CampaignUnderReviewModal from "@/components/brands/CampaignUnderReviewModal";

const CreateCampaignDialog = dynamic(
  () =>
    import("@/components/brands/CreateCampaignDialog").then(
      (m) => m.CreateCampaignDialog,
    ),
  { ssr: false },
);

export default function NewCampaignPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // Set when a published campaign lands in the review queue. Navigation
  // waits for the acknowledgement — otherwise the modal unmounts before it
  // has rendered, which is the bug CampaignUnderReviewModal exists for.
  const [reviewNoticeId, setReviewNoticeId] = useState(null);

  const leave = () => router.push("/brands/campaigns");

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#5851DB]" />
      </div>
    );
  }

  return (
    <>
      <CreateCampaignDialog
        asPage
        open
        onOpenChange={(next) => {
          if (!next) leave();
        }}
        brandId={user?.id}
        onCreated={(newId, info) => {
          if (info?.underReview) {
            setReviewNoticeId(newId || "");
            return;
          }
          if (newId) router.push(`/brands/campaign/${newId}`);
          else leave();
        }}
      />

      <CampaignUnderReviewModal
        open={reviewNoticeId !== null}
        onClose={() => {
          const id = reviewNoticeId;
          setReviewNoticeId(null);
          if (id) router.push(`/brands/campaign/${id}`);
          else leave();
        }}
      />
    </>
  );
}
