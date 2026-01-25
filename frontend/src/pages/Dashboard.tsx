import { useEffect, useState } from "react";
import { useInventoryApi } from "../lib/api";
import { useOrganization } from "@clerk/clerk-react";
import { Package, ListChecks, AlertCircle, Loader2, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchWithTenant } = useInventoryApi();
  const { organization } = useOrganization();

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithTenant("/api/inventory");
        if (response.ok) {
          const data = await response.json();
          setItems(Array.isArray(data) ? data : []);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [organization?.id]);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold uppercase text-xs tracking-widest">Initialising Dashboard...</p>
      </div>
    );
  }

  const safeItems = Array.isArray(items) ? items : [];

  const lowStockCount = safeItems.filter((i: any) => i.quantity <= 5).length;
  const totalUnits = safeItems.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          Welcome back, {organization?.name || "Personal Workspace"}
        </h2>
        <p className="text-slate-500 font-medium mt-1">
          Here is a summary of your inventory status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Package size={28} />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">Total SKUs</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{safeItems.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ListChecks size={28} />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">Units in Stock</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{totalUnits}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
            lowStockCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertCircle size={28} />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">Low Stock Alerts</p>
          <h3 className="text-4xl font-black text-slate-900 mt-1">{lowStockCount}</h3>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <TrendingUp size={40} className="text-slate-200" />
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-2">Analytics Module</h4>
        <p className="text-slate-500 max-w-sm mx-auto font-medium">
          Once you have more transaction data, AI-powered sales forecasting and stock trends will appear here.
        </p>
      </div>
    </div>
  );
}