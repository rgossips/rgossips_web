"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
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

import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

import { useRouter } from "next/navigation"; // <-- import router

// ------------------ VALIDATION SCHEMA ------------------

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

// ------------------ COMPONENT ------------------

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const router = useRouter(); // <-- initialize router

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setFirebaseError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      console.log("Logged In User:", userCredential.user);
      router.push("/dashboard"); // <-- client-side navigation
    } catch (error) {
      console.error("Firebase Login Error:", error);
      setFirebaseError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col justify-center h-full w-full px-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Welcome Back</h1>
        <p className="text-gray-600 mt-1">
          Login to access your influencer dashboard.
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-6"
        >
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@mail.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="•••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Firebase Error */}
          {firebaseError && (
            <p className="text-red-500 text-sm">{firebaseError}</p>
          )}

          <Button
            className="w-full py-6 text-md cursor-pointer"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
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
    </div>
  );
}
