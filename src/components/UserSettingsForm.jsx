"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import MultiSelectInput from "@/components/MultiSelectInput";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext"; // Import global auth hook

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  upi: z.string().optional(),
  bank: z.string().optional(),
  primaryCategories: z
    .array(z.string())
    .min(1, "Select at least 1 primary category"),
  secondaryCategories: z.array(z.string()).optional(),
  contentLanguages: z.array(z.string()).min(1, "Select at least 1 language"),
  yearsOfExperience: z.string().optional(),
});

export default function UserSettingsForm() {
  // 1. Pull everything from global Context
  const { profile, setProfile, user, role, loading: authLoading } = useAuth();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  const LANGUAGES = [
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Kannada",
    "Marathi",
  ];
  const YEARS = ["<1 year", "1-2 years", "3-5 years", "5+ years"];

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      instagram: "",
      twitter: "",
      upi: "",
      bank: "",
      primaryCategories: [],
      secondaryCategories: [],
      contentLanguages: [],
      yearsOfExperience: "",
    },
  });

  // 2. Load user data from Global Profile once available
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        instagram: profile.instagram || "",
        twitter: profile.twitter || "",
        upi: profile.upi || "",
        bank: profile.bank || "",
        primaryCategories: profile.primaryCategories || [],
        secondaryCategories: profile.secondaryCategories || [],
        contentLanguages: profile.contentLanguages || [],
        yearsOfExperience: profile.yearsOfExperience || "",
      });
    }
  }, [profile, form]);

  const toggleArrayField = (field, value) => {
    const current = form.getValues(field) || [];
    form.setValue(
      field,
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
      { shouldValidate: true }
    );
  };

  // 3. Updated Save Logic
  const onSave = async (values) => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Determine collection based on role (influencers or brands)
      const collectionName = role === "influencer" ? "influencers" : "brands";
      const userRef = doc(db, collectionName, user.uid);

      // Update Firestore
      await updateDoc(userRef, values);

      // 4. Update Global Context State instantly
      setProfile((prev) => ({
        ...prev,
        ...values,
      }));

      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading)
    return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <>
      <form onSubmit={form.handleSubmit(onSave)} className="grid gap-6">
        {/* BASIC FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField form={form} name="name" label="Name" />
          <InputField form={form} name="email" label="Email" />
          <InputField form={form} name="instagram" label="Instagram URL" />
          <InputField form={form} name="twitter" label="Twitter URL" />
          <InputField form={form} name="upi" label="UPI ID" />
          <InputField form={form} name="bank" label="Bank Details" />
        </div>

        {/* PROFESSIONAL SECTION */}
        <div className="border rounded-xl p-5 bg-white grid gap-4">
          <h2 className="font-semibold text-lg">Professional Info</h2>

          <div className="flex flex-col gap-2">
            <Label>Primary Categories</Label>
            <MultiSelectInput
              options={PRIMARY_OPTIONS}
              selected={form.watch("primaryCategories")}
              onChange={(vals) =>
                form.setValue("primaryCategories", vals, {
                  shouldValidate: true,
                })
              }
              placeholder="Select categories..."
            />
            {form.formState.errors.primaryCategories && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.primaryCategories.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Secondary Categories</Label>
            <MultiSelectInput
              options={PRIMARY_OPTIONS}
              selected={form.watch("secondaryCategories")}
              onChange={(vals) => form.setValue("secondaryCategories", vals)}
              placeholder="Select categories..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Content Languages</Label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang}
                  onClick={() => toggleArrayField("contentLanguages", lang)}
                  className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                    form.watch("contentLanguages")?.includes(lang)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            {form.formState.errors.contentLanguages && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.contentLanguages.message}
              </p>
            )}
          </div>

          <div>
            <Label>Years of Experience</Label>
            <select
              {...form.register("yearsOfExperience")}
              className="w-full mt-2 p-2 rounded-lg border bg-white focus:ring-2 focus:ring-blue-100 outline-none"
            >
              <option value="">Select Experience</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          disabled={isSaving}
          type="submit"
          className="bg-blue-700 cursor-pointer hover:bg-blue-800 text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving Changes...
            </>
          ) : (
            "Save All Changes"
          )}
        </Button>
      </form>

      <SuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        text="Your profile has been updated successfully!"
      />
      <ErrorModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        text="Failed to update details. Please try again later."
      />
    </>
  );
}

function InputField({ form, name, label }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-slate-700 font-medium">{label}</Label>
      <Input
        {...form.register(name)}
        placeholder={label}
        className="rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-all"
      />
      {form.formState.errors[name] && (
        <p className="text-red-500 text-xs">
          {form.formState.errors[name].message}
        </p>
      )}
    </div>
  );
}
