"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  Smartphone,
  Loader2,
} from "lucide-react";

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
import { useGlobal } from "@/context/GlobalContext";

const BrandSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const InfluencerSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

export default function LoginPage() {
  const router = useRouter();
  const { type, setType } = useGlobal();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("brands");

  const brandForm = useForm({
    resolver: zodResolver(BrandSchema),
    defaultValues: { email: "", password: "" },
  });

  const influencerForm = useForm({
    resolver: zodResolver(InfluencerSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    if (type === "brands" || type === "influencers") {
      setActiveTab(type);
    }
  }, [type]);

  const initRecaptcha = () => {
    if (typeof window === "undefined") return;
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          }
        );
      }
    } catch (err) {
      console.error("Recaptcha error:", err);
    }
  };

  const onBrandSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      // Implement your Email/Password login logic here
      console.log("Brand Login:", values);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
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
      setError("Failed to send OTP. Please check the number.");
      // Reset reCAPTCHA so user can retry
      if (window.recaptchaVerifier)
        window.recaptchaVerifier
          .render()
          .then((id) => window.grecaptcha.reset(id));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) return setError("Please enter a 6-digit OTP.");
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FDFDFF] py-10 px-4">
      <div className="mb-10 text-center">
        <Image
          src={logo}
          alt="logo"
          height={45}
          width={240}
          className="mx-auto mb-3"
        />
        <p className="text-slate-500 font-medium">
          Welcome back! Login to continue
        </p>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setType(val);
          }}
          className="w-full"
        >
          <div className="p-2 border-b border-slate-50">
            <TabsList className="grid w-full grid-cols-2 h-[60px] bg-transparent">
              <TabsTrigger
                value="brands"
                className="rounded-2xl flex gap-2 text-sm cursor-pointer font-bold transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#155DFC] data-[state=active]:to-[#9810FA] text-slate-400"
              >
                <Smartphone className="w-4 h-4" /> Brand
              </TabsTrigger>
              <TabsTrigger
                value="influencers"
                className="rounded-2xl cursor-pointer flex gap-2 text-sm font-bold transition-all data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9810FA] data-[state=active]:to-[#FA1085] text-slate-400 shadow-sm"
              >
                <Smartphone className="w-4 h-4" /> Influencer
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 md:p-10">
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <TabsContent value="brands" className="mt-0 outline-none">
              <Form {...brandForm}>
                <form
                  onSubmit={brandForm.handleSubmit(onBrandSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={brandForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold ml-1">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <Input
                              placeholder="you@company.com"
                              className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-purple-100"
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
                        <FormLabel className="text-slate-700 font-semibold ml-1">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl"
                              {...field}
                            />
                            <Eye className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 cursor-pointer" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        className="rounded-md border-slate-200"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-slate-500 font-medium cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                    <Link
                      href="#"
                      className="text-sm text-purple-600 font-bold hover:text-purple-700"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <Button
                    disabled={loading}
                    className="w-full h-15 bg-gradient-to-r from-[#155DFC] to-[#9810FA] hover:opacity-90 rounded-2xl text-lg font-bold shadow-xl shadow-blue-100 transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Login <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="influencers" className="mt-0 outline-none">
              {!otpSent ? (
                <Form {...influencerForm}>
                  <form
                    onSubmit={influencerForm.handleSubmit(onInfluencerSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={influencerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold ml-1">
                            Mobile Number
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                              <Input
                                placeholder="+91 98765 43210"
                                className="pl-12 h-14 bg-slate-50 border-slate-100 rounded-2xl text-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="bg-[#FAF5FF] p-4 rounded-2xl flex items-center gap-3 text-[#9810FA] text-sm font-medium border border-purple-50">
                      <Smartphone className="w-5 h-5 shrink-0" />
                      We'll send you an OTP to verify your mobile number
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full cursor-pointer h-15 bg-gradient-to-r from-[#9810FA] to-[#FA1085] hover:opacity-90 rounded-2xl text-lg font-bold shadow-xl shadow-purple-100 transition-all active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          Send OTP <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-800">
                      Verify OTP
                    </h3>
                    <p className="text-sm text-slate-500">
                      Sent to your mobile number
                    </p>
                  </div>
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    className="h-16 bg-slate-50 border-slate-100 rounded-2xl text-center text-2xl tracking-[0.5em] font-bold focus:ring-purple-100"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                  <Button
                    onClick={onVerifyOtp}
                    disabled={loading || otp.length < 6}
                    className="w-full h-15 bg-gradient-to-r from-[#9810FA] to-[#FA1085] rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-sm font-bold text-purple-600 hover:underline"
                  >
                    Change Phone Number
                  </button>
                </div>
              )}
            </TabsContent>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-slate-100 hover:bg-slate-50 font-bold text-slate-600 gap-2 cursor-pointer transition-colors"
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
                className="h-14 rounded-2xl border-slate-100 hover:bg-slate-50 font-bold text-slate-600 gap-2 cursor-pointer transition-colors"
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

            <p className="text-center mt-10 text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-[#9810FA] font-bold hover:underline"
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
