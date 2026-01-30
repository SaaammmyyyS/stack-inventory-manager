import { useState, useEffect, useCallback } from "react";
import {
  History, ArrowUpRight, ArrowDownLeft,
  Sparkles, Loader2, Play, TrendingUp, CheckCircle2, Zap,
  AlertCircle
} from "lucide-react";
import { InventorySummary, StockTransaction } from "../../types/inventory";
import { StockVelocityChart } from "./StockVelocityChart";

interface IntelligenceHubProps {
  tenantId: string;
  getAuthToken: () => Promise<string>;
  isPro: boolean;
}

export function IntelligenceHub({ tenantId, getAuthToken, isPro }: IntelligenceHubProps) {
  const [activities, setActivities] = useState<StockTransaction[]>([]);
  const [analysis, setAnalysis] = useState<InventorySummary | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadActivities = useCallback(async () => {
    setIsActivityLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });

      if (res.ok) {
        const data = await res.json();
        setActivities(data || []);
      } else {
        console.error('Failed to fetch activities:', res.status);
        setActivities([]);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setActivities([]);
    } finally {
      setIsActivityLoading(false);
    }
  }, [tenantId, getAuthToken]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const runAnalysis = useCallback(async () => {
    if (!isPro || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const token = await getAuthToken();
      const aiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/forecast/summary`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId }
      });
      if (aiRes.ok) setAnalysis(await aiRes.json());
    } catch (e) {
      console.error('AI Error:', e);
    } finally {
      setIsAiLoading(false);
    }
  }, [tenantId, getAuthToken, isPro, isAiLoading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Data Visualization & Feed */}
      <div className="lg:col-span-8 space-y-8">
        {/* Chart Section */}
        <div className="w-full h-[500px]">
          <StockVelocityChart transactions={activities} />
        </div>

        {/* Operations Feed */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl border border-slate-100">
                <History size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Operations Feed</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Live Inventory Stream</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            {isActivityLoading ? (
              <div className="col-span-2 flex justify-center py-20">
                <Loader2 className="animate-spin text-slate-200" size={40} />
              </div>
            ) : activities.length > 0 ? (
              activities.slice(0, 10).map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))
            ) : (
              <div className="col-span-2 text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <AlertCircle className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-bold text-sm">No recent movement detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Sidebar */}
      <div className="lg:col-span-4 sticky top-12">
        <div className="bg-[#0F172A] rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col min-h-[720px]">
          {/* Decorative Gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] -ml-32 -mb-32" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400/80">Intelligence Hub</span>
            </div>
            <button
              onClick={runAnalysis}
              disabled={isAiLoading || !isPro}
              className="group p-2.5 bg-blue-600 hover:bg-blue-500 rounded-full transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              <Play size={14} fill="currentColor" className={isAiLoading ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            </button>
          </div>

          {isAiLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
              <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <Sparkles className="absolute top-0 right-0 text-white animate-bounce" size={16} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80 mb-2">Analyzing Patterns</p>
                <p className="text-[10px] text-white/40 font-bold">Scanning transactional velocity...</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <circle
                      cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent"
                      strokeDasharray={276.46}
                      strokeDashoffset={276.46 - (276.46 * (analysis.healthScore || 0)) / 100}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black">{analysis.healthScore}</span>
                </div>
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-500/20">
                  {analysis.status}
                </div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Health Index</p>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2 px-2">
                  <TrendingUp size={12} /> Narrative Summary
                </h5>
                <p className="text-sm leading-relaxed font-bold italic text-white/80 bg-white/5 p-6 rounded-3xl border border-white/5">
                  "{analysis.summary}"
                </p>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2 px-2">
                  <Zap size={12} /> Critical Actions
                </h5>
                <div className="space-y-3">
                  {analysis.urgentActions.map((action, i) => (
                    <div key={i} className="group flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default">
                      <div className="mt-1 bg-blue-500/20 p-1 rounded-md">
                        <CheckCircle2 size={12} className="text-blue-400" />
                      </div>
                      <span className="text-xs text-white/70 font-bold leading-snug group-hover:text-white transition-colors">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20">
                <Sparkles className="text-blue-500" size={32} />
              </div>
              <h4 className="text-lg font-black mb-3 tracking-tight">AI Readiness Engine</h4>
              <p className="text-white/40 text-xs font-bold mb-10 max-w-[240px] leading-relaxed">
                Connect your data patterns to unlock predictive health scores and stock velocity forecasting.
              </p>
              <button
                onClick={runAnalysis}
                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all shadow-xl shadow-white/5"
              >
                Launch Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ log }: { log: any }) {
  const isStockIn = log.type === 'STOCK_IN';
  const isDeleted = log.type === 'DELETED';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
  }).format(new Date(log.createdAt));

  return (
    <div className="flex gap-4 p-4 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-6 ${
        isDeleted ? 'bg-red-50 text-red-600 border border-red-100' :
        isStockIn ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
        'bg-blue-50 text-blue-600 border border-blue-100'
      }`}>
        {isStockIn ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-black text-slate-900 truncate text-sm tracking-tight">{log.itemName || "Inventory Item"}</h5>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-slate-500 text-[11px] font-bold truncate">
            {log.reason}
          </p>
          <span className="text-slate-300">•</span>
          <span className={`text-[11px] font-black ${isStockIn ? 'text-emerald-600' : 'text-slate-900'}`}>
            {isStockIn ? '+' : '-'}{Math.abs(log.quantityChange)} units
          </span>
        </div>
      </div>
    </div>
  );
}