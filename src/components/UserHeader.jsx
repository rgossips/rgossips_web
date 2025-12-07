import React from "react";
import Image from "next/image";

export default function UserHeader() {
  return (
    <div className="flex flex-col items-center md:items-center text-center bg-white shadow-md rounded-xl p-6">
      {/* Profile Image */}
      <div className="relative">
        <Image
          width={300}
          height={300}
          alt="userImg"
          src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
          className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-lg"
        />

        {/* Verified Badge */}
        <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-[7px] shadow-md flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Upload Button */}
      <label className="mt-4 text-sm text-blue-600 cursor-pointer hover:underline">
        Upload Profile Picture
        <input type="file" className="hidden" />
      </label>

      {/* User Name */}
      <h2 className="text-2xl font-semibold mt-3">Your Name</h2>
      <p className="text-gray-500 text-sm">Influencer • Creator</p>

      {/* Instagram Handle */}
      <p className="text-gray-600 text-sm mt-1">
        <span className="text-pink-500 font-medium">@your_instagram</span>
      </p>
    </div>
  );
}
