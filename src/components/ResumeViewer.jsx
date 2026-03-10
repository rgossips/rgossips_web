"use client";

import { motion } from "framer-motion";

export default function ResumeViewer({ pdf }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[1300px] rounded-xl overflow-hidden border border-white/10 shadow-xl"
    >
      <iframe
        src="https://docs.google.com/gview?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf&embedded=true"
        className="w-full h-full"
      />
    </motion.div>
  );
}
