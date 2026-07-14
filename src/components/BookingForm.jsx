"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useTranslations } from "next-intl";
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

// 1. Receive offer and onApply as props
export default function InfluencerCollabForm({ offer, onApply }) {
  const t = useTranslations("BookingForm");

  const formSchema = z.object({
    name: z.string().min(2, t("errors.nameRequired")),
    email: z.string().email(t("errors.invalidEmail")),
    instagram: z.string().url(t("errors.invalidInstagram")),
    niche: z.string().min(1, t("errors.selectNiche")),
    contentType: z.string().min(1, t("errors.selectContentType")),
    why: z.string().min(10, t("errors.whyTooShort")),
    terms: z.literal(true, {
      errorMap: () => ({ message: t("errors.acceptTerms") }),
    }),
  });

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
      setPopup(t("submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-6">
          <CardTitle className="text-xl font-bold text-center text-slate-800">
            {t("title")}
          </CardTitle>
          <p className="text-center text-slate-500 text-xs mt-1">
            {t("campaignPrefix")}{" "}
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
                      {t("fields.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.name")}
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
                      {t("fields.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.email")}
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
                      {t("fields.instagram")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.instagram")}
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
                        {t("fields.niche")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-slate-50">
                            <SelectValue placeholder={t("placeholders.select")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="travel">{t("niches.travel")}</SelectItem>
                          <SelectItem value="lifestyle">{t("niches.lifestyle")}</SelectItem>
                          <SelectItem value="food">{t("niches.food")}</SelectItem>
                          <SelectItem value="fashion">{t("niches.fashion")}</SelectItem>
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
                        {t("fields.contentType")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-slate-50">
                            <SelectValue placeholder={t("placeholders.select")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="reels">{t("contentTypes.reels")}</SelectItem>
                          <SelectItem value="posts">{t("contentTypes.posts")}</SelectItem>
                          <SelectItem value="vlog">{t("contentTypes.vlog")}</SelectItem>
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
                      {t("fields.why")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.why")}
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
                        {t.rich("termsAgreement", {
                          terms: (chunks) => (
                            <span className="font-bold underline">{chunks}</span>
                          ),
                        })}
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
                  t("submit")
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
              {t("success.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("success.description")}
            </DialogDescription>
            <Button
              className="w-full rounded-xl"
              onClick={() => setShowSuccessModal(false)}
            >
              {t("success.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </>
  );
}
