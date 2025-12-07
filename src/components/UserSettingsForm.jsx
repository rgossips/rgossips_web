"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  profession: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
  upi: z.string().optional(),
  bank: z.string().optional(),
  password: z.string().optional(),
});

export default function UserSettingsForm() {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => console.log(data))}
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
    >
      {[
        ["name", "Name"],
        ["email", "Email"],
        ["profession", "Profession"],
        ["twitter", "Twitter URL"],
        ["instagram", "Instagram URL"],
        ["upi", "UPI ID"],
        ["bank", "Bank Details"],
      ].map(([key, label]) => (
        <div key={key}>
          <Label>{label}</Label>
          <Input {...form.register(key)} placeholder={label} />
        </div>
      ))}

      <div>
        <Label>Change Password</Label>
        <Input
          type="password"
          {...form.register("password")}
          placeholder="New Password"
        />
      </div>

      <Button className="col-span-full mt-4">Save Changes</Button>
    </form>
  );
}
