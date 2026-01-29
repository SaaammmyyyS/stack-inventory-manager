import { useEffect, useMemo, useState } from "react";
import { useInventory, StockTransaction } from "@/hooks/useInventory";
import { useOrganization, useAuth } from "@clerk/clerk-react";
import {
  Package, Activity, AlertCircle, Loader2,
  DollarSign, ArrowUpRight, ArrowDownLeft,
  History, Clock, User, FileDown, Lock
} from "lucide-react";

export default function Dashboard() {
  const { items, trashedItems, isLoading, fetchItems, fetchTrash, getAuthToken } = useInventory();
  const { organization, isLoaded } = useOrganization();
  const { has } = useAuth();
  const [recentActivity, setRecentActivity] = useState<StockTransaction[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const tenantId = organization?.id || "personal";

  const isPro = has?.({ plan: 'test' }) || false;

  useEffect(() => {
    if (isLoaded) {
      fetchItems({ page: 1, limit: 1000 });
      fetchTrash();

      const loadActivity = async () => {
        try {
          const token = await getAuthToken();
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/recent`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Tenant-ID': tenantId
            }
          });

          if (!res.ok) throw new Error("Failed to fetch activity");

          const data = await res.json();
          setRecentActivity(data || []);
        } catch (e) {
          console.error("Activity Error:", e);
        } finally {
          setIsActivityLoading(false);
        }
      };
      loadActivity();
    }
  }, [fetchItems, fetchTrash, isLoaded, tenantId, getAuthToken]);

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

    try {
      setIsDownloading(true);
      const token = await getAuthToken();
      const orgName = encodeURIComponent(organization?.name || "Personal Workspace");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/weekly?orgName=${orgName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      if (!response.ok) throw new Error("Report generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600 relative z-10" size={48} />
          <div className="absolute inset-0 blur-2xl bg-blue-400/20 animate-pulse"></div>
        </div>
        <p className="font-bold uppercase text-xs tracking-[0.3em] text-slate-400 mt-6">Syncing Database</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Live</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">
            {organization?.name || "Personal Workspace"}
          </h2>
          <p className="text-slate-500 font-medium text-lg mt-2">Real-time inventory intelligence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Inventory Value"
          value={`$${stats.valuation.toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="blue"
          trend="+2.4%"
        />
        <StatCard
          title="System Health"
          value={`${stats.health}%`}
          subtitle="Active / Total Ratio"
          icon={<Activity size={24} />}
          color="emerald"
        />
        <StatCard
          title="Total Units"
          value={stats.totalUnits.toLocaleString()}
          icon={<Package size={24} />}
          color="slate"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={<AlertCircle size={24} />}
          color={stats.lowStock > 0 ? "orange" : "slate"}
          alert={stats.lowStock > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 rounded-2xl text-white">
                <History size={20} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Recent Activity</h3>
            </div>
          </div>

          <div className="space-y-1">
            {isActivityLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" size={32} /></div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((log, idx) => (
                <ActivityItem key={log.id} log={log} isLast={idx === recentActivity.length - 1} />
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 font-medium">No recent transactions recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-6">Quick Actions</p>
              <h4 className="text-2xl font-bold mb-6 leading-tight">Generate weekly <br/> stock report?</h4>

              <button
                onClick={handleDownloadReport}
                disabled={isDownloading || !isPro}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group disabled:opacity-50 ${
                  isPro ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 cursor-not-allowed'
                }`}
              >
                {isDownloading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : !isPro ? (
                  <>
                    <Lock size={18} className="text-blue-400" />
                    Pro Feature
                  </>
                ) : (
                  <>
                    Download PDF
                    <FileDown size={18} className="group-hover:translate-y-1 transition-transform" />
                  </>
                )}
              </button>

              {!isPro && (
                <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest font-bold">
                  Upgrade to unlock reports
                </p>
              )}
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Package size={200} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ log, isLast }: { log: any, isLast: boolean }) {
  const isStockIn = log.type === 'STOCK_IN';
  const isDeleted = log.type === 'DELETED';

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(log.createdAt));

  return (
    <div className="flex gap-6 group">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
          isDeleted ? 'bg-red-50 text-red-600' :
          isStockIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {isStockIn ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
        </div>
        {!isLast && <div className="w-px h-full bg-slate-100 my-2" />}
      </div>
      <div className="pb-8 flex-1">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {log.itemName || "Item Removed"}
          </h5>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
            <Clock size={12} />
            {formattedDate}
          </span>
        </div>
        <p className="text-slate-500 text-sm font-medium mb-3">
          {log.reason} • <span className="text-slate-900 font-bold">{Math.abs(log.quantityChange)} units</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
            <User size={10} className="text-slate-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.performedBy}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, alert, trend }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 shadow-blue-100/50",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50",
    orange: "bg-orange-50 text-orange-600 shadow-orange-100/50",
    slate: "bg-slate-50 text-slate-500 shadow-slate-100/50"
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform ${colors[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.15em]">{title}</p>
          {trend && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{trend}</span>}
        </div>
        <h3 className={`text-4xl font-black mt-2 tracking-tighter ${alert ? 'text-orange-600' : 'text-slate-900'}`}>{value}</h3>
        {subtitle && <p className="text-slate-400 text-[10px] font-bold mt-3 uppercase tracking-widest">{subtitle}</p>}
      </div>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform ${colors[color]}`} />
    </div>
  );
}