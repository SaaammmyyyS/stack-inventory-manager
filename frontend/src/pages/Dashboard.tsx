import { useEffect, useMemo, useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useOrganization, useAuth } from "@clerk/clerk-react";
import { Package, Activity, AlertCircle, Loader2, DollarSign, FileDown, Lock } from "lucide-react";
import { IntelligenceHub } from "@/components/dashboard/IntelligenceHub";

export default function Dashboard() {
  const { items, trashedItems, isLoading, fetchItems, fetchTrash, getAuthToken } = useInventory();
  const { organization, isLoaded } = useOrganization();
  const { has } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const tenantId = organization?.id || "personal";
  const isPro = has?.({ plan: 'test' }) || false;

  useEffect(() => {
    if (isLoaded) {
      fetchItems({ page: 1, limit: 1000 });
      fetchTrash();
    }
  }, [fetchItems, fetchTrash, isLoaded]);

  const stats = useMemo(() => {
    const valuation = items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.price || 0)), 0);
    const totalRecords = items.length + trashedItems.length;
    const health = totalRecords > 0 ? Math.round((items.length / totalRecords) * 100) : 100;
    const lowStock = items.filter(i => i.quantity <= (i.minThreshold || 5)).length;
    return {
      valuation,
      health,
      lowStock,
      totalUnits: items.reduce((acc, i) => acc + (i.quantity || 0), 0)
    };
  }, [items, trashedItems]);

  const handleDownloadReport = async () => {
    if (!isPro) return;
    setIsDownloading(true);
    try {
      const token = await getAuthToken();
      const orgName = encodeURIComponent(organization?.name || "Personal Workspace");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/weekly?orgName=${orgName}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="font-bold uppercase text-xs tracking-[0.3em] text-slate-400 mt-6">Syncing Database</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Live</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">{organization?.name || "Personal Workspace"}</h2>
          <p className="text-slate-500 font-medium text-lg mt-2">Real-time inventory intelligence.</p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={isDownloading || !isPro}
          className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm ${
            isPro ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isDownloading ? <Loader2 className="animate-spin" size={18} /> : isPro ? <><FileDown size={18} /> Report</> : <><Lock size={18} /> Pro Feature</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Inventory Value" value={`$${stats.valuation.toLocaleString()}`} icon={<DollarSign size={24} />} color="blue" trend="+2.4%" />
        <StatCard title="System Health" value={`${stats.health}%`} icon={<Activity size={24} />} color="emerald" />
        <StatCard title="Total Units" value={stats.totalUnits.toLocaleString()} icon={<Package size={24} />} color="slate" />
        <StatCard title="Low Stock" value={stats.lowStock} icon={<AlertCircle size={24} />} color={stats.lowStock > 0 ? "orange" : "slate"} alert={stats.lowStock > 0} />
      </div>

      <IntelligenceHub
        tenantId={tenantId}
        getAuthToken={getAuthToken}
        isPro={isPro}
      />
    </div>
  );
}

function StatCard({ title, value, icon, color, alert, trend }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-50 text-slate-500"
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${colors[color]}`}>{icon}</div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">{title}</p>
          {trend && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
        </div>
        <h3 className={`text-4xl font-black mt-2 tracking-tighter ${alert ? 'text-orange-600' : 'text-slate-900'}`}>{value}</h3>
      </div>
    </div>
  );
}