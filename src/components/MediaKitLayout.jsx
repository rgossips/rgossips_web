"use client";

// Thin dispatcher — picks the template the creator has saved (or a one-off
// preview override) and delegates rendering. The MediaKitEditOverlay layer
// renders on top with floating Edit Bio / Edit Top Reels controls so the
// editing flow is uniform across every template.

import React from "react";
import TemplateClassic from "./mediaKitTemplates/TemplateClassic";
import TemplateGlassBlue from "./mediaKitTemplates/TemplateGlassBlue";
import TemplateEditorialNoir from "./mediaKitTemplates/TemplateEditorialNoir";
import TemplateBentoSunset from "./mediaKitTemplates/TemplateBentoSunset";
import TemplateNeoBrutalist from "./mediaKitTemplates/TemplateNeoBrutalist";
import MediaKitEditOverlay from "./mediaKitTemplates/EditOverlay";

const TEMPLATE_MAP = {
  classic: TemplateClassic,
  glass_blue: TemplateGlassBlue,
  editorial_noir: TemplateEditorialNoir,
  bento_sunset: TemplateBentoSunset,
  neo_brutalist: TemplateNeoBrutalist,
};

export default function MediaKitLayout({
  profile,
  isPublic = false,
  editable = false,
  onBioSave,
  onTopReelsSave,
  templateOverride,
}) {
  // `templateOverride` is the editor previewing a template they haven't
  // saved yet. Falls back to whatever's persisted on the profile, then to
  // the safe Classic default.
  const templateId =
    templateOverride ||
    profile?.media_kit_template ||
    profile?.mediaKitTemplate ||
    "classic";
  const Template = TEMPLATE_MAP[templateId] || TemplateClassic;

  return (
    <>
      <Template
        profile={profile}
        isPublic={isPublic}
      />
      {editable && (
        <MediaKitEditOverlay
          bio={profile?.bio || ""}
          reels={profile?.top_reels || profile?.topReels || []}
          onBioSave={onBioSave}
          onTopReelsSave={onTopReelsSave}
        />
      )}
    </>
  );
}
