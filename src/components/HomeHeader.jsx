import { Search, Bell, MapPin } from "lucide-react";

const HomeHeader = ({ user }) => (
  <header className="bg-white px-6 pt-6 pb-4 rounded-b-[30px] shadow-sm">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
          <img src={user?.profilePic || "/default-avatar.png"} alt="profile" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">
            Hi, {user?.name || "Explorer"}
          </p>
          <div className="flex items-center text-[#0D7753] text-xs font-bold">
            <MapPin size={12} className="mr-1" /> India
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="p-2 bg-slate-50 rounded-full">
          <Bell size={20} />
        </button>
        <button className="p-2 bg-slate-50 rounded-full">🚀</button>
      </div>
    </div>
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        placeholder="Search Campaigns, Brands..."
        className="w-full h-12 bg-[#F3F4F6] rounded-2xl pl-12 pr-4 text-sm focus:outline-none"
      />
      <button className="absolute right-4 top-1/2 -translate-y-1/2">
        <div className="w-5 h-5 flex flex-col gap-1 items-end">
          <span className="w-5 h-0.5 bg-black" />
          <span className="w-3 h-0.5 bg-black" />
        </div>
      </button>
    </div>
  </header>
);

export default HomeHeader;
