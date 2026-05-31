"use client";

// Thin dispatcher — picks the template the creator has saved (or a one-off
// preview override) and delegates rendering. Bio + top-reel editing only
// runs on the Classic template; for the others we suggest switching back
// to Classic to edit content first.

import React from "react";
import TemplateClassic from "./mediaKitTemplates/TemplateClassic";
import TemplateGlassBlue from "./mediaKitTemplates/TemplateGlassBlue";
import TemplateEditorialNoir from "./mediaKitTemplates/TemplateEditorialNoir";
import TemplateBentoSunset from "./mediaKitTemplates/TemplateBentoSunset";
import TemplateNeoBrutalist from "./mediaKitTemplates/TemplateNeoBrutalist";

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

  // Only Classic supports inline editing. Other templates render read-only
  // — when a creator wants to edit bio/reels they switch back to Classic.
  const allowEdit = editable && Template === TemplateClassic;

  return (
    <Template
      profile={profile}
      isPublic={isPublic}
      editable={allowEdit}
      onBioSave={onBioSave}
      onTopReelsSave={onTopReelsSave}
    />
  );
}
