import { useState, useEffect } from "react";
import { Loader2, Sparkles, LayoutGrid } from "lucide-react";
import { ForecastCard } from "./ForecastCard";
import { StockAIInsight } from "../../types/inventory";

interface ForecastViewProps {
  tenantId: string;
  getAuthToken: () => Promise<string>;
  isPro: boolean;
}

export function ForecastView({ tenantId, getAuthToken, isPro }: ForecastViewProps) {
  const [insights, setInsights] = useState<StockAIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      if (!isPro) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/forecast/all`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId }
        });
        const data = await res.json();
        setInsights(data || []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchForecasts();
  }, [tenantId, getAuthToken, isPro]);

  if (!isPro) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center shadow-sm">
        <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600">
          <Sparkles size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Pro Feature Required</h2>
        <p className="text-slate-500 font-bold max-w-md mx-auto">Upgrade to access AI-driven stock depletion forecasting and health monitoring.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={40} />
        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Generating AI Predictions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
            <LayoutGrid size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Health Matrix</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Real-time depletion tracking</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {insights.length} Items Monitored
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {insights.map((insight) => (
          <ForecastCard key={insight.sku} insight={insight} />
        ))}
      </div>
    </div>
  );
}