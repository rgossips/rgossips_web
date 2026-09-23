"use client";

// PDF preview for the creator résumé.
//
// This used to carry its own hardcoded creator ("Rohan Sharma", 145K
// followers) and ignore whatever the page passed in, so every résumé on the
// site rendered the same fictional person. It now renders exactly the data it
// is handed — see src/lib/resumeData.js — and nothing else.
//
// PDFViewer is browser-only and pulls in a large renderer, so the page loads
// this component with next/dynamic and ssr:false.

import { motion } from "framer-motion";
import { PDFViewer } from "@react-pdf/renderer";
import ResumeTemplate from "./ResumeTemplate";

export default function ResumeViewer({ data, className = "" }) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full h-[70vh] sm:h-[78vh] rounded-2xl overflow-hidden border border-white/10 bg-black/20 ${className}`}
    >
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        <ResumeTemplate data={data} />
      </PDFViewer>
    </motion.div>
  );
}
