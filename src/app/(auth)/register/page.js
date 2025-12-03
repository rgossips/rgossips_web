"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// -------------------------------------------------------
//                 🔵 BRAND SCHEMA
// -------------------------------------------------------

const BrandSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  companyName: z.string().min(2),
  website: z.string().optional(),
  logo: z.any().optional(),
});

// -------------------------------------------------------
//              🟣 INFLUENCER SCHEMA
// -------------------------------------------------------

const SocialLinkSchema = z.object({
  platform: z.string().min(1),
  url: z.string().url("Enter a valid URL"),
});

const InfluencerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  socials: z
    .array(SocialLinkSchema)
    .min(1, "At least 1 social link is required"),
});

// -------------------------------------------------------
//               ⭐ MAIN REGISTRATION PAGE
// -------------------------------------------------------

export default function RegisterPage() {
  const [tab, setTab] = useState("influencer"); // "brand" | "influencer"

  // BRAND form
  const brandForm = useForm({
    resolver: zodResolver(BrandSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      website: "",
      logo: null,
    },
  });

  // INFLUENCER form
  const influencerForm = useForm({
    resolver: zodResolver(InfluencerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      socials: [{ platform: "", url: "" }],
    },
  });

  // Dynamic fields for socials
  const { fields, append, remove } = useFieldArray({
    control: influencerForm.control,
    name: "socials",
  });

  // ------------------------ SUBMIT HANDLERS ------------------------

  const handleBrandSubmit = async (data) => {
    console.log("BRAND DATA:", data);
    alert("Brand Registered Successfully!");
  };

  const handleInfluencerSubmit = async (data) => {
    console.log("INFLUENCER DATA:", data);
    alert("Influencer Registered Successfully!");
  };

  // ------------------------ UI ------------------------

  return (
    <div className="flex flex-col justify-center h-full w-full px-10">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Create an Account</h1>
        <p className="text-gray-600 mt-1">Register as a Brand or Influencer.</p>
      </div>

      {/* TABS */}
      {/* <div className="flex mb-8">
        <button
          onClick={() => setTab("brand")}
          className={`px-4 py-2 font-medium cursor-pointer rounded-l-full ${
            tab === "brand" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Brand
        </button>

        <button
          onClick={() => setTab("influencer")}
          className={`px-4 py-2 rounded-r-full font-medium cursor-pointer ${
            tab === "influencer" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Influencer
        </button>
      </div> */}

      {/* ================================================================
                       BRAND REGISTRATION FORM
      ================================================================ */}

      {tab === "brand" && (
        <Form {...brandForm}>
          <form
            onSubmit={brandForm.handleSubmit(handleBrandSubmit)}
            className="w-full max-w-md space-y-6"
          >
            {/* Name */}
            <FormField
              control={brandForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={brandForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="brand@mail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={brandForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name */}
            <FormField
              control={brandForm.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Brand Pvt Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={brandForm.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://brand.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <FormField
              control={brandForm.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full py-6 text-md">Register as Brand</Button>
          </form>
        </Form>
      )}

      {/* ================================================================
                     INFLUENCER REGISTRATION FORM
      ================================================================ */}

      {tab === "influencer" && (
        <Form {...influencerForm}>
          <form
            onSubmit={influencerForm.handleSubmit(handleInfluencerSubmit)}
            className="w-full max-w-md space-y-6"
          >
            {/* Name */}
            <FormField
              control={influencerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={influencerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="creator@mail.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={influencerForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SOCIAL LINKS (DYNAMIC) */}
            <div>
              <FormLabel>Social Links</FormLabel>

              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="flex gap-3 mt-3">
                  {/* PLATFORM */}
                  <FormField
                    control={influencerForm.control}
                    name={`socials.${index}.platform`}
                    render={({ field }) => (
                      <FormItem className="w-[40%]">
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Instagram">Instagram</SelectItem>
                            <SelectItem value="YouTube">YouTube</SelectItem>
                            <SelectItem value="Twitter">Twitter</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* URL */}
                  <FormField
                    control={influencerForm.control}
                    name={`socials.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Input placeholder="https://link..." {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remove */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Add new social */}
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => append({ platform: "", url: "" })}
              >
                + Add Social
              </Button>
            </div>

            <Button className="w-full py-6 text-md">
              Register as Influencer
            </Button>
          </form>
        </Form>
      )}

      {/* FOOTER */}
      <p className="text-sm text-gray-600 mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>
    </div>
  );
}
