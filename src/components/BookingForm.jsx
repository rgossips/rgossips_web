"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Info } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  instagram: z.string().url("Enter a valid Instagram URL"),
  niche: z.string().min(1, "Please select a niche"),
  contentType: z.string().min(1, "Please select content type"),
  why: z.string().min(10, "Please tell us a bit more about your plan"),
  // Validation: Refine ensures the form cannot be submitted if false
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

export default function InfluencerCollabForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      instagram: "",
      niche: "",
      contentType: "",
      why: "",
      terms: false,
    },
  });

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      // 1. Destructure terms out so it is NOT saved in the database
      const { terms, ...dataToSave } = values;

      const applicationData = {
        ...dataToSave,
        brandId: "brand_123",
        offerId: "offer_456",
        userId: "user_789",
        status: "pending",
        createdAt: serverTimestamp(),
      };

      // 2. Save cleaned data to Firebase
      await addDoc(collection(db, "applications"), applicationData);

      setShowSuccessModal(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="w-full lg:max-w-2xl mx-auto mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-8">
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Confirm your Interest
          </CardTitle>
          <p className="text-center text-slate-500 text-sm mt-1">
            Fill in the details to apply for this collaboration
          </p>
        </CardHeader>

        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name & Email Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">
                        Your Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:ring-purple-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@gmail.com"
                          className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:ring-purple-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Instagram URL */}
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Instagram Profile URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/yourhandle"
                        className="rounded-xl h-12 bg-slate-50 border-slate-100 focus:ring-purple-100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Niche & Content Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">
                        Your Niche
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100">
                            <SelectValue placeholder="Select niche" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="fashion">Fashion</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">
                        Content Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-slate-100">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="reels">Reels</SelectItem>
                          <SelectItem value="posts">Posts</SelectItem>
                          <SelectItem value="vlog">YouTube Vlog</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Why Us */}
              <FormField
                control={form.control}
                name="why"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Why should we choose you?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain your unique value and content plan..."
                        className="min-h-[120px] rounded-xl bg-slate-50 border-slate-100 focus:ring-purple-100 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms Checkbox - Corrected Logic */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 bg-slate-50/80 p-4 rounded-xl border border-dashed border-slate-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1 data-[state=checked]:bg-[#9810FA] data-[state=checked]:border-[#9810FA]"
                        />
                      </FormControl>
                      <div className="text-sm leading-tight text-slate-600">
                        I agree to the{" "}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="underline cursor-help font-bold text-slate-800">
                                terms & rules
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 bg-slate-900 text-white rounded-lg">
                              <p className="flex gap-2 items-center mb-1">
                                <Info className="w-3 h-3" /> Valid Govt ID
                                required
                              </p>
                              <p className="flex gap-2 items-center">
                                <Info className="w-3 h-3" /> Post content within
                                7 days
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>{" "}
                        of this collaboration.
                      </div>
                    </div>
                    <FormMessage className="ml-1" />
                  </FormItem>
                )}
              />

              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#9810FA] to-[#FA1085] rounded-xl shadow-lg shadow-purple-100 hover:opacity-90 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-10">
          <DialogHeader className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Application Sent!
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-base">
              Your application has been received. Our team will review your
              profile and notify you via email shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button
              className="w-full h-12 bg-slate-900 rounded-xl font-bold"
              onClick={() => setShowSuccessModal(false)}
            >
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
