import React from "react";

const SectionTitle = ({ text }) => {
  return (
    <div className="w-full flex items-center gap-4 mb-10">
      <span className="flex-1 h-[2px] bg-gradient-to-r from-purple-300 to-transparent"></span>
      <h2 className="text-lg sm:text-xl font-semibold tracking-wide text-gray-700 uppercase">
        {text}
      </h2>
      <span className="flex-1 h-[2px] bg-gradient-to-l from-purple-300 to-transparent"></span>
    </div>
  );
};

export default SectionTitle;
