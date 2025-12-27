import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import MultiSelectInput from "../MultiSelectInput";

const StepForm1 = ({
  profForm,
  toggleArrayField,
  saving,
  onSubmitProfessional,
}) => {
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitProfessional();
      }}
      className="space-y-4 overflow-y-auto"
    >
      <div className="flex flex-col gap-2">
        <Label>Primary Content Categories</Label>
        <MultiSelectInput
          options={PRIMARY_OPTIONS}
          selected={profForm.watch("primaryCategories")}
          onChange={(vals) => profForm.setValue("primaryCategories", vals)}
          placeholder="Type or select..."
        />
        {profForm.formState.errors.primaryCategories && (
          <p className="text-red-500 text-sm">
            {profForm.formState.errors.primaryCategories.message}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Label>Secondary Content Categories</Label>
        <MultiSelectInput
          options={PRIMARY_OPTIONS}
          selected={profForm.watch("secondaryCategories")}
          onChange={(vals) => profForm.setValue("secondaryCategories", vals)}
          placeholder="Type or select..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Content Languages</Label>
        <div className="flex gap-2 flex-wrap">
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

      <div className="">
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
  );
};

export default StepForm1;
