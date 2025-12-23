"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

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
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { onAuthStateChanged, RecaptchaVerifier } from "firebase/auth";
import ProfileStepPopup from "@/components/ProfileStepPopup";

// ==========================
// SCHEMA
// ==========================
const InfluencerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
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
    profilePic: `https://images.pexels.com/photos/35298999/pexels-photo-35298999.jpeg`,
    followers: Math.floor(Math.random() * 50_000),
  };
}

// ======================================
// 🚀 REGISTER PAGE
// ======================================
export default function RegisterInfluencer() {
  const router = useRouter();
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
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [phoneVerified, setPhoneVerified] = useState(true);
  const [successDialog, setSuccessDialog] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const initRecaptcha = async () => {
    if (typeof window === "undefined") return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      await window.recaptchaVerifier.render();
    }
  };

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

  const handleValidateInstagram = async () => {
    const username = form.getValues("instagram");
    if (!username) return alert("Enter username");

    const info = await fetchInstagramDataMock(username);
    setInstaInfo(info);
    setInstaValidated(true);
    form.setValue("profilePic", info.profilePic);
  };

  const onSubmit = async (data) => {
    if (!phoneVerified) return alert("Verify phone");
    if (!instaValidated) return alert("Validate Instagram");

    try {
      // 1. CREATE AUTH USER
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = userCredential.user.uid;

      // 2. REMOVE PASSWORD FIELDS BEFORE STORING IN FIRESTORE
      const { password, confirmPassword, ...safeData } = data;

      // 3. SAVE PROFILE WITHOUT PASSWORD
      await setDoc(doc(db, "influencers", uid), {
        uid,
        ...safeData,
        profilePic: safeData.profilePic || instaInfo?.profilePic,
        role: "influencer",
        verificationState: 1,
        createdAt: serverTimestamp(),
      });

      setSuccessDialog(true);
      router.push("/influencer");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="px-6 py-2 w-full h-screen overflow-auto flex flex-col justify-center">
      <h1 className="text-3xl font-semibold mb-5">Create Influencer Account</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="creator@mail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PHONE + OTP */}
          <div className="flex items-end gap-2">
            <FormField
              name="phone"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              className="cursor-pointer"
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
          <div className="flex gap-2">
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* PASSWORD */}
          {/* <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-sm text-gray-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          {/* CONFIRM PASSWORD */}
          {/* <FormField
            name="confirmPassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-2 text-sm text-gray-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          {/* CITY/STATE */}
          <div className="flex gap-2">
            <FormField
              name="city"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Chandigarh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="state"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="Punjab" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* INSTAGRAM */}
          <div className="flex items-end gap-2">
            <FormField
              name="instagram"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Instagram Username</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="cursor-pointer"
              type="button"
              disabled={instaValidated}
              onClick={handleValidateInstagram}
            >
              {instaValidated ? "Validated" : "Validate"}
            </Button>
          </div>

          {instaValidated && instaInfo && (
            <div className="flex items-center gap-2 mt-1">
              <Image
                src={instaInfo.profilePic}
                width={40}
                height={40}
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

          <Button type="submit" className="cursor-pointer w-full py-3">
            Register
          </Button>
        </form>
      </Form>

      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>

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
            <Button className="w-full cursor-pointer" onClick={verifyPhoneOtp}>
              {verifyingOtp ? "Verifying..." : "Verify"}
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
            className="w-full mt-4 cursor-pointer"
            onClick={() => setSuccessDialog(false)}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* RECAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
