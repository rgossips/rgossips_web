"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Phone,
  Instagram,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Loader2,
  Building2,
} from "lucide-react";

// ShadCN Components
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Firebase
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  signInWithPhoneNumber,
  onAuthStateChanged,
  RecaptchaVerifier,
} from "firebase/auth";

import logo from "@/assets/logo.png";
import ErrorModal from "@/components/ErrorModal";

// Mock API
async function fetchInstagramDataMock(username) {
  await new Promise((r) => setTimeout(r, 700));
  const u = username.replace("@", "");
  return {
    username: u,
    fullName: `${u} Creator`,
    profilePic: `https://avatar.iran.liara.run/public/boy?username=${u}`,
    followers: Math.floor(Math.random() * 50_000),
  };
}

export default function RegisterPage() {
  const t = useTranslations("AuthRegister");
  const router = useRouter();

  // Schema
  const InfluencerSchema = z.object({
    name: z.string().min(2, t("errors.nameRequired")),
    phone: z.string().min(10, t("errors.invalidPhone")),
    instagram: z.string().min(2, t("errors.instagramRequired")),
  });

  // States
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [instaInfo, setInstaInfo] = useState(null);
  const [instaValidated, setInstaValidated] = useState(false);
  const [validatingInsta, setValidatingInsta] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorText, setErrorText] = useState("");

  const form = useForm({
    resolver: zodResolver(InfluencerSchema),
    defaultValues: { name: "", phone: "", instagram: "" },
  });

  // OTP & Recaptcha Logic
  const initRecaptcha = async () => {
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

  const onSendOtp = async () => {
    const phone = form.getValues("phone");
    if (phone.length < 10) return;

    setLoading(true);
    try {
      await initRecaptcha();
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setOtpDialogOpen(true);
    } catch (err) {
      setErrorText(t("errors.sendOtpFailed"));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      await confirmationResult.confirm(enteredOtp);
      setPhoneVerified(true);
      setOtpDialogOpen(false);
    } catch (err) {
      setErrorText(t("errors.invalidOtp"));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateInstagram = async () => {
    const username = form.getValues("instagram");
    if (!username) return;
    setValidatingInsta(true);
    const info = await fetchInstagramDataMock(username);
    setInstaInfo(info);
    setInstaValidated(true);
    setValidatingInsta(false);
  };

  const onSubmit = async (data) => {
    if (!phoneVerified) {
      setErrorText(t("errors.verifyPhoneFirst"));
      setShowError(true);
      return;
    }
    if (!instaValidated) {
      setErrorText(t("errors.validateInstagramFirst"));
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "influencers", user.uid), {
        uid: user.uid,
        ...data,
        profilePic: instaInfo?.profilePic || "",
        role: "influencer",
        verificationState: 0,
        createdAt: serverTimestamp(),
      });
      setSuccessDialog(true);
    } catch (err) {
      setErrorText(t("errors.databaseError"));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-slate-50/30 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src={logo} alt="logo" height={30} width={200} className="mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          {t("subtitle")}
        </p>
      </div>

      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border-slate-200 border-2 overflow-hidden">
        <Tabs defaultValue="influencer" className="w-full">
          <div className="p-1 bg-[#F9FAFB] border-b-slate-200 border-b-2">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-transparent">
              <TabsTrigger
                value="brand"
                className="rounded-2xl opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4" /> {t("tabs.brand")}
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="influencer"
                className="cursor-pointer rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <User className="w-4 h-4" /> {t("tabs.influencer")}
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-8 py-8">
            <TabsContent value="influencer" className="mt-0">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">
                          {t("fullName")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                              placeholder={t("namePlaceholder")}
                              className="pl-10 h-12 bg-slate-50/50 rounded-xl"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone + Verify */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">
                          {t("mobileNumber")}
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                              <Input
                                placeholder="9876543210"
                                className="pl-10 h-12 bg-slate-50/50 rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <Button
                            type="button"
                            variant={phoneVerified ? "secondary" : "outline"}
                            className="h-12 cursor-pointer rounded-xl border-slate-200 px-6 font-semibold"
                            disabled={phoneVerified || loading}
                            onClick={onSendOtp}
                          >
                            {phoneVerified ? (
                              t("verified")
                            ) : loading ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              t("verify")
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Instagram + Validate */}
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-600">
                          {t("instagramHandle")}
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <div className="relative">
                              <Instagram className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                              <Input
                                placeholder={t("instagramPlaceholder")}
                                className="pl-10 h-12 bg-slate-50/50 rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <Button
                            type="button"
                            variant={instaValidated ? "secondary" : "outline"}
                            className="h-12 cursor-pointer rounded-xl border-slate-200 px-6 font-semibold"
                            disabled={instaValidated || validatingInsta}
                            onClick={handleValidateInstagram}
                          >
                            {instaValidated ? (
                              t("checked")
                            ) : validatingInsta ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              t("validate")
                            )}
                          </Button>
                        </div>
                        {instaValidated && instaInfo && (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2 animte-in fade-in duration-500">
                            <img
                              src={instaInfo.profilePic}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                              alt="profile"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                @{instaInfo.username}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {t("followers", {
                                  count: instaInfo.followers.toLocaleString(),
                                })}
                              </p>
                            </div>
                            <CheckCircle2 className="ml-auto w-4 h-4 text-green-500" />
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full cursor-pointer h-14 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                  >
                    {loading ? t("processing") : t("createAccount")}{" "}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <p className="text-center mt-8 text-slate-500 text-sm">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="text-purple-600 font-bold hover:underline cursor-pointer"
        >
          {t("login")}
        </Link>
      </p>

      {/* Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <Smartphone className="text-purple-600 w-6 h-6" />
            </div>
            <DialogTitle>{t("otp.title")}</DialogTitle>
            <p className="text-sm text-slate-500 text-center">
              {t("otp.subtitle")}
            </p>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP value={enteredOtp} onChange={setEnteredOtp} maxLength={6}>
              <InputOTPGroup className="gap-2">
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="rounded-xl border-slate-200 w-12 h-12 text-lg"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 cursor-pointer"
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? t("otp.verifying") : t("otp.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Success Modal */}
      <Dialog
        open={successDialog}
        onOpenChange={(open) => {
          if (!open) router.push("/influencer?step=0");
        }}
      >
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">
              {t("success.title")}
            </DialogTitle>
            <p className="text-slate-500 mt-2">
              {t("success.message")}
            </p>
            <Button
              className="w-full mt-8 h-12 rounded-xl cursor-pointer"
              onClick={() => router.push("/influencer")}
            >
              {t("success.continue")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div id="recaptcha-container"></div>
      <ErrorModal
        open={showError}
        errorText={errorText}
        onClose={() => setShowError(false)}
      />
    </div>
  );
}
