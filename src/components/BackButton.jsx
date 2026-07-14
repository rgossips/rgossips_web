"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function BackButton() {
  const router = useRouter();
  const t = useTranslations("BackButton");

  return (
    <Button
      variant="ghost"
      onClick={() => router.push("/")}
      className="fixed cursor-pointer bg-white/80 border-2 top-6 left-4 md:left-10 gap-1 px-2 md:px-4 text-slate-600 hover:text-slate-900 transition-all z-50 group"
    >
      <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      <span className="hidden md:block font-medium">{t("back")}</span>
    </Button>
  );
}
