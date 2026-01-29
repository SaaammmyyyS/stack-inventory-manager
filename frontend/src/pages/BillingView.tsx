import { PricingTable, OrganizationProfile, useOrganization } from "@clerk/clerk-react";
import { CheckCircle2, RefreshCw } from "lucide-react";

export default function BillingView() {
  const { organization, isLoaded } = useOrganization();

  const currentPlanKey = (organization?.publicMetadata?.plan as string) || "free_org";

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Subscription Plans</h1>
            <p className="text-slate-500 font-medium">Manage your organization's growth and features.</p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Current Status
            </span>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
              currentPlanKey === 'test'
                ? 'bg-blue-50 border-blue-100 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <CheckCircle2 size={16} />
              <span className="font-bold">
                {currentPlanKey === 'test' ? 'Test Plan (Active)' : 'Free Tier'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <PricingTable for="organization" />
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-dashed border-slate-300">
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="text-slate-400" size={20} />
          <h2 className="text-xl font-bold text-slate-800">Manage Organization & Billing</h2>
        </div>

        <OrganizationProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-none bg-transparent"
            }
          }}
        />
      </div>
    </div>
  );
}