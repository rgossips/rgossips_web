"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import AlertPopup from "@/components/AlertPopup";

export default function OwnerControls({ influencer }) {
  const t = useTranslations("OwnerControls");
  const [generating, setGenerating] = useState(false);
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()

  // dummy generation limit logic
  const lastGen = new Date(influencer.resume_last_generated_at);
  const now = new Date();

  const sameMonth =
    lastGen.getMonth() === now.getMonth() &&
    lastGen.getFullYear() === now.getFullYear();

  const handleGenerate = () => {
    if (sameMonth) {
      setPopup({ title: t("popup.limitReached.title"), message: t("popup.limitReached.message"), tone: "info" });
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      setPopup({ title: t("popup.generated.title"), message: t("popup.generated.message"), tone: "success" });
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10 p-6 rounded-xl bg-white/5 border border-white/10"
    >
      <h2 className="text-xl font-semibold mb-4">{t("heading")}</h2>

      <div className="flex flex-wrap gap-4">
        <Button variant="secondary">{t("editProfile")}</Button>

        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? t("generating") : t("regenerate")}
        </Button>
      </div>

      <p className="text-sm text-gray-400 mt-4">
        {t.rich("limitNote", { b: (c) => <b>{c}</b> })}
      </p>
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </motion.div>
  );
}
