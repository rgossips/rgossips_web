"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AlertPopup from "@/components/AlertPopup";

export default function OwnerControls({ influencer }) {
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
      setPopup({ title: "Monthly limit reached", message: "You can only generate 1 resume per month.", tone: "info" });
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      setPopup({ title: "Resume generated", message: "Your AI resume has been generated.", tone: "success" });
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10 p-6 rounded-xl bg-white/5 border border-white/10"
    >
      <h2 className="text-xl font-semibold mb-4">Creator Controls</h2>

      <div className="flex flex-wrap gap-4">
        <Button variant="secondary">Edit Profile</Button>

        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Regenerate AI Resume"}
        </Button>
      </div>

      <p className="text-sm text-gray-400 mt-4">
        Resume generation limit: <b>1 per month</b>
      </p>
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </motion.div>
  );
}
