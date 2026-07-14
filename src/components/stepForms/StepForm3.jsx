import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const StepForm3 = ({
  collabForm,
  toggleArrayField,
  sampleFields,
  appendSample,
  removeSample,
  saving,
  setStep,
  onSubmitCollab,
}) => {
  const t = useTranslations("StepFormsStepForm3");
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitCollab();
      }}
      className="flex flex-col h-full"
    >
      {/* Scrollable Content */}
      <div className="flex-1 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
        <div>
          <Label>{t("collaborationTypesLabel")}</Label>
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
        </div>

        <div>
          <Label>{t("budgetRangeLabel")}</Label>
          <select
            {...collabForm.register("budgetRange")}
            className="w-full mt-2 p-2 rounded border"
          >
            <option value="">{t("selectPlaceholder")}</option>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>{t("availabilityLabel")}</Label>
          <select
            {...collabForm.register("availability")}
            className="w-full mt-2 p-2 rounded border"
          >
            <option value="">{t("selectPlaceholder")}</option>
            {AVAILABILITY.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>{t("portfolioUrlLabel")}</Label>
          <Input
            placeholder="https://"
            {...collabForm.register("portfolioUrl")}
          />
        </div>

        <div className="pb-2">
          <Label>{t("sampleLinksLabel")}</Label>
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
                  className="cursor-pointer"
                  onClick={() => removeSample(idx)}
                >
                  {t("remove")}
                </Button>
              </div>
            ))}

            {sampleFields.length < 3 && (
              <Button
                className="cursor-pointer"
                type="button"
                onClick={() => appendSample("")}
              >
                {t("addLink")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Footer Buttons */}
      <div className="sticky bottom-0 left-0 bg-white border-t py-3 flex justify-between mt-2">
        <Button type="button" variant="ghost" onClick={() => setStep(2)}>
          {t("back")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("saveAndContinue")}
        </Button>
      </div>
    </form>
  );
};

export default StepForm3;
