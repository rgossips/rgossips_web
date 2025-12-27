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
      className="space-y-4"
    >
      {/* Email */}
      <div>
        <Label>Email</Label>
        <Input placeholder="you@example.com" {...basicForm.register("email")} />
      </div>

      {/* DOB */}
      <div>
        <Label>Date of Birth</Label>
        <Input type="date" {...basicForm.register("dob")} />
      </div>

      {/* Gender */}
      <div>
        <Label>Gender</Label>
        <Select onValueChange={(v) => basicForm.setValue("gender", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* City / State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>City</Label>
          <Input placeholder="City" {...basicForm.register("city")} />
        </div>
        <div>
          <Label>State</Label>
          <Input placeholder="State" {...basicForm.register("state")} />
        </div>
      </div>

      {/* Country */}
      <div>
        <Label>Country</Label>
        <Input placeholder="Country" {...basicForm.register("country")} />
      </div>

      {/* Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </form>
  );
};

export default StepForm0;
