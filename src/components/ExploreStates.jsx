"use client";
import SectionTitle from "./SectionTitle";
import mumbai from "@/assets/states/mumbai.png";
import amritsar from "@/assets/states/amritsar.png";
import kolkata from "@/assets/states/kolkata.png";
import agra from "@/assets/states/agra.png";
import jaipur from "@/assets/states/jaipur.png";
import Image from "next/image";
import { useState } from "react";

const STATES = [
  { name: "Mumbai", icon: mumbai },
  { name: "Amritsar", icon: amritsar },
  { name: "Kolkata", icon: kolkata },
  { name: "Agra", icon: agra },
  { name: "Jaipur", icon: jaipur },
  { name: "Mumbai", icon: mumbai },
  { name: "Amritsar", icon: amritsar },
  { name: "Kolkata", icon: kolkata },
  { name: "Agra", icon: agra },
  { name: "Jaipur", icon: jaipur },
];

export default function ExploreStates() {
  const [expanded, setExpanded] = useState(false);

  const visibleStates = expanded ? STATES : STATES.slice(0, 4); // <-- ONE ROW

  return (
    <section className="w-full py-10 flex flex-col items-center">
      <SectionTitle text="Explore States" />

      {/* GRID  */}
      <div
        className="
          grid 
          grid-cols-2 
          sm:grid-cols-3 
          lg:grid-cols-4 
          gap-6 
          mt-8 
          w-full 
          max-w-4xl 
          px-4
        "
      >
        {visibleStates.map((state, index) => (
          <div
            key={state.name + index}
            className="flex flex-col items-center hover:opacity-80 cursor-pointer"
          >
            <Image
              src={state.icon}
              alt={state.name}
              className="w-32 h-32 mb-2"
            />
            <p className="text-sm font-medium">{state.name}</p>
          </div>
        ))}
      </div>

      {/* "SEE MORE" / "SEE LESS" BUTTON */}
      <div className="mt-8 cursor-pointer">
        <button
          onClick={() => setExpanded(!expanded)}
          className="
          cursor-pointer
            border border-blue-600 text-blue-600 
            px-10 py-2 rounded-lg text-sm font-semibold 
            hover:bg-blue-600 hover:text-white transition
          "
        >
          {expanded ? "SEE LESS" : "EXPLORE MORE"}
        </button>
      </div>
    </section>
  );
}
