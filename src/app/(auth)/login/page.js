"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Phone, ArrowRight, Eye, Smartphone } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import logo from "@/assets/logo.png";

// Validation Schemas
const BrandSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const InfluencerSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");

  const brandForm = useForm({
    resolver: zodResolver(BrandSchema),
    defaultValues: { email: "", password: "" },
  });

  const influencerForm = useForm({
    resolver: zodResolver(InfluencerSchema),
    defaultValues: { phone: "" },
  });

  // --- OTP Logic ---
  const initRecaptcha = () => {
    if (typeof window === "undefined") return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );
    }
  };

  const onInfluencerSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      initRecaptcha();
      const formattedPhone = values.phone.startsWith("+")
        ? values.phone
        : `+91${values.phone}`;
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-5 mb-2">
          <Image
            src={logo}
            alt="logo"
            height={30}
            width={300}
            className="rounded-xl"
          />
        </div>
        <p className="text-gray-500 text-lg">Welcome back! Login to continue</p>
      </div>

      <div className="w-full max-w-[450px] bg-white rounded-2xl shadow-xl shadow-slate-200/60 border-slate-200 border-2">
        <Tabs defaultValue="brand" className="w-full">
          <div className="p-1 bg-[#F9FAFB] border-b-slate-200 border-b-2 rounded-t-2xl mb-6">
            <TabsList className="grid w-full grid-cols-2 h-14 border-slate-300 bg-white">
              <TabsTrigger
                value="brand"
                className="cursor-pointer rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Smartphone className="w-4 h-4" /> Brand
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="influencer"
                className=" cursor-pointer rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  Influencer
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="px-6 pb-8">
            {/* BRAND CONTENT */}
            <TabsContent value="brand">
              <Form {...brandForm}>
                <form className="space-y-5">
                  <FormField
                    control={brandForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-medium">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                              placeholder="you@company.com"
                              className="pl-10 h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={brandForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600 font-medium">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="pl-10 h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                              {...field}
                            />
                            <Eye className="absolute right-3 top-3 h-5 w-5 text-slate-400 cursor-pointer" />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" />
                      <label
                        htmlFor="remember"
                        className="text-sm text-slate-500"
                      >
                        Remember me
                      </label>
                    </div>
                    <Link
                      href="#"
                      className="text-sm text-blue-600 font-medium"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <Button className="cursor-pointer w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2">
                    Login <ArrowRight className="w-5 h-5" />
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* INFLUENCER CONTENT */}
            <TabsContent value="influencer">
              {!otpSent ? (
                <Form {...influencerForm}>
                  <form
                    onSubmit={influencerForm.handleSubmit(onInfluencerSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={influencerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-medium">
                            Mobile Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                              <Input
                                placeholder="+1 (555) 000-0000"
                                className="pl-10 h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="bg-purple-50 p-4 rounded-xl flex items-center gap-3 text-purple-700 text-sm">
                      <Smartphone className="w-5 h-5" />
                      We'll send you an OTP to verify your mobile number
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="cursor-pointer w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-2xl text-lg font-semibold"
                    >
                      {loading ? "Sending..." : "Login"} →
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <Input
                    placeholder="6-digit OTP"
                    className="h-12 bg-slate-50/50 rounded-xl text-center text-xl tracking-widest"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button
                    onClick={() => {}}
                    className="w-full cursor-pointer h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl"
                  >
                    Verify OTP
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Social Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-12 rounded-xl cursor-pointer border-slate-200 flex items-center gap-2"
              >
                <Image
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  width={20}
                  height={20}
                  alt="G"
                />{" "}
                Google
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl cursor-pointer border-slate-200 flex items-center gap-2"
              >
                <Image
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  width={20}
                  height={20}
                  alt="F"
                />{" "}
                Facebook
              </Button>
            </div>

            <p className="text-center mt-8 text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-purple-600 font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Tabs>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
