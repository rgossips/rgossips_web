"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { IoIosClose } from "react-icons/io";
import StepForm1 from "./stepForms/StepForm1";
import StepForm2 from "./stepForms/StepForm2";
import StepForm3 from "./stepForms/StepForm3";
import StepForm4 from "./stepForms/StepForm4";
import StepForm0 from "./stepForms/StepForm0";
import ErrorModal from "./ErrorModal";

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

// ---------- Component ----------
export default function ProfileStepPopup({ userData }) {
  const t = useTranslations("ProfileStepPopup");
  const { user } = useAuth();
  console.log("userdata", userData);
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [platformToAdd, setPlatformToAdd] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showError, setShowError] = useState(false);

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

  // ---------- Step 0 Schema (Basic Info) ----------
  const basicSchema = z.object({
    email: z.string().email("Enter a valid email"),
    dob: z.string().min(1, "Select your date of birth"),
    gender: z.string().min(1, "Select a gender"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
  });
  const basicForm = useForm({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      email: userData?.email || user?.email || "", // Captures auth email if available
      name: userData?.name || "", // Add this if you want them to confirm their name
      phone: userData?.phone || "", // Important since they just verified this!
      dob: "",
      gender: "",
      city: "",
      state: "",
      country: "India",
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
    if (!userData) return;

    // Set step from verificationState or start from 0
    setStep(userData.verificationState ?? 0);
    // setStep(4);

    // Professional Data
    profForm.reset({
      primaryCategories: userData.primaryCategories || [],
      secondaryCategories: userData.secondaryCategories || [],
      contentLanguages: userData.contentLanguages || [],
      yearsOfExperience: userData.yearsOfExperience || "",
    });

    // Socials
    socialForm.reset({
      socials: userData.socials || [
        { platform: "Instagram", handle: "", url: "", subsRange: "" },
      ],
      primaryPlatform: userData.primaryPlatform || "Instagram",
    });

    // Collaboration Data
    collabForm.reset({
      collaborationTypes: userData.collaborationTypes || [],
      budgetRange: userData.budgetRange || "",
      availability: userData.availability || "",
      portfolioUrl: userData.portfolioUrl || "",
      sampleLinks: userData.sampleLinks?.length ? userData.sampleLinks : [""],
    });

    // Additional Info
    addForm.reset({
      bio: userData.bio || "",
      skills: userData.skills || "",
      pastCollaborations: userData.pastCollaborations || "",
    });

    // Basic / Step 0
    basicForm.reset({
      email: userData.email || user?.email || "",
      dob: userData.dob || "",
      gender: userData.gender || "",
      city: userData.city || "",
      state: userData.state || "",
      country: userData.country || "",
    });
  }, [userData]);

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
  const onSubmitBasic = async () => {
    const ok = await basicForm.trigger();
    if (!ok) return;

    const vals = basicForm.getValues();

    try {
      await saveStepData({
        nextVerificationState: 1,
        partialData: {
          email: vals.email,
          dob: vals.dob,
          gender: vals.gender,
          city: vals.city,
          state: vals.state,
          country: vals.country,
        },
      });

      setStep(1);
    } catch (err) {
      setShowError(true);
    }
  };

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
      setShowError(true);
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
      setShowError(true);
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
      setShowError(true);
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
      setShowError(true);
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

  // ADD THIS CHECK
  if (loadingRemote) {
    // You can return a simple spinner or a transparent placeholder here
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center bg-white/70">
        <p>{t("loadingProfile")}</p>
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} className="">
        <DialogContent className="h-[85vh] w-[80vw] min-w-[80vw] mx-auto rounded-2xl p-6 overflow-hidden [&>button]:hidden">
          {/* Close button top-right */}
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              onClick={handleConfirmClose}
              className="text-red-500 cursor-pointer"
            >
              <IoIosClose />
            </Button>
          </div>

          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {t("title")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4 pt-2">
            {/* Progress Steps */}
            <div className="flex items-center justify-between my-6">
              {[0, 1, 2, 3, 4].map((s, i) => (
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
                    {s + 1}
                  </div>

                  {/* Connector Line */}
                  {i < 4 && (
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
              <div className="flex-1">{t("steps.fundamental")}</div>
              <div className="flex-1">{t("steps.professional")}</div>
              <div className="flex-1">{t("steps.social")}</div>
              <div className="flex-1">{t("steps.collaboration")}</div>
              <div className="flex-1">{t("steps.additional")}</div>
            </div>

            <div className="h-[60vh] overflow-y-auto pr-2">
              {/* STEP 0 */}
              {step === 0 && (
                <StepForm0
                  basicForm={basicForm}
                  saving={saving}
                  onSubmitBasic={onSubmitBasic}
                />
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <StepForm1
                  profForm={profForm}
                  toggleArrayField={toggleArrayField}
                  saving={saving}
                  onSubmitProfessional={onSubmitProfessional}
                />
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <StepForm2
                  socialForm={socialForm}
                  fields={fields}
                  append={append}
                  remove={remove}
                  platformToAdd={platformToAdd}
                  setPlatformToAdd={setPlatformToAdd}
                  saving={saving}
                  setStep={setStep}
                  onSubmitSocial={onSubmitSocial}
                />
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <StepForm3
                  collabForm={collabForm}
                  toggleArrayField={toggleArrayField}
                  sampleFields={sampleFields}
                  appendSample={appendSample}
                  removeSample={removeSample}
                  saving={saving}
                  setStep={setStep}
                  onSubmitCollab={onSubmitCollab}
                />
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <StepForm4
                  addForm={addForm}
                  saving={saving}
                  setStep={setStep}
                  onSubmitAdditional={onSubmitAdditional}
                />
              )}
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

      <ErrorModal
        open={showError}
        errorText={t("saveError")}
        onClose={() => setShowError(false)}
      />

      {/* Confirm-close dialog */}
      {confirmClose && (
        <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
          <DialogContent className="p-6 rounded-xl [&>button]:cursor-pointer">
            <DialogHeader>
              <DialogTitle>{t("confirmClose.title")}</DialogTitle>
            </DialogHeader>

            <p className="text-gray-600">
              {t("confirmClose.message")}
            </p>

            <DialogFooter className="flex justify-end gap-3 mt-4">
              <Button
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setConfirmClose(false)}
              >
                {t("confirmClose.cancel")}
              </Button>
              <Button
                className="bg-red-500 cursor-pointer text-white"
                onClick={handleCloseNow}
              >
                {t("confirmClose.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
