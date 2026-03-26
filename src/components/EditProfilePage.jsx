import React from "react";
import {
  ArrowLeft,
  Camera,
  MapPin,
  Mail,
  Phone,
  Instagram,
} from "lucide-react";

const EditProfilePage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans lg:pb-12 lg:pt-32">
      {/* Desktop Header */}
      <div className="hidden sticky top-0 w-full z-20 px-8 py-4 lg:flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="cursor-pointer p-2 btn-purple rounded-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Edit Profile
          </h1>
        </div>
        <button className="btn-purple px-8 py-2.5 rounded-xl cursor-pointer text-xs font-black shadow-lg shadow-pink-100 active:scale-95 transition-all">
          Save
        </button>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 bg-white z-20 px-6 py-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="cursor-pointer p-2 btn-purple rounded-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">
            Edit Profile
          </h1>
        </div>
        <button className="btn-purple px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-pink-100 active:scale-95 transition-all cursor-pointer">
          Save
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8 max-w-[6xl] mx-auto px-8 py-8">
        {/* Form Sections - Right Column */}
        <div className="col-span-12 space-y-6">
          {/* Profile Section - Left Column */}
          <div className="col-span-4">
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-[10px] lg:text-lg font-black text-gray-400 lg:text-black uppercase tracking-widest lg:tracking-normal mb-6">
                Profile Picture
              </h3>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-gray-900 cursor-pointer text-white rounded-xl border-4 border-white shadow-md">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="w-full lg:w-44 text-center">
                  <h4 className="text-sm font-black text-gray-900 mb-1">
                    Change Profile Photo
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 mb-4">
                    JPG, PNG or GIF. Max 5MB
                  </p>
                  <button className="w-full lg:w-56 px-4 py-2.5 cursor-pointer btn-purple rounded-xl text-[10px] font-black uppercase shadow-md transition-colors">
                    Upload New Photo
                  </button>
                </div>
              </div>
            </section>
          </div>
          {/* Basic Information Section */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Basic Information
            </h3>

            <InputGroup
              label="Display Name"
              placeholder="Ali | Men's Grooming,"
            />
            <InputGroup label="Subtitle" placeholder="Skincare & Lifestyle" />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                className="w-full p-4 bg-pink-100 border border-transparent focus:border-pink-200 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 min-h-[100px] outline-none transition-all"
              />
              <p className="text-[9px] font-bold text-gray-400 ml-1">
                Separate each line for better formatting
              </p>
            </div>
          </section>

          {/* Contact Information Section */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Contact Information
            </h3>

            <InputGroup
              label="Location"
              placeholder="Dehradun"
              icon={<MapPin size={16} className="text-pink-500" />}
            />
            <InputGroup
              label="Email Address"
              placeholder="ali@lifestyle.com"
              icon={<Mail size={16} className="text-pink-500" />}
            />
            <InputGroup
              label="Phone Number"
              placeholder="+91 98765 43210"
              icon={<Phone size={16} className="text-pink-500" />}
            />
          </section>

          {/* Social Media Section */}
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Social Media
            </h3>
            <InputGroup
              label="Instagram Handle"
              placeholder="@alifestyleedition"
              icon={<Instagram size={16} className="text-pink-500" />}
            />
          </section>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onBack}
              className="flex-1 cursor-pointer py-3 bg-white border border-gray-100 rounded-xl text-sm font-black text-gray-500 active:scale-95 transition-all shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="flex-1 cursor-pointer py-3 btn-purple rounded-xl text-sm font-black active:scale-95 transition-all shadow-lg shadow-pink-100">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden p-5 space-y-6">
        {/* Profile Picture Section */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Profile Picture
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute cursor-pointer -bottom-2 -right-2 p-2 bg-gray-900 text-white rounded-xl border-4 border-white shadow-md">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 mb-1">
                Change Profile Photo
              </h4>
              <p className="text-[10px] font-bold text-gray-400 mb-3">
                JPG, PNG or GIF. Max size 5MB
              </p>
              <button className="px-4 py-2 cursor-pointer btn-purple rounded-xl text-[10px] font-black uppercase shadow-md">
                Upload New Photo
              </button>
            </div>
          </div>
        </section>

        {/* Basic Information Section */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Basic Information
          </h3>

          <InputGroup
            label="Display Name"
            placeholder="Ali | Men's Grooming,"
          />
          <InputGroup label="Subtitle" placeholder="Skincare & Lifestyle" />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
              Bio
            </label>
            <textarea
              placeholder="Tell us about yourself..."
              className="w-full p-4 bg-pink-100 border border-transparent focus:border-pink-200 focus:bg-white rounded-3xl text-sm font-bold text-gray-700 min-h-[120px] outline-none transition-all"
            />
            <p className="text-[9px] font-bold text-gray-400 ml-1">
              Separate each line for better formatting
            </p>
          </div>
        </section>

        {/* Contact Information Section */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Contact Information
          </h3>

          <InputGroup
            label="Location"
            placeholder="Dehradun"
            icon={<MapPin size={16} className="text-pink-500" />}
          />
          <InputGroup
            label="Email Address"
            placeholder="ali@lifestyle.com"
            icon={<Mail size={16} className="text-pink-500" />}
          />
          <InputGroup
            label="Phone Number"
            placeholder="+91 98765 43210"
            icon={<Phone size={16} className="text-pink-500" />}
          />
        </section>

        {/* Social Media Section */}
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Social Media
          </h3>
          <InputGroup
            label="Instagram Handle"
            placeholder="@alifestyleedition"
            icon={<Instagram size={16} className="text-pink-500" />}
          />
        </section>

        {/* Footer Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 cursor-pointer py-4 bg-white border border-gray-100 rounded-[2rem] text-sm font-black text-gray-500 active:scale-95 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button className="flex-1 cursor-pointer py-4 btn-purple rounded-[2rem] text-sm font-black active:scale-95 transition-all shadow-lg shadow-pink-100">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Input Component
const InputGroup = ({ label, placeholder, icon }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
      {label}
    </label>
    <div className="relative flex items-center">
      {icon && <div className="absolute left-4">{icon}</div>}
      <input
        type="text"
        placeholder={placeholder}
        className={`w-full p-4 ${icon ? "pl-12" : "pl-5"} bg-pink-100 border border-transparent focus:border-pink-200 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 outline-none transition-all`}
      />
    </div>
  </div>
);

export default EditProfilePage;
