"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

import UserSettingsForm from "@/components/UserSettingsForm";
import MyEarningsAndAnalytics from "@/components/MyEarningsAndAnalytics";
import MyCampaignsTable from "@/components/MyCampaignsTable";
import UserHeader from "@/components/UserHeader";
import InstagramAnalytics from "@/components/InstagramAnalytics";

export default function ProfilePage() {
  // Pull profile (userData) directly from context
  const { profile, loading } = useAuth();

  if (loading) return <div>Loading Profile...</div>;
  if (!profile) return <div>No profile found.</div>;

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24 pt-[150px]">
      <div className="max-w-[80vw] mx-auto px-4 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 -mt-16">
        {/* Pass the global profile data to components */}
        <UserHeader userData={profile} />

        <Card className="shadow-md">
          <CardContent className="p-6">
            <UserSettingsForm userData={profile} />
          </CardContent>
        </Card>
      </div>

      <div className="max-w-[80vw] mx-auto mt-10 px-4">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100 rounded-md mb-10 pb-10 shadow-sm">
            <TabsTrigger
              value="earnings"
              className="text-lg font-semibold cursor-pointer data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              Earnings & Analytics
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="text-lg font-semibold cursor-pointer data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              My Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="instagram"
              className="text-lg font-semibold cursor-pointer data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              Instagram Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <MyEarningsAndAnalytics />
          </TabsContent>
          <TabsContent value="campaigns">
            <MyCampaignsTable />
          </TabsContent>
          <TabsContent value="instagram">
            <InstagramAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
