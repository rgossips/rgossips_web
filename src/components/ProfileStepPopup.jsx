"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ---------- ZOD Schemas for each step ----------

// STEP 1
const professionalSchema = z.object({
  primaryCategories: z.array(z.string()).min(1, "Pick at least one category"),
  secondaryCategories: z.array(z.string()).optional(),
  contentLanguages: z.array(z.string()).min(1, "Pick at least one language"),
  yearsOfExperience: z.string().min(1, "Select one"),
});

// STEP 2
const socialSchema = z.object({
  socials: z
    .array(
      z.object({
        platform: z.string(),
        handle: z.string().optional(),
        url: z.string().url().optional().or(z.literal("")),
        subsRange: z.string().optional(),
      })
    )
    .min(1, "Add at least one platform"),

  primaryPlatform: z.string().min(1, "Select your primary platform"),
});

// STEP 3
const collaborationSchema = z.object({
  collaborationTypes: z.array(z.string()).min(1, "Pick at least one"),
  budgetRange: z.string().optional(),
  availability: z.string().min(1, "Select your status"),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  sampleLinks: z
    .array(
      z.string().url("Enter a valid URL").or(z.literal("")) // ⬅ allows empty string for optional inputs
    )
    .max(3, "Maximum 3 sample links")
    .optional(),
});

// STEP 4
const additionalSchema = z.object({
  bio: z.string().max(500, "Max 500 characters"),
  skills: z.string().optional(),
  pastCollaborations: z.string().optional(),
});

// ---------- Options ----------
const PRIMARY_OPTIONS = [
  "Fashion",
  "Tech",
  "Food",
  "Travel",
  "Gaming",
  "Education",
  "Beauty",
  "Fitness",
  "Comedy",
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Marathi"];
const YEARS = ["<1 year", "1-2 years", "3-5 years", "5+ years"];
const SUB_RANGES = ["<1k", "1k-10k", "10k-50k", "50k-100k", "100k+"];
const PLATFORMS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Facebook",
  "Twitter/X",
  "LinkedIn",
];
const COLLAB_TYPES = [
  "Paid Partnership",
  "Barter",
  "Affiliate Marketing",
  "UGC Content Creation",
  "Ambassadorship",
  "Event Coverage",
];
const BUDGETS = ["<5k", "5k-20k", "20k-50k", "50k+"];
const AVAILABILITY = ["Available", "Partially Available", "Not Available"];

