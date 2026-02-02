import { useEffect, useMemo, useState, useRef } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useOrganization, useAuth, useUser } from "@clerk/clerk-react";
import {
  Package, Activity, AlertCircle, Loader2, DollarSign,
  FileDown, Lock, LayoutDashboard, Sparkles
} from "lucide-react";
import { IntelligenceHub } from "@/components/dashboard/IntelligenceHub";
import { ForecastView } from "@/components/dashboard/ForecastView";
import { toast } from "sonner";

export default function Dashboard() {
  const { items, trashedItems, isLoading, fetchItems, fetchTrash, getAuthToken, currentPlan } = useInventory();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { has } = useAuth();

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast'>('overview');
  const hasInitialFetched = useRef(false);
  const tenantId = useMemo(() => organization?.id || user?.id || "personal", [organization?.id, user?.id]);

  const isPro = useMemo(() => {
    return currentPlan === 'pro' || currentPlan === 'test' || has?.({ plan: 'test' }) || false;
  }, [currentPlan, has]);

  useEffect(() => {
    if (isOrgLoaded && isUserLoaded && !hasInitialFetched.current) {
      fetchItems({ page: 1, limit: 1000 });
      fetchTrash();
      hasInitialFetched.current = true;
    }
  }, [fetchItems, fetchTrash, isOrgLoaded, isUserLoaded]);

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
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Organization-Plan': currentPlan || 'free'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Report generation failed";

        if (response.status === 429) {
          toast.error("Daily Limit Reached", {
            description: errorMessage
          });
        } else if (response.status === 402) {
          toast.error("Subscription Required", {
            description: errorMessage
          });
        } else {
          toast.error("Export Error", {
            description: "Unable to generate PDF at this time."
          });
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report Downloaded", {
        description: "Your weekly inventory audit is ready."
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Connection Failed", {
        description: "Could not reach the reporting service."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if ((isLoading && items.length === 0) || !isOrgLoaded) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="font-bold uppercase text-[10px] tracking-[0.3em] text-muted-foreground mt-6">Syncing Database</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-6">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Intelligence Dashboard</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter">
            {organization?.name || "Personal Workspace"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-muted/50 p-1 rounded-2xl border border-border">
            {['overview', 'forecast'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs capitalize transition-all ${
                  activeTab === tab
                  ? 'bg-background text-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'overview' ? <LayoutDashboard size={14} /> : <Sparkles size={14} />}
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={isDownloading || !isPro}
            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
              isPro ? 'bg-foreground text-background hover:opacity-90 shadow-xl' : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
            }`}
          >
            {isDownloading ? <Loader2 className="animate-spin" size={16} /> : isPro ? <><FileDown size={16} /> Export</> : <><Lock size={16} /> Unlock Pro</>}
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard title="Portfolio Value" value={`$${stats.valuation.toLocaleString()}`} icon={<DollarSign size={22} />} color="blue" trend="+2.4%" />
            <StatCard title="System Health" value={`${stats.health}%`} icon={<Activity size={22} />} color="emerald" />
            <StatCard title="Total Units" value={stats.totalUnits.toLocaleString()} icon={<Package size={22} />} color="muted" />
            <StatCard title="Critical Stock" value={stats.lowStock} icon={<AlertCircle size={22} />} color={stats.lowStock > 0 ? "orange" : "muted"} alert={stats.lowStock > 0} />
          </div>

          <IntelligenceHub tenantId={tenantId} isPro={isPro} plan={currentPlan} />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <ForecastView tenantId={tenantId} isPro={isPro} plan={currentPlan} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, alert, trend }: any) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    orange: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground"
  };
  return (
    <div className="bg-card p-8 rounded-4xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${colors[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">{title}</p>
          {trend && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{trend}</span>}
        </div>
        <h3 className={`text-4xl font-black mt-2 tracking-tighter ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</h3>
      </div>
    </div>
  );
}