import { Button } from "@/components/ui/button";
import { User, Briefcase } from "lucide-react";

const RoleSelection = ({ onNext }) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold">Choose your Role</h2>
      <p className="text-slate-500">Select how you want to use the platform</p>
    </div>
    <div className="grid gap-4">
      <button className="flex items-center p-4 border-2 border-purple-600 rounded-2xl bg-purple-50 text-left">
        <div className="bg-purple-600 p-3 rounded-xl mr-4 text-white">
          <User />
        </div>
        <div>
          <p className="font-bold">Influencer / Creator</p>
          <p className="text-xs text-slate-500">
            I want to collaborate with brands
          </p>
        </div>
      </button>
      <button className="flex items-center p-4 border-2 border-slate-100 rounded-2xl text-left hover:border-purple-200">
        <div className="bg-slate-100 p-3 rounded-xl mr-4 text-slate-600">
          <Briefcase />
        </div>
        <div>
          <p className="font-bold">Brand</p>
          <p className="text-xs text-slate-500">I want to hire creators</p>
        </div>
      </button>
    </div>
    <Button onClick={onNext} className="w-full bg-[#6347F9] h-14 rounded-2xl">
      Continue
    </Button>
  </div>
);
export default RoleSelection;
