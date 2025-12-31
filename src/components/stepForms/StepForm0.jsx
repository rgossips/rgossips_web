import React from "react";
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
          <Label>Email</Label>
          <Input
            placeholder="you@example.com"
            {...basicForm.register("email")}
          />
        </div>

        <div className="flex justify-between items-center gap-5">
          {/* DOB */}
          <div className="flex flex-col flex-1 gap-2">
            <Label>Date of Birth</Label>
            <Input type="date" {...basicForm.register("dob")} />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-2 flex-1">
            <Label>Gender</Label>
            <Select
              className="w-full"
              onValueChange={(v) => basicForm.setValue("gender", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* City / State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>City</Label>
            <Input placeholder="City" {...basicForm.register("city")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>State</Label>
            <Input placeholder="State" {...basicForm.register("state")} />
          </div>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-2">
          <Label>Country</Label>
          <Input placeholder="Country" {...basicForm.register("country")} />
        </div>
      </div>
      {/* Button */}
      <div className="flex justify-end py-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default StepForm0;
