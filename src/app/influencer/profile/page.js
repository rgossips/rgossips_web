"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AddReelFlow from "@/components/AddReelFlow";
import DashboardView from "@/components/DashboardView";
import MyInformationDetail from "@/components/MyInformationDetail";
import AnalyticsPage from "@/components/AnalyticsPage";

import NotificationSettings from "@/components/NotificationSettings";
import PrivacySecurityPage from "@/components/PrivacySettings";
import ChangePassword from "@/components/ChangePassword";
import TrustedDevices from "@/components/TrustedDevices";
import DeactivateAccount from "@/components/DeactiveAccount";
import HelpSupport from "@/components/HelpAndSupport";
import PaymentMethods from "@/components/PaymentMethods";

export default function ProfilePage() {
  const router = useRouter();
  const [view, setView] = useState("dashboard"); // dashboard | my-info | add-reel

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <div className="bg-[#F3F4F9] min-h-screen pb-20 lg:pb-0 font-sans text-slate-900 antialiased overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === "dashboard" && (
          <DashboardView
            key="dash"
            onNotificationClick={() => {
              setView("notifications");
            }}
            onPrivacyClick={() => {
              setView("privacy");
            }}
            onOpenAnalytics={() => setView("analytics")}
            onOpenServiceRequests={() => router.push("/influencer/services/orders")}
            onOpenInfo={() => setView("my-info")}
            onhelpSupportClick={() => setView("help&support")}
            onPaymentClick={() => setView("payments")}
          />
        )}
        {view === "my-info" && (
          <MyInformationDetail
            key="info"
            onBack={() => setView("dashboard")}
          />
        )}
        {view === "add-reel" && (
          <div className="min-h-screen bg-gray-50 flex justify-center items-start h-full pb-10 font-sans lg:pt-24">
            <AddReelFlow key="reel" onBack={() => setView("my-info")} />
          </div>
        )}
        {view === "analytics" && (
          <AnalyticsPage key="analytics" onBack={() => setView("dashboard")} />
        )}
        {view === "notifications" && (
          <NotificationSettings
            key="notifications"
            onBack={() => setView("dashboard")}
          />
        )}
        {view === "privacy" && (
          <PrivacySecurityPage
            key="privacy"
            onBack={() => setView("dashboard")}
            onTrustedDevices={() => setView("trusted-devices")}
            onDeactiveAccount={() => setView("deactivate-account")}
            onPasswordChange={() => {
              setView("password-change");
            }}
          />
        )}
        {view === "password-change" && (
          <ChangePassword
            key="password-change"
            onBack={() => setView("privacy")}
          />
        )}
        {view === "trusted-devices" && (
          <TrustedDevices
            key="trusted-devices"
            onBack={() => setView("privacy")}
          />
        )}
        {view === "deactivate-account" && (
          <DeactivateAccount
            key="deactivate-account"
            onBack={() => setView("privacy")}
          />
        )}
        {view === "payments" && (
          <PaymentMethods key="payments" onBack={() => setView("dashboard")} />
        )}
        {view === "help&support" && (
          <HelpSupport key="help-support" onBack={() => setView("dashboard")} />
        )}
      </AnimatePresence>
    </div>
  );
}
