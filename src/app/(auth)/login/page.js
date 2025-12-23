"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

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

import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// ------------------ VALIDATION SCHEMA ------------------

const LoginSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

// ------------------ COMPONENT ------------------

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [firebaseError, setFirebaseError] = useState("");

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      phone: "",
    },
  });

  // ------------------ INIT RECAPTCHA ------------------

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

  // ------------------ SEND OTP ------------------

  const sendOtp = async ({ phone }) => {
    setLoading(true);
    setFirebaseError("");

    try {
      await initRecaptcha();

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setFirebaseError(err.message || "Failed to send OTP");
    }

    setLoading(false);
  };

  // ------------------ VERIFY OTP ------------------

  const verifyOtp = async () => {
    if (!confirmationResult || otp.length !== 6) return;

    setLoading(true);
    setFirebaseError("");

    try {
      await confirmationResult.confirm(otp);

      // ✅ USER LOGGED IN
      router.push("/influencer");
    } catch (err) {
      console.error(err);
      setFirebaseError("Invalid OTP");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center h-full w-full px-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Welcome Back</h1>
        <p className="text-gray-600 mt-1">Login using your phone number.</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={
            otpSent
              ? (e) => {
                  e.preventDefault();
                  verifyOtp();
                }
              : form.handleSubmit(sendOtp)
          }
          className="w-full max-w-md space-y-6"
        >
          {/* PHONE INPUT */}
          {!otpSent && (
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* OTP INPUT */}
          {otpSent && (
            <FormItem>
              <FormLabel>Enter OTP</FormLabel>
              <FormControl>
                <Input
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}

          {/* Firebase Error */}
          {firebaseError && (
            <p className="text-red-500 text-sm">{firebaseError}</p>
          )}

          <Button
            className="w-full py-6 text-md cursor-pointer"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
          </Button>
        </form>
      </Form>

      {/* Footer */}
      <p className="text-sm text-gray-600 mt-6">
        Don’t have an account?{" "}
        <a href="/register" className="text-blue-600 hover:underline">
          Register
        </a>
      </p>

      {/* REQUIRED FOR FIREBASE */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
