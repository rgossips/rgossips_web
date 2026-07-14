import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const StepForm4 = ({ addForm, saving, setStep, onSubmitAdditional }) => {
  const t = useTranslations("StepFormsStepForm4");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitAdditional();
      }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-2">
        <Label>{t("bio.label")}</Label>
        <Textarea placeholder={t("bio.placeholder")} {...addForm.register("bio")} />
        <p className="text-sm text-slate-400">
          {addForm.watch("bio")?.length || 0}/500
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("skills.label")}</Label>
        <Input
          placeholder={t("skills.placeholder")}
          {...addForm.register("skills")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("pastCollaborations.label")}</Label>
        <Textarea
          placeholder={t("pastCollaborations.placeholder")}
          {...addForm.register("pastCollaborations")}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep(3)}>
          {t("back")}
        </Button>
        <Button type="button" onClick={onSubmitAdditional} disabled={saving}>
          {saving ? t("saving") : t("finish")}
        </Button>
      </div>
    </form>
  );
};

export default StepForm4;
