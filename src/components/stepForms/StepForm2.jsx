import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const StepForm2 = ({
  socialForm,
  fields,
  append,
  remove,
  platformToAdd,
  setPlatformToAdd,
  saving,
  setStep,
  onSubmitSocial,
}) => {
  const SUB_RANGES = ["<1k", "1k-10k", "10k-50k", "50k-100k", "100k+"];
  const PLATFORMS = [
    "Instagram",
    "YouTube",
    "TikTok",
    "Facebook",
    "Twitter/X",
    "LinkedIn",
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitSocial();
      }}
      className="flex flex-col h-full"
    >
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Existing socials */}
        <div className="space-y-4">
          {fields.map(
            (item, idx) =>
              item.platform !== "Instagram" && (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-slate-50 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Label className="font-medium">{item.platform}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => remove(idx)}
                      className="cursor-pointer"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Handle</Label>
                    <Input
                      placeholder="@username"
                      {...socialForm.register(`socials.${idx}.handle`)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">{item.platform} URL</Label>
                    <Input
                      placeholder="https://..."
                      {...socialForm.register(`socials.${idx}.url`)}
                    />
                  </div>

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
              )
          )}
        </div>

        {/* Add new platform */}
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

        {/* Primary platform */}
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
      </div>

      {/* Fixed Footer */}
      <div className="sticky bottom-0 bg-white border-t py-3 flex justify-between mt-2">
        <Button type="button" variant="ghost" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
};

export default StepForm2;
