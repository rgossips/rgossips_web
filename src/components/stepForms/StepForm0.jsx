import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const StepForm0 = ({ basicForm, onSubmitBasic, saving }) => {
  const t = useTranslations("StepFormsStepForm0");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitBasic();
      }}
      className="h-full flex flex-col justify-between"
    >
      <div className="h-full max-h-[80%] flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label>{t("email")}</Label>
          <Input
            placeholder={t("emailPlaceholder")}
            {...basicForm.register("email")}
          />
        </div>

        <div className="flex justify-between items-center gap-5">
          {/* DOB */}
          <div className="flex flex-col flex-1 gap-2">
            <Label>{t("dateOfBirth")}</Label>
            <Input type="date" {...basicForm.register("dob")} />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-2 flex-1">
            <Label>{t("gender")}</Label>
            <Select
              className="w-full"
              onValueChange={(v) => basicForm.setValue("gender", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
                <SelectItem value="other">{t("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* City / State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("city")}</Label>
            <Input placeholder={t("cityPlaceholder")} {...basicForm.register("city")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("state")}</Label>
            <Input placeholder={t("statePlaceholder")} {...basicForm.register("state")} />
          </div>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-2">
          <Label>{t("country")}</Label>
          <Input placeholder={t("countryPlaceholder")} {...basicForm.register("country")} />
        </div>
      </div>
      {/* Button */}
      <div className="flex justify-end py-2">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("next")}
        </Button>
      </div>
    </form>
  );
};

export default StepForm0;
