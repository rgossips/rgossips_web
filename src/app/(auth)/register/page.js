"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ShadCN
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// FIREBASE
import { auth, db, RecaptchaVerifier } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInWithPhoneNumber } from "firebase/auth";
import ProfileStepPopup from "@/components/ProfileStepPopup";

// ==========================
// SCHEMA
// ==========================
const InfluencerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  dob: z.string().optional(),
  gender: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  country: z.string().min(2),
  instagram: z.string().min(2),
  profilePic: z.string().optional(),
});

// ==========================
// MOCK INSTAGRAM API
// ==========================
async function fetchInstagramDataMock(username) {
  await new Promise((r) => setTimeout(r, 700));
  const u = username.replace("@", "");

  return {
    username: u,
    fullName: `${u} Creator`,
    profilePic: `https://avatars.dicebear.com/api/identicon/${encodeURIComponent(
      u
    )}.svg`,
    followers: Math.floor(Math.random() * 50_000),
  };
}

// ======================================
// 🚀 FULLY FIXED REGISTER PAGE
// ======================================
export default function RegisterInfluencer() {
  const form = useForm({
    resolver: zodResolver(InfluencerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dob: "",
      gender: "",
      city: "",
      state: "",
      country: "",
      instagram: "",
      profilePic: "",
    },
  });

  const [instaInfo, setInstaInfo] = useState(null);
  const [instaValidated, setInstaValidated] = useState(false);

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");

  const [emailOtpDialog, setEmailOtpDialog] = useState(false);
  const [enteredEmailOtp, setEnteredEmailOtp] = useState("");

  const [confirmationResult, setConfirmationResult] = useState(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);

  // ======================================================
  // RECAPTCHA (FINAL FIX)
  // ======================================================
  const initRecaptcha = async () => {
    if (typeof window === "undefined") return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      await window.recaptchaVerifier.render(); // ✔ no error now
    }
  };

  // ======================================================
  // SEND PHONE OTP
  // ======================================================
  const sendPhoneOtp = async (rawPhone) => {
    let phone = rawPhone.trim();
    if (!phone || phone.length < 10) return alert("Invalid phone number");

    try {
      setSendingOtp(true);

      await initRecaptcha();

      if (!phone.startsWith("+") && phone.length === 10) {
        phone = "+91" + phone;
      }

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setOtpDialogOpen(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // ======================================================
  // VERIFY PHONE OTP
  // ======================================================
  const verifyPhoneOtp = async () => {
    try {
      setVerifyingOtp(true);

      await confirmationResult.confirm(enteredOtp);

      setPhoneVerified(true);
      setOtpDialogOpen(false);
    } catch {
      alert("Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ======================================================
  // EMAIL OTP MOCK
  // ======================================================
  const sendEmailOtp = async (email) => {
    if (!email) return alert("Enter email");

    setSendingEmailOtp(true);
    await new Promise((r) => setTimeout(r, 600));

    setEmailOtpDialog(true);
    setSendingEmailOtp(false);
  };

  const verifyEmailOtp = async () => {
    setVerifyingEmailOtp(true);

    await new Promise((r) => setTimeout(r, 800));

    if (enteredEmailOtp === "123456") {
      setEmailVerified(true);
      setEmailOtpDialog(false);
    } else {
      alert("Incorrect Email OTP");
    }

    setVerifyingEmailOtp(false);
  };

  // ======================================================
  // INSTAGRAM VALIDATION
  // ======================================================
  const handleValidateInstagram = async () => {
    const username = form.getValues("instagram");
    if (!username) return alert("Enter username");

    const info = await fetchInstagramDataMock(username);
    setInstaInfo(info);
    setInstaValidated(true);
    form.setValue("profilePic", info.profilePic);
  };

  // ======================================================
  // SUBMIT
  // ======================================================
  const onSubmit = async (data) => {
    if (!phoneVerified) return alert("Verify phone");
    if (!emailVerified) return alert("Verify email");
    if (!instaValidated) return alert("Validate Instagram");

    console.log("Firebase User:", firebaseUser);

    if (!firebaseUser) {
      alert("User not ready. Please wait 1 second and try again.");
      return;
    }

    await setDoc(doc(db, "influencers", firebaseUser.uid), {
      uid: firebaseUser.uid,
      ...data,
      profilePic: data.profilePic || instaInfo?.profilePic,
      role: "influencer",
      createdAt: serverTimestamp(),
    });

    setSuccessDialog(true);
  };

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <>
      <div className="px-10 py-8 w-full">
        {/* <ProfileStepPopup /> */}
        <h1 className="text-3xl font-semibold mb-2">
          Create Influencer Account
        </h1>
        <p className="text-gray-600 mb-6">Verify Phone & Email to continue.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* NAME */}
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <div className="flex items-end gap-3">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="creator@mail.com" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                disabled={emailVerified || sendingEmailOtp}
                onClick={() => sendEmailOtp(form.getValues("email"))}
              >
                {emailVerified
                  ? "Verified"
                  : sendingEmailOtp
                  ? "Sending..."
                  : "Verify"}
              </Button>
            </div>

            {/* PHONE + OTP */}
            <div className="flex items-end gap-3">
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                disabled={phoneVerified || sendingOtp}
                onClick={() => sendPhoneOtp(form.getValues("phone"))}
              >
                {phoneVerified
                  ? "Verified"
                  : sendingOtp
                  ? "Sending..."
                  : "Verify"}
              </Button>
            </div>

            {/* GENDER + DOB */}
            <div className="flex gap-3">
              <FormField
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                name="dob"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* CITY */}
            <FormField
              name="city"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Chandigarh" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* STATE */}
            <FormField
              name="state"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="Punjab" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* COUNTRY */}
            <FormField
              name="country"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="India" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* INSTAGRAM */}
            <div className="flex items-end gap-3">
              <FormField
                name="instagram"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Instagram Username</FormLabel>
                    <FormControl>
                      <Input placeholder="@username" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                disabled={instaValidated}
                onClick={handleValidateInstagram}
              >
                {instaValidated ? "Validated" : "Validate"}
              </Button>
            </div>

            {instaValidated && instaInfo && (
              <div className="flex items-center gap-3 mt-2">
                <Image
                  src={instaInfo.profilePic}
                  width={50}
                  height={50}
                  className="rounded-full"
                  alt="profile"
                />
                <div>
                  <div>@{instaInfo.username}</div>
                  <div className="text-sm text-gray-600">
                    {instaInfo.fullName}
                  </div>
                  <div className="text-sm text-gray-500">
                    Followers: {instaInfo.followers}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full py-4">
              Register
            </Button>
          </form>
        </Form>
      </div>

      {/* PHONE OTP DIALOG */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Phone OTP</DialogTitle>
          </DialogHeader>

          <InputOTP value={enteredOtp} onChange={setEnteredOtp} maxLength={6}>
            <InputOTPGroup>
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <DialogFooter>
            <Button className="w-full" onClick={verifyPhoneOtp}>
              {verifyingOtp ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMAIL OTP DIALOG */}
      <Dialog open={emailOtpDialog} onOpenChange={setEmailOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Email OTP</DialogTitle>
          </DialogHeader>

          <InputOTP
            value={enteredEmailOtp}
            onChange={setEnteredEmailOtp}
            maxLength={6}
          >
            <InputOTPGroup>
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <DialogFooter>
            <Button className="w-full" onClick={verifyEmailOtp}>
              {verifyingEmailOtp ? "Verifying..." : "Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Successful</DialogTitle>
          </DialogHeader>
          <p>Your influencer profile has been created.</p>
          <Button
            className="w-full mt-4"
            onClick={() => setSuccessDialog(false)}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* RECAPTCHA */}
      <div id="recaptcha-container"></div>
    </>
  );
}
