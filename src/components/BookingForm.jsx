"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  instagram: z.string().url("Enter a valid URL"),
  niche: z.string().min(1, "Required"),
  contentType: z.string().min(1, "Required"),
  why: z.string().min(10, "Tell us about your plan"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
});

export default function InfluencerCollabForm() {
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

  function onSubmit(values) {
    console.log(values);
    // API submission logic
  }

  return (
    <Card className="w-full lg:max-w-2xl mx-auto mb-10 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Confirm your Interest
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="example@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instagram Link */}
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Profile URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://instagram.com/yourprofile"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6">
              {/* Niche */}
              <FormField
                control={form.control}
                name="niche"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Your Niche</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select niche" />
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

              {/* Content Type */}
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Content You Will Create</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reels">Reels</SelectItem>
                        <SelectItem value="posts">Posts</SelectItem>
                        <SelectItem value="vlog">YouTube Vlog</SelectItem>
                        <SelectItem value="stories">Stories</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Why Collaborate */}
            <FormField
              control={form.control}
              name="why"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why should we choose you?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain how you will showcase the hotel and value you bring..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms + Tooltip */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>

                  <div className="text-sm">
                    I agree to the{" "}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="underline cursor-pointer">
                          terms & rules
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          • Must carry a valid Government ID <br />
                          • Stay dates subject to availability <br />
                          • Must post agreed content within 7 days <br />• Hotel
                          reserves the right to reject applications
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button type="submit" className="w-full text-lg">
              Submit Application
            </Button>

            {/* Contact Us */}
            <div className="text-center text-sm text-muted-foreground">
              <div className="underline font-medium cursor-pointer">
                Contact us
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
