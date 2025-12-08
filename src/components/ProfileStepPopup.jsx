"use client";

import React, { useEffect, useState } from "react";
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
import MultiSelectInput from "./MultiSelectInput";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ---------- ZOD Schemas for each step ----------
const professionalSchema = z.object({
  primaryCategories: z.array(z.string()).min(1, "Pick at least one category"),
  secondaryCategories: z.array(z.string()).optional(),
  contentLanguages: z.array(z.string()).min(1, "Pick at least one language"),
  yearsOfExperience: z.string().min(1, "Select one"),
});

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

const collaborationSchema = z.object({
  collaborationTypes: z.array(z.string()).min(1, "Pick at least one"),
  budgetRange: z.string().optional(),
  availability: z.string().min(1, "Select your status"),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  sampleLinks: z
    .array(z.string().url("Enter a valid URL").or(z.literal("")))
    .max(3, "Maximum 3 sample links")
    .optional(),
});

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
  const { user } = useAuth();

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [platformToAdd, setPlatformToAdd] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Helper - toggle
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

  // ---------- Firestore helpers ----------
  const influencerDocRef = () => {
    if (!user?.uid) return null;
    return doc(db, "influencers", user.uid);
  };

  // Fetch remote influencer doc and populate forms + step
  useEffect(() => {
    if (!user?.uid) return;

    let mounted = true;
    const fetchProfile = async () => {
      setLoadingRemote(true);
      try {
        const ref = influencerDocRef();
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data();

          // If verificationState > 4, close popup
          const state = data.verificationState ?? 1;

          if (state > 4) {
            setOpen(false);
            setLoadingRemote(false);
            return;
          }

          // set form defaults if any saved
          if (
            data.primaryCategories ||
            data.contentLanguages ||
            data.yearsOfExperience
          ) {
            profForm.reset({
              primaryCategories: data.primaryCategories || [],
              secondaryCategories: data.secondaryCategories || [],
              contentLanguages: data.contentLanguages || [],
              yearsOfExperience: data.yearsOfExperience || "",
            });
          }

          if (data.socials) {
            socialForm.reset({
              socials: data.socials,
              primaryPlatform:
                data.primaryPlatform ||
                data.socials?.[0]?.platform ||
                "Instagram",
            });
          }

          if (data.collaborationTypes) {
            collabForm.reset({
              collaborationTypes: data.collaborationTypes || [],
              budgetRange: data.budgetRange || "",
              availability: data.availability || "",
              portfolioUrl: data.portfolioUrl || "",
              sampleLinks:
                data.sampleLinks && data.sampleLinks.length
                  ? data.sampleLinks
                  : [""],
            });
          }

          if (data.bio) {
            addForm.reset({
              bio: data.bio || "",
              skills: data.skills || "",
              pastCollaborations: data.pastCollaborations || "",
            });
          }

          // verificationState maps to the UI step directly
          setStep(state || 1);
        } else {
          // no doc yet — keep defaults and set step 1
          setStep(1);
        }
      } catch (err) {
        console.error("Error fetching influencer profile:", err);
      } finally {
        setLoadingRemote(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Save step helpers
  async function saveStepData({ nextVerificationState, partialData }) {
    if (!user?.uid) throw new Error("No user logged in");
    setSaving(true);

    try {
      const ref = influencerDocRef();
      const snap = await getDoc(ref);

      // Merge with existing doc or create new
      if (snap.exists()) {
        await updateDoc(ref, {
          ...partialData,
          verificationState: nextVerificationState,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          uid: user.uid,
          ...partialData,
          verificationState: nextVerificationState,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Saving step failed:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  // Submission handlers that save to Firestore and move to next step
  const onSubmitProfessional = async () => {
    // validate locally first
    const ok = await profForm.trigger();
    if (!ok) return;

    const vals = profForm.getValues();
    try {
      // Save and set verificationState to 2 (next step)
      await saveStepData({
        nextVerificationState: 2,
        partialData: {
          primaryCategories: vals.primaryCategories,
          secondaryCategories: vals.secondaryCategories,
          contentLanguages: vals.contentLanguages,
          yearsOfExperience: vals.yearsOfExperience,
        },
      });

      setStep(2);
    } catch (err) {
      alert("Failed to save professional step. Try again.");
    }
  };

  const onSubmitSocial = async () => {
    const ok = await socialForm.trigger();
    if (!ok) return;

    const vals = socialForm.getValues();
    try {
      await saveStepData({
        nextVerificationState: 3,
        partialData: {
          socials: vals.socials,
          primaryPlatform: vals.primaryPlatform,
        },
      });

      setStep(3);
    } catch (err) {
      alert("Failed to save social step. Try again.");
    }
  };

  const onSubmitCollab = async () => {
    const ok = await collabForm.trigger();
    if (!ok) return;

    const vals = collabForm.getValues();
    try {
      await saveStepData({
        nextVerificationState: 4,
        partialData: {
          collaborationTypes: vals.collaborationTypes,
          budgetRange: vals.budgetRange,
          availability: vals.availability,
          portfolioUrl: vals.portfolioUrl,
          sampleLinks: vals.sampleLinks,
        },
      });

      // Move to step 4 (Additional)
      setStep(4);
    } catch (err) {
      alert("Failed to save collaboration step. Try again.");
    }
  };

  const onSubmitAdditional = async () => {
    const ok = await addForm.trigger();
    if (!ok) return;

    const vals = addForm.getValues();

    try {
      // Save final payload and mark verificationState = 4 (completed)
      await saveStepData({
        nextVerificationState: 5,
        partialData: {
          bio: vals.bio,
          skills: vals.skills,
          pastCollaborations: vals.pastCollaborations,
        },
      });

      // Close popup on completion
      setOpen(false);
      // reset forms if desired
      profForm.reset();
      socialForm.reset();
      collabForm.reset();
      addForm.reset();
    } catch (err) {
      alert("Failed to finish profile. Try again.");
    }
  };

  // Close button action (warn user)
  const handleConfirmClose = () => {
    setConfirmClose(true);
  };

  const handleCloseNow = () => {
    setConfirmClose(false);
    setOpen(false);
  };

  // UI disabled while remote loading
  if (!open) return null;

  return (
    <>
      <Dialog open={open}>
        <DialogContent className="w-[80vw] min-w-[80vw] mx-auto rounded-2xl p-6 [&>button]:hidden relative">
          {/* Close button top-right */}
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              onClick={handleConfirmClose}
              className="text-red-500"
            >
              Close
            </Button>
          </div>

          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Complete your creator profile
            </DialogTitle>
          </DialogHeader>

          <div className="p-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between my-6">
              {[1, 2, 3, 4].map((s, i) => (
                <div key={s} className="flex-1 flex items-center">
                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step === s
                        ? "bg-blue-500 text-white"
                        : step > s
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>

                  {/* Connector Line */}
                  {i < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? "bg-green-500" : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-between mb-4 text-sm text-center text-gray-600">
              <div className="flex-1">Professional</div>
              <div className="flex-1">Social</div>
              <div className="flex-1">Collaboration</div>
              <div className="flex-1">Additional</div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitProfessional();
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Primary Content Categories</Label>
                  <MultiSelectInput
                    options={PRIMARY_OPTIONS}
                    selected={profForm.watch("primaryCategories")}
                    onChange={(vals) =>
                      profForm.setValue("primaryCategories", vals)
                    }
                    placeholder="Type or select..."
                  />
                  {profForm.formState.errors.primaryCategories && (
                    <p className="text-red-500 text-sm">
                      {profForm.formState.errors.primaryCategories.message}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Label>Secondary Content Categories</Label>
                  <MultiSelectInput
                    options={PRIMARY_OPTIONS}
                    selected={profForm.watch("secondaryCategories")}
                    onChange={(vals) =>
                      profForm.setValue("secondaryCategories", vals)
                    }
                    placeholder="Type or select..."
                  />
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
                  <Button
                    type="button"
                    className="cursor-pointer"
                    onClick={onSubmitProfessional}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitSocial();
                }}
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

                      <div className="space-y-1">
                        <Label className="text-sm">Handle</Label>
                        <Input
                          placeholder="@username"
                          {...socialForm.register(`socials.${idx}.handle`)}
                        />
                      </div>

                      {item.platform !== "Instagram" && (
                        <div className="space-y-1">
                          <Label className="text-sm">{item.platform} URL</Label>
                          <Input
                            placeholder="https://..."
                            {...socialForm.register(`socials.${idx}.url`)}
                          />
                        </div>
                      )}

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

                {fields.length < PLATFORMS.length && (
                  <div className="space-y-2">
                    <Label className="font-medium">Add Another Platform</Label>

                    <div className="flex gap-2">
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
                          setPlatformToAdd("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}

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

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={onSubmitSocial}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitCollab();
                }}
                className="space-y-4"
              >
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

                <div>
                  <Label>Portfolio URL (optional)</Label>
                  <Input
                    placeholder="https://"
                    {...collabForm.register("portfolioUrl")}
                  />
                </div>

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

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={onSubmitCollab}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save & Continue"}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitAdditional();
                }}
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
                  <Button
                    type="button"
                    onClick={onSubmitAdditional}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Finish & Save Profile"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      {/* Confirm-close dialog */}
      {confirmClose && (
        <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
          <DialogContent className="p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle>Leave this step?</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600">
              Progress for the current step will be lost. Do you still want to
              exit?
            </p>

            <DialogFooter className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setConfirmClose(false)}>
                Cancel
              </Button>
              <Button
                className="bg-red-500 text-white"
                onClick={handleCloseNow}
              >
                Yes, Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
