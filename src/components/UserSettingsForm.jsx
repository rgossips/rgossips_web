"use client";

import { useEffect } from "react";
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
});

export default function UserSettingsForm({ userData }) {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {}, // initial
  });

  // ⭐ Reset when userData loads
  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.name || "",
        email: userData.email || "",
        profession: userData.profession || "",
        twitter: userData.twitter || "",
        instagram: userData.instagram || "",
        upi: userData.upi || "",
        bank: userData.bank || "",
      });
    }
  }, [userData, form]);

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
        <div key={key} className="flex flex-col gap-2">
          <Label>{label}</Label>
          <Input {...form.register(key)} placeholder={label} />
        </div>
      ))}

      <Button className="col-span-full mt-4 bg-blue-700 cursor-pointer hover:bg-blue-800">
        Save Changes
      </Button>
    </form>
  );
}
