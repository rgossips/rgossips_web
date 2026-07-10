"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import AlertPopup from "@/components/AlertPopup";
// Removed direct Firestore imports here as the parent handles them

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
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

// 1. Receive offer and onApply as props
export default function InfluencerCollabForm({ offer, onApply }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()

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
      // 2. Destructure terms
      const { terms, ...dataToSave } = values;

      // 3. Call the onApply function passed from TourPage
      // This will handle the Firestore logic (adding to applications + updating offer)
      await onApply(dataToSave);

      setShowSuccessModal(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting application:", error);
      setPopup("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-6">
          <CardTitle className="text-xl font-bold text-center text-slate-800">
            Apply for This Campaign
          </CardTitle>
          <p className="text-center text-slate-500 text-xs mt-1">
            Campaign:{" "}
            <span className="font-semibold text-purple-600">
              {offer?.metadata?.title}
            </span>
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="rounded-xl bg-slate-50"
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
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@gmail.com"
                        className="rounded-xl bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Instagram URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/..."
                        className="rounded-xl bg-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Niche
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-slate-50">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-slate-50">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="reels">Reels</SelectItem>
                          <SelectItem value="posts">Posts</SelectItem>
                          <SelectItem value="vlog">Vlog</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="why"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      Your Plan
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us your content ideas..."
                        className="rounded-xl bg-slate-50 resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="text-[12px] leading-tight text-slate-600">
                        I agree to the{" "}
                        <span className="font-bold underline">terms</span> and
                        will post content within 7 days.
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={isSubmitting}
                type="submit"
                className="w-full h-12 text-md font-bold bg-gradient-to-r from-[#9810FA] to-[#FA1085] rounded-xl hover:opacity-90 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
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
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <div className="flex flex-col items-center p-6 space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Applied Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              The brand has been notified. You can track your status in your
              dashboard.
            </DialogDescription>
            <Button
              className="w-full rounded-xl"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </>
  );
}
