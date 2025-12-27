"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import UserSettingsForm from "@/components/UserSettingsForm";
import MyEarningsAndAnalytics from "@/components/MyEarningsAndAnalytics";
import MyCampaignsTable from "@/components/MyCampaignsTable";
import UserHeader from "@/components/UserHeader";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      console.log("usr", user);
      if (!user) return;

      try {
        const ref = doc(db, "influencers", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          console.log(snap.data());
          setUserData({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Failed to fetch influencer data:", err);
      }
    };

    fetchUser();
  }, [user]);

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24 pt-[150px]">
      {/* Top Section */}
      <div className="max-w-[80vw] mx-auto px-4 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 -mt-16">
        {/* Left — User Info */}
        <UserHeader userData={userData} />

        {/* Right — User Settings Form */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <UserSettingsForm userData={userData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Tabs */}
      <div className="max-w-[80vw] mx-auto mt-24 px-4">
        <Tabs defaultValue="earnings" className="w-full">
          <TabsList
            className="
      w-full 
      grid grid-cols-3 
      bg-gray-100 
      rounded-md
      mb-10          
      shadow-sm
    "
          >
            <TabsTrigger
              value="earnings"
              className="
        text-lg font-semibold rounded-l-md py-2
        data-[state=inactive]:py-2 
        data-[state=active]:bg-blue-600 
        data-[state=active]:text-white 
        data-[state=active]:shadow-md cursor-pointer
      "
            >
              Earnings & Analytics
            </TabsTrigger>

            <TabsTrigger
              value="campaigns"
              className="
        text-lg font-semibold cursor-pointer rounded-r-md py-2
        data-[state=inactive]:py-2 
        data-[state=active]:bg-blue-600 
        data-[state=active]:text-white 
        data-[state=active]:shadow-md
      "
            >
              My Campaigns
            </TabsTrigger>

            <TabsTrigger
              value="instagram"
              className="
        text-lg font-semibold cursor-pointer rounded-r-md py-2
        data-[state=inactive]:py-2 
        data-[state=active]:bg-blue-600 
        data-[state=active]:text-white 
        data-[state=active]:shadow-md
      "
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
        </Tabs>
      </div>
    </div>
  );
}
