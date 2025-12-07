"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import UserSettingsForm from "@/components/UserSettingsForm";
import MyEarningsAndAnalytics from "@/components/MyEarningsAndAnalytics";
import MyCampaignsTable from "@/components/MyCampaignsTable";
import UserHeader from "@/components/UserHeader";

export default function ProfilePage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24 pt-[150px]">
      {/* Top Section */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 -mt-16">
        {/* Left — User Info */}
        <UserHeader />

        {/* Right — User Settings Form */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <UserSettingsForm />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tabs */}
      <div className="max-w-6xl mx-auto mt-24 px-4">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100 rounded-lg overflow-hidden mb-5">
            <TabsTrigger
              value="earnings"
              className="text-lg font-semibold py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Earnings & Analytics
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="text-lg font-semibold py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              My Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings">
            <MyEarningsAndAnalytics />
          </TabsContent>

          <TabsContent value="campaigns">
            <MyCampaignsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
