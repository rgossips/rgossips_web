"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const DEMO_EMAIL = "grievance@rgossips.com";

export default function CTASection() {
  const router = useRouter();
  return (
    <section className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mx-auto relative overflow-hidden bg-linear-to-br from-[#155DFC] via-[#9810FA] to-[#E60076] px-8 py-16 md:py-24 text-center text-white"
      >
        {/* Decorative Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>JOIN 10,000+ USERS</span>
          </motion.div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl leading-[1.1]">
            Ready to Transform Your <br className="hidden md:block" />{" "}
            Influencer Marketing?
          </h2>

          {/* Subheading */}
          <p className="text-blue-50 text-lg md:text-xl mb-10 max-w-2xl font-light">
            Start your 14-day free trial today. No credit card required. Cancel
            anytime.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="h-14 px-8 rounded-2xl bg-white text-purple-600 hover:bg-blue-50 font-bold text-lg group transition-all cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-2xl border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold text-lg cursor-pointer"
            >
              <a href={`mailto:${DEMO_EMAIL}?subject=Schedule%20a%20Demo`}>
                Schedule a Demo
              </a>
            </Button>
          </div>

          {/* Feature List */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-sm text-blue-50/90">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-50/90">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-50/90">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Cancel anytime
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
