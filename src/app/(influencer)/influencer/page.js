"use client";
export const dynamic = "force-dynamic";

import BrandsCarousel from "@/components/BrandsCarousel2";
import CreatorsCarousel from "@/components/CreatorsCarousel";
import CreatorsCarouselWithLink from "@/components/CreatorsCarouselWithLink";
import CreatorStories from "@/components/CreatorStories";
import ExploreStates from "@/components/ExploreStates";
import FoodMoodGrid from "@/components/FoodMood";
import HeroImage from "@/components/HeroImg";
import Hero from "@/components/InfluencerHero";
import ProfileStepPopup from "@/components/ProfileStepPopup";
import SelectionMenu from "@/components/SelectionMenu";
import StayCarousel from "@/components/StayCarousel";
import TopExperiencesCarousel from "@/components/TopExperienceCarousel";
import TopPicksCarousel from "@/components/TopPicksCarousel";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { set } from "zod";

export default function HomePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log(user);
    if (!user?.uid) return;

    const influencerDocRef = () => {
      if (!user?.uid) return null;
      return doc(db, "influencers", user.uid);
    };

    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const ref = influencerDocRef();
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data();

          setUserData({ id: snap.id, ...data });
          console.log("Fetched influencer data:", data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch influencer data:", err);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <main className="relative w-full bg-[#0D7753]">
      {userData?.verificationState < 5 && (
        <ProfileStepPopup userData={userData} />
      )}
      <Hero user={userData} />
      <HeroImage userData={userData} />

      <div className="relative z-20 bg-white p-8">
        <SelectionMenu />
        <div className="flex flex-col gap-16 items-center">
          <TopPicksCarousel />
          <TopExperiencesCarousel />
          <ExploreStates />
          <StayCarousel />
          <CreatorStories />
          <BrandsCarousel />
          <FoodMoodGrid />
          <CreatorsCarousel />
          <CreatorsCarouselWithLink />
        </div>
      </div>
    </main>
  );
}
