import React from "react";
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
        <Button type="button" variant="ghost" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button type="button" onClick={onSubmitCollab} disabled={saving}>
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
};

export default StepForm3;
