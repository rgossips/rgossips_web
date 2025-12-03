"use client";

import { useState } from "react";
import { ChevronDown, Calendar, MapPin } from "lucide-react";
import { FaInstagram, FaCameraRetro, FaVideo, FaFileAlt } from "react-icons/fa"; // React icons for deliverables
import { cn } from "@/lib/utils"; // shadcn/ui utility for classNames
import { Card } from "@/components/ui/card"; // shadcn/ui Card component

export default function TourInfo() {
  const [serviceOpen, setServiceOpen] = useState(false);

  const deliverables = [
    {
      icon: <FaCameraRetro className="text-orange-700" />,
      label: "Instagram Stories",
      count: 5,
    },
    {
      icon: <FaFileAlt className="text-orange-700" />,
      label: "Instagram Posts",
      count: 1,
    },
    {
      icon: <FaVideo className="text-orange-700" />,
      label: "Instagram Reels",
      count: 1,
    },
  ];

  const eligibility = [
    {
      icon: <FaInstagram />,
      label: "Followers",
      value: "10K – 50K",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: <FaInstagram />,
      label: "Platform",
      value: "Instagram",
      color: "bg-purple-100 text-purple-700",
    },
    {
      icon: <FaFileAlt />,
      label: "Type",
      value: "Barter",
      color: "bg-green-100 text-green-700",
    },
    {
      icon: <FaFileAlt />,
      label: "Content",
      value: "Manual",
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* ------------------------------------ */}
      {/*           COLLAB BENEFITS            */}
      {/* ------------------------------------ */}{" "}
      <div className="w-full rounded-2xl p-6 shadow-sm bg-gradient-to-r from-purple-400 via-purple-200 to-purple-50 select-none">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <h2 className="text-xl font-semibold text-white">
            Collab Benefits
          </h2>{" "}
          <div className="px-3 py-1 text-xs bg-purple-700/50 text-white rounded-full">
            1N/2D{" "}
          </div>{" "}
        </div>
        <div className="mt-5 space-y-2">
          {/* Accordion for Service */}
          <div
            className="flex justify-between items-center cursor-pointer p-3 bg-white rounded-xl"
            onClick={() => setServiceOpen(!serviceOpen)}
          >
            <p className="text-sm font-medium text-black">Any Service</p>
            <ChevronDown
              size={18}
              className={cn(
                "transition-transform",
                serviceOpen && "rotate-180"
              )}
            />
          </div>
          {serviceOpen && (
            <p className="text-sm text-black bg-white p-3 rounded-xl border border-gray-200 mt-1">
              The hotel will provide all services free of cost.
            </p>
          )}

          {/* Guest Allowed */}
          <div className="p-3 bg-white rounded-xl border border-gray-200 text-black">
            <p className="text-sm font-medium">Guest Allowed</p>
            <p className="font-medium mt-1">1 – 5 Guests</p>
          </div>
        </div>
      </div>
      {/* ------------------------------------ */}
      {/*              DELIVERABLES             */}
      {/* ------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Deliverables</h2>
        <div className="space-y-3">
          {deliverables.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <div className="bg-orange-100 p-3 text-2xl rounded-full">
                  {item.icon}
                </div>
                {item.label}
              </span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      {/* ------------------------------------ */}
      {/*              ELIGIBILITY              */}
      {/* ------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Eligibility</h2>
        <div className="grid grid-cols-2 gap-4">
          {eligibility.map((item) => (
            <Card
              key={item.label}
              className="flex flex-row items-center gap-3 p-4"
            >
              <div
                className={cn(
                  item.color,
                  "p-3 text-3xl rounded-full flex items-center justify-center"
                )}
              >
                {item.icon}
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-medium text-black">{item.value}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      {/* ------------------------------------ */}
      {/*              AVAILABILITY             */}
      {/* ------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Availability</h2>

        <div className="space-y-4">
          {/* TIMINGS */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-green-100">
            <Calendar
              className="bg-green-100 text-green-700 p-1 rounded-full"
              size={22}
            />
            <div>
              <p className="font-medium">Timings</p>
              <p className="text-sm">
                <span className="font-semibold">Check-In:</span> 12:00 PM —
                <span className="font-semibold ml-2">Check-Out:</span> 11:00 AM
              </p>
            </div>
          </div>

          {/* LOCATION */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-green-100">
            <MapPin
              className="bg-green-100 text-green-700 p-1 rounded-full"
              size={22}
            />
            <p>Jim Corbett National Park, Uttarakhand, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
