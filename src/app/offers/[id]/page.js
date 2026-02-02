"use client";

import { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

import TourTabs from "@/components/TourTabs";
import TourInfo from "@/components/TourInfo";
import GalleryCarousel from "@/components/GalleryCarousel";
import TourMap from "@/components/TourMap";
import BookingForm from "@/components/BookingForm";
import Image from "next/image";
import Header from "@/components/Header";
import StepsToApply from "@/components/StepsToAplly";

export default function TourPage() {
  const { id } = useParams(); // Get the ID from URL
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  const infoRef = useRef(null);
  const galleryRef = useRef(null);
  const mapRef = useRef(null);

  // 1. Fetch Offer Data
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const docRef = doc(db, "offers", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setOffer({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such offer!");
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOffer();
  }, [id]);

  // 2. Handle Application Logic
  const handleApply = async (influencerData) => {
    try {
      // A) Create Application Document
      const appRef = await addDoc(collection(db, "applications"), {
        offerId: id,
        brandId: offer.brand.id,
        status: "pending",
        appliedAt: serverTimestamp(),
        ...influencerData, // Data from BookingForm (social links, stats, etc.)
      });

      // B) Append Application ID to the Offer document
      const offerRef = doc(db, "offers", id);
      await updateDoc(offerRef, {
        applications: arrayUnion(appRef.id),
      });

      alert("Application submitted successfully!");
    } catch (err) {
      console.error("Error applying:", err);
    }
  };

  const scrollTo = (ref) => {
    if (!ref.current) return;
    window.scrollTo({
      top: ref.current.offsetTop - 80,
      behavior: "smooth",
    });
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading Offer...
      </div>
    );
  if (!offer)
    return (
      <div className="h-screen flex items-center justify-center">
        Offer not found.
      </div>
    );

  return (
    <div className="w-full">
      <Header />

      {/* HEADER SECTION */}
      <div className="relative h-[380px] w-full">
        <Image
          fill
          src={
            offer.imageUrl ||
            "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg"
          }
          alt="banner"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl font-bold text-center px-3 max-w-4xl">
            {offer.metadata?.title}
          </h1>
          <p className="mt-2 text-lg opacity-90">{offer.metadata?.location}</p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-6 lg:px-20 mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 my-10">
        {/* LEFT SIDE CONTENT */}
        <div className="col-span-2 space-y-10">
          <TourTabs
            onInfo={() => scrollTo(infoRef)}
            onGallery={() => scrollTo(galleryRef)}
            onMap={() => scrollTo(mapRef)}
          />

          <section ref={infoRef} id="info">
            {/* Pass the metadata and description to TourInfo */}
            <TourInfo
              description={offer.description}
              metadata={offer.metadata}
              category={offer.category}
              brand={offer.brand}
            />
          </section>

          <section ref={galleryRef} id="gallery">
            {/* If you have a gallery array, pass it here */}
            <GalleryCarousel images={offer.galleryUrls || [offer.imageUrl]} />
          </section>

          <section ref={mapRef} id="map">
            <TourMap location={offer.metadata?.location} />
          </section>

          <section>
            <StepsToApply />
          </section>
        </div>

        {/* RIGHT FIXED FORM */}
        <div className="col-span-2 lg:col-span-1">
          <div className="md:sticky top-24">
            <BookingForm offer={offer} onApply={handleApply} />
          </div>
        </div>
      </div>
    </div>
  );
}
