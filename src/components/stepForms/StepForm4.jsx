import React from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const StepForm4 = ({ addForm, saving, setStep, onSubmitAdditional }) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitAdditional();
      }}
      className="space-y-4"
    >
      <div>
        <Label>Bio</Label>
        <Textarea placeholder="Short bio" {...addForm.register("bio")} />
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
        <Button type="button" variant="ghost" onClick={() => setStep(3)}>
          Back
        </Button>
        <Button type="button" onClick={onSubmitAdditional} disabled={saving}>
          {saving ? "Saving..." : "Finish & Save Profile"}
        </Button>
      </div>
    </form>
  );
};

export default StepForm4;
