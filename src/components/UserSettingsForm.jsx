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

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  upi: z.string().optional(),
  bank: z.string().optional(),

  // NEW FIELDS
  primaryCategories: z
    .array(z.string())
    .min(1, "Select at least 1 primary category"),
  secondaryCategories: z.array(z.string()).optional(),
  contentLanguages: z.array(z.string()).min(1, "Select at least 1 language"),
  yearsOfExperience: z.string().optional(),
});

export default function UserSettingsForm({ userData }) {
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
    defaultValues: {},
  });

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user data
  useEffect(() => {
    console.log("user", userData);
    if (userData) {
      form.reset({
        name: userData.name || "",
        email: userData.email || "",
        instagram: userData.instagram || "",
        twitter: userData.twitter || "",
        upi: userData.upi || "",
        bank: userData.bank || "",

        primaryCategories: userData.primaryCategories || [],
        secondaryCategories: userData.secondaryCategories || [],
        contentLanguages: userData.contentLanguages || [],
        yearsOfExperience: userData.yearsOfExperience || "",
      });
    }
  }, [userData, form]);

  const toggleArrayField = (field, value) => {
    const current = form.getValues(field) || [];
    form.setValue(
      field,
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate form values
      const values = form.getValues();

      // Update Firestore user document (users collection)
      const userRef = doc(db, "users", userData.uid); // userData.uid is your document ID
      await updateDoc(userRef, values);

      setLoading(false);
      setSuccessModalOpen(true); // show success pop-up
    } catch (error) {
      console.error("Error updating user profile:", error);
      setLoading(false);
      setErrorModalOpen(true); // show error pop-up
    }
  };

  return (
    <>
      <form
        onSubmit={form.handleSubmit((data) => console.log("Final Save:", data))}
        className="grid gap-6"
      >
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
              onChange={(vals) => form.setValue("primaryCategories", vals)}
              placeholder="Select categories..."
            />
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
                  className={`px-3 py-1 rounded-md border ${
                    form.watch("contentLanguages")?.includes(lang)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Years of Experience</Label>
            <select
              {...form.register("yearsOfExperience")}
              className="w-full mt-2 p-2 rounded border bg-white"
            >
              <option value="">Select Experience</option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          disabled={loading}
          onClick={handleSave}
          className="bg-blue-700 hover:bg-blue-800 cursor-pointer mt-3"
        >
          {loading && (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {loading ? "Saving..." : "Save Changes"}
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
      <Label>{label}</Label>
      <Input {...form.register(name)} placeholder={label} />
    </div>
  );
}