// ---------- Component ----------
export default function ProfileStepPopup() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [platformToAdd, setPlatformToAdd] = useState("");

  // Form Hook Init
  const profForm = useForm({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      primaryCategories: [],
      secondaryCategories: [],
      contentLanguages: [],
      yearsOfExperience: "",
    },
  });

  const socialForm = useForm({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      socials: [
        {
          platform: "Instagram",
          handle: "",
          url: "",
          subsRange: "",
        },
      ],
      primaryPlatform: "Instagram",
    },
  });

  const collabForm = useForm({
    resolver: zodResolver(collaborationSchema),
    defaultValues: {
      collaborationTypes: [],
      budgetRange: "",
      availability: "",
      portfolioUrl: "",
      sampleLinks: [""],
    },
  });

  const addForm = useForm({
    resolver: zodResolver(additionalSchema),
    defaultValues: {
      bio: "",
      skills: "",
      pastCollaborations: "",
    },
  });

  // Field Array for sample links
  const {
    fields: sampleFields,
    append: appendSample,
    remove: removeSample,
  } = useFieldArray({
    control: collabForm.control,
    name: "sampleLinks",
  });

  const { fields, append, remove } = useFieldArray({
    control: socialForm.control,
    name: "socials",
  });

  // Helper
  function toggleArrayField(form, name, value, limit = null) {
    const arr = form.getValues(name) || [];

    if (arr.includes(value)) {
      form.setValue(
        name,
        arr.filter((x) => x !== value)
      );
      return;
    }

    if (limit && arr.length >= limit) return;

    form.setValue(name, [...arr, value]);
  }

  // Submission handlers
  const onSubmitProfessional = () => setStep(2);
  const onSubmitSocial = () => setStep(3);
  const onSubmitCollab = () => setStep(4);

  const onSubmitAdditional = () => {
    const finalPayload = {
      ...profForm.getValues(),
      ...socialForm.getValues(),
      ...collabForm.getValues(),
      ...addForm.getValues(),
    };

    console.log("Final Profile Payload →", finalPayload);

    // Reset UI
    setOpen(false);
    setStep(1);
    profForm.reset();
    socialForm.reset();
    collabForm.reset();
    addForm.reset();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl rounded-2xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Complete your creator profile
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Progress */}
          <div className="flex gap-2 items-center mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 text-center py-1 rounded ${
                  step === s ? "bg-slate-200 font-medium" : "text-slate-500"
                }`}
              >
                {s === 1
                  ? "Professional"
                  : s === 2
                  ? "Social"
                  : s === 3
                  ? "Collaboration"
                  : "Additional"}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={profForm.handleSubmit(onSubmitProfessional)}
              className="space-y-4"
            >
              <div>
                <Label>Primary Content Category (max-2)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRIMARY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        toggleArrayField(profForm, "primaryCategories", opt, 2)
                      }
                      className={`py-2 px-3 rounded-md border cursor-pointer ${
                        profForm.watch("primaryCategories")?.includes(opt)
                          ? "bg-slate-300"
                          : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {profForm.formState.errors.primaryCategories && (
                  <p className="text-red-500 text-sm">
                    {profForm.formState.errors.primaryCategories.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Secondary Content Categories (optional, max-5)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PRIMARY_OPTIONS.map((opt) => (
                    <button
                      key={opt + "-sec"}
                      type="button"
                      onClick={() =>
                        toggleArrayField(
                          profForm,
                          "secondaryCategories",
                          opt,
                          5
                        )
                      }
                      className={`py-2 px-3 rounded-md border cursor-pointer ${
                        profForm.watch("secondaryCategories")?.includes(opt)
                          ? "bg-slate-200"
                          : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Content Languages</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        toggleArrayField(profForm, "contentLanguages", lang)
                      }
                      className={`py-1 px-2 rounded-md border cursor-pointer ${
                        profForm.watch("contentLanguages")?.includes(lang)
                          ? "bg-slate-200"
                          : ""
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                {profForm.formState.errors.contentLanguages && (
                  <p className="text-red-500 text-sm">
                    {profForm.formState.errors.contentLanguages.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Years of Experience</Label>
                <select
                  {...profForm.register("yearsOfExperience")}
                  className="w-full mt-2 p-2 rounded border"
                >
                  <option value="">Select</option>
                  {YEARS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>

                {profForm.formState.errors.yearsOfExperience && (
                  <p className="text-red-500 text-sm">
                    {profForm.formState.errors.yearsOfExperience.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="cursor-pointer">
                  Save & Continue
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={socialForm.handleSubmit(onSubmitSocial)}
              className="space-y-6"
            >
              {/* Existing socials list */}
              <div className="space-y-4">
                {fields.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg bg-slate-50 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">{item.platform}</Label>

                      {/* Don't allow removing Instagram */}
                      {item.platform !== "Instagram" && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => remove(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Handle */}
                    <div className="space-y-1">
                      <Label className="text-sm">Handle</Label>
                      <Input
                        placeholder="@username"
                        {...socialForm.register(`socials.${idx}.handle`)}
                      />
                    </div>

                    {/* URL – shown for platforms with URL */}
                    {item.platform !== "Instagram" && (
                      <div className="space-y-1">
                        <Label className="text-sm">{item.platform} URL</Label>
                        <Input
                          placeholder="https://..."
                          {...socialForm.register(`socials.${idx}.url`)}
                        />
                      </div>
                    )}

                    {/* YouTube-only fields */}
                    {item.platform === "YouTube" && (
                      <div className="space-y-1">
                        <Label className="text-sm">Subscriber Range</Label>
                        <select
                          {...socialForm.register(`socials.${idx}.subsRange`)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select</option>
                          {SUB_RANGES.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add more social platforms */}
              {fields.length < PLATFORMS.length && (
                <div className="space-y-2">
                  <Label className="font-medium">Add Another Platform</Label>

                  <div className="flex gap-2">
                    {/* Dropdown */}
                    <select
                      value={platformToAdd}
                      onChange={(e) => setPlatformToAdd(e.target.value)}
                      className="p-2 border rounded w-full"
                    >
                      <option value="">Select a platform</option>

                      {PLATFORMS.filter(
                        (p) => !fields.some((f) => f.platform === p)
                      ).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {/* Add button */}
                    <Button
                      type="button"
                      disabled={!platformToAdd}
                      onClick={() => {
                        append({
                          platform: platformToAdd,
                          handle: "",
                          url: "",
                          subsRange: "",
                        });
                        setPlatformToAdd(""); // reset dropdown
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Primary platform dropdown */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="font-medium">Primary Platform</Label>
                <select
                  {...socialForm.register("primaryPlatform")}
                  className="w-full p-2 rounded border"
                >
                  {fields.map((s) => (
                    <option key={s.id} value={s.platform}>
                      {s.platform}
                    </option>
                  ))}
                </select>

                {socialForm.formState.errors.primaryPlatform && (
                  <p className="text-red-500 text-sm">
                    {socialForm.formState.errors.primaryPlatform.message}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">Save & Continue</Button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form
              onSubmit={collabForm.handleSubmit(onSubmitCollab)}
              className="space-y-4"
            >
              {/* Collaboration Types */}
              <div>
                <Label>Collaboration Types (multi-select)</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLLAB_TYPES.map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() =>
                        toggleArrayField(collabForm, "collaborationTypes", ct)
                      }
                      className={`py-1 px-2 rounded-md border ${
                        collabForm.watch("collaborationTypes")?.includes(ct)
                          ? "bg-slate-300"
                          : ""
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>

                {collabForm.formState.errors.collaborationTypes && (
                  <p className="text-red-500 text-sm">
                    {collabForm.formState.errors.collaborationTypes.message}
                  </p>
                )}
              </div>

              {/* Budget */}
              <div>
                <Label>Budget Range (optional)</Label>
                <select
                  {...collabForm.register("budgetRange")}
                  className="w-full mt-2 p-2 rounded border"
                >
                  <option value="">Select</option>
                  {BUDGETS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div>
                <Label>Availability</Label>
                <select
                  {...collabForm.register("availability")}
                  className="w-full mt-2 p-2 rounded border"
                >
                  <option value="">Select</option>
                  {AVAILABILITY.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>

                {collabForm.formState.errors.availability && (
                  <p className="text-red-500 text-sm">
                    {collabForm.formState.errors.availability.message}
                  </p>
                )}
              </div>

              {/* Portfolio */}
              <div>
                <Label>Portfolio URL (optional)</Label>
                <Input
                  placeholder="https://"
                  {...collabForm.register("portfolioUrl")}
                />
              </div>

              {/* Sample Links - FIXED FIELD ARRAY */}
              <div>
                <Label>Sample Links (up to 3)</Label>

                <div className="space-y-2 mt-2">
                  {sampleFields.map((f, idx) => (
                    <div key={f.id} className="flex gap-2">
                      <Input
                        placeholder="https://"
                        {...collabForm.register(`sampleLinks.${idx}`)}
                      />

                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => removeSample(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {sampleFields.length < 3 && (
                    <Button type="button" onClick={() => appendSample("")}>
                      Add Link
                    </Button>
                  )}

                  {collabForm.formState.errors.sampleLinks && (
                    <p className="text-red-500 text-sm">
                      {collabForm.formState.errors.sampleLinks.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button type="submit">Save & Continue</Button>
              </div>
            </form>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <form
              onSubmit={addForm.handleSubmit(onSubmitAdditional)}
              className="space-y-4"
            >
              <div>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Short bio"
                  {...addForm.register("bio")}
                />
                <p className="text-sm text-slate-400">
                  {addForm.watch("bio")?.length || 0}/500
                </p>
              </div>

              <div>
                <Label>Skills (optional)</Label>
                <Input
                  placeholder="Canon R5, Adobe Premiere…"
                  {...addForm.register("skills")}
                />
              </div>

              <div>
                <Label>Past Collaborations</Label>
                <Textarea
                  placeholder="List brands or notes"
                  {...addForm.register("pastCollaborations")}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="submit">Finish & Save Profile</Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
