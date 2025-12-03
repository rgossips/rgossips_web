"use client";

import { useRef } from "react";
import TourTabs from "@/components/TourTabs";
import TourInfo from "@/components/TourInfo";
import GalleryCarousel from "@/components/GalleryCarousel";
import TourMap from "@/components/TourMap";
import BookingForm from "@/components/BookingForm";
import ItineraryAccordion from "@/components/ItenaryAccordian";
import Image from "next/image";
import Header from "@/components/Header";
import StepsToApply from "@/components/StepsToAplly";

export default function TourPage() {
  const infoRef = useRef(null);
  const itineraryRef = useRef(null);
  const galleryRef = useRef(null);
  const mapRef = useRef(null);

  const scrollTo = (ref) => {
    window.scrollTo({
      top: ref.current.offsetTop - 80,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      <Header />
      {/* HEADER SECTION WITH IMAGE */}
      <div className="relative h-[380px] w-full">
        <Image
          width={200}
          height={200}
          src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress"
          alt="banner"
          className="object-cover w-full h-full"
        />

        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
          <h1 className="text-4xl font-bold text-center px-3">
            5 Nights and 6 Days – Marvellous Uttarakhand
          </h1>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-10 lg:px-20 mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
        {/* LEFT SIDE CONTENT */}
        <div className="col-span-2 space-y-10">
          {/* STICKY TABS */}
          <TourTabs
            onInfo={() => scrollTo(infoRef)}
            onItinerary={() => scrollTo(itineraryRef)}
            onGallery={() => scrollTo(galleryRef)}
            onMap={() => scrollTo(mapRef)}
          />
          <section ref={infoRef} id="info">
            <TourInfo />
          </section>

          {/* <section ref={itineraryRef} id="itinerary">
            <ItineraryAccordion />
          </section> */}

          <section ref={galleryRef} id="gallery">
            <GalleryCarousel />
          </section>

          <section ref={mapRef} id="map">
            <TourMap />
          </section>
          <section>
            <StepsToApply />
          </section>
        </div>

        {/* RIGHT FIXED FORM */}
        <div className="col-span-2 lg:col-span-1 relative">
          <div className="md:sticky top-24">
            <BookingForm />
          </div>
        </div>
      </div>
    </div>
  );
}
