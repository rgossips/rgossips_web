import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import MultiSelectInput from "../MultiSelectInput";

const StepForm1 = ({
  profForm,
  toggleArrayField,
  saving,
  onSubmitProfessional,
}) => {
  const t = useTranslations("StepFormsStepForm1");
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
        <Label>{t("primaryCategoriesLabel")}</Label>
        <MultiSelectInput
          options={PRIMARY_OPTIONS}
          selected={profForm.watch("primaryCategories")}
          onChange={(vals) => profForm.setValue("primaryCategories", vals)}
          placeholder={t("selectPlaceholder")}
        />
        {profForm.formState.errors.primaryCategories && (
          <p className="text-red-500 text-sm">
            {profForm.formState.errors.primaryCategories.message}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Label>{t("secondaryCategoriesLabel")}</Label>
        <MultiSelectInput
          options={PRIMARY_OPTIONS}
          selected={profForm.watch("secondaryCategories")}
          onChange={(vals) => profForm.setValue("secondaryCategories", vals)}
          placeholder={t("selectPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("contentLanguagesLabel")}</Label>
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
        <Label>{t("yearsOfExperienceLabel")}</Label>
        <select
          {...profForm.register("yearsOfExperience")}
          className="w-full mt-2 p-2 rounded border"
        >
          <option value="">{t("selectOption")}</option>
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
          {saving ? t("saving") : t("saveAndContinue")}
        </Button>
      </div>
    </form>
  );
};

export default StepForm1;
