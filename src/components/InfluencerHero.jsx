"use client";
import green from "../../public/bg/green.png";

export default function Hero({ user }) {
  return (
    <section
      style={{
        backgroundImage: user?.banner ? `url(${user.banner})` : `url(${green})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="relative w-full h-full max-h-[60vh] lg:max-h-[80vh] bg-[#0D7753] pt-5 lg:pt-20 overflow-visible"
    >
      {/* LAYOUT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 pb-10 lg:pb-32">
        {/* LEFT SIDE */}
        <div className="flex flex-col justify-start">
          <h2 className="text-white text-[48px] sm:text-[64px] md:text-[80px] lg:text-[90px] font-black leading-tight">
            {user?.name || "____"}
          </h2>

          <svg
            width="200"
            height="32"
            viewBox="0 0 220 40"
            fill="none"
            className="mt-1 sm:mt-2 w-[150px] sm:w-[180px] md:w-[200px]"
          >
            <path
              d="M5 25 C 40 5, 90 35, 150 20 C 180 12, 200 25, 215 18"
              stroke="#F3D53A"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>

          <p className="text-white text-base sm:text-xl mt-3 opacity-90">
            {(user?.primaryCategories?.[0] || "") + " Influencer"}
          </p>
        </div>

        {/* EMPTY MIDDLE ON LARGE SCREENS */}
        <div className="hidden lg:block"></div>

        {/* RIGHT SIDE – STATS */}
        <div className="grid grid-cols-3 lg:grid-cols-2 justify-center text-white lg:gap-0">
          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Total Collaborations</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              {user?.totalCollabs || 0}
            </p>
          </div>

          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Active Collaborations</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              {user?.activeCollabs || 0}
            </p>
          </div>

          <div className="p-6 rounded-2xl flex flex-col items-center">
            <p className="text-lg text-center">Total Clients</p>
            <p className="text-5xl sm:text-6xl lg:text-7xl font-bold mt-2">
              {user?.totalClients || 0}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
