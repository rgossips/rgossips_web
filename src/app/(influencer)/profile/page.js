"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Home, Search, Briefcase, User as UserIcon } from "lucide-react";
import AddReelFlow from "@/components/AddReelFlow";
import DashboardView from "@/components/DashboardView";
import MyInformationDetail from "@/components/MyInformationDetail";
import AnalyticsPage from "@/components/AnalyticsPage";
import DetailedCampaignAnalytics from "@/components/CampaignAnalytics";
import { vi } from "zod/v4/locales";
import EditProfilePage from "@/components/EditProfilePage";
import NotificationSettings from "@/components/NotificationSettings";
import PrivacySecurityPage from "@/components/PrivacySettings";
import ChangePassword from "@/components/ChangePassword";
import TrustedDevices from "@/components/TrustedDevices";
import DeactivateAccount from "@/components/DeactiveAccount";
import HelpSupport from "@/components/HelpAndSupport";

export default function ProfilePage() {
  const [view, setView] = useState("dashboard"); // dashboard | my-info | add-reel

  return (
    <div className="bg-[#F3F4F9] min-h-screen font-sans text-slate-900 antialiased overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === "dashboard" && (
          <DashboardView
            key="dash"
            onOpenEdit={() => {
              setView("edit-profile");
            }}
            onNotificationClick={() => {
              setView("notifications");
            }}
            onPrivacyClick={() => {
              setView("privacy");
            }}
            onOpenAnalytics={() => setView("analytics")}
            onOpenInfo={() => setView("my-info")}
            onhelpSupportClick={() => setView("help&support")}
          />
        )}
        {view === "my-info" && (
          <MyInformationDetail
            key="info"
            onBack={() => setView("dashboard")}
            onAddReel={() => setView("add-reel")}
          />
        )}
        {view === "add-reel" && (
          <AddReelFlow key="reel" onBack={() => setView("my-info")} />
        )}
        {view === "analytics" && (
          <AnalyticsPage
            key="analytics"
            onCampaignAnalytics={() => {
              setView("campaign");
            }}
            onBack={() => setView("dashboard")}
          />
        )}
        {view === "campaign" && (
          <DetailedCampaignAnalytics
            key="campaign"
            onBack={() => setView("analytics")}
          />
        )}
        {view === "edit-profile" && (
          <EditProfilePage
            key="edit-profile"
            onBack={() => setView("dashboard")}
          />
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
        {view === "help&support" && (
          <HelpSupport key="help-support" onBack={() => setView("dashboard")} />
        )}
      </AnimatePresence>
    </div>
  );
}
