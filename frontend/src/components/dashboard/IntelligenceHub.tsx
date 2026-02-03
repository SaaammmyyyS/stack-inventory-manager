import { useState, useEffect, useCallback, useRef } from "react";
import {
  History, ArrowUpRight, ArrowDownLeft,
  Sparkles, Loader2, Play, TrendingUp, CheckCircle2, Zap,
  AlertCircle
} from "lucide-react";
import { InventorySummary, StockTransaction } from "../../types/inventory";
import { StockVelocityChart } from "./StockVelocityChart";
import { useInventory } from "@/hooks/useInventory";
import { toast } from "sonner";

interface IntelligenceHubProps {
  tenantId: string;
  isPro: boolean;
  plan?: string;
}

export function IntelligenceHub({ isPro, tenantId }: IntelligenceHubProps) {
  const { api } = useInventory();
  const [activities, setActivities] = useState<StockTransaction[]>([]);
  const [analysis, setAnalysis] = useState<InventorySummary | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const hasFetchedActivities = useRef(false);
  const hasAttemptedAiLoad = useRef(false);

  const SESSION_KEY = `ai_unlocked_${tenantId}`;

  const loadActivities = useCallback(async () => {
    setIsActivityLoading(true);
    try {
      const { data } = await api.get(`/api/transactions/recent`);
      setActivities(data || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsActivityLoading(false);
    }
  }, [api]);

  const runAnalysis = useCallback(async (isAutoLoad = false) => {
    if (!isPro || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const { data } = await api.get('/api/v1/forecast/summary');
      setAnalysis(data);

      sessionStorage.setItem(SESSION_KEY, "true");

      if (!isAutoLoad) {
        toast.success("Intelligence report generated");
      }
    } catch (e: any) {
      console.error('AI Error:', e);
      if (e.response?.status !== 402 && !isAutoLoad) {
        toast.error("Failed to connect to Intelligence Service");
      }
    } finally {
      setIsAiLoading(false);
    }
  }, [api, isPro, isAiLoading, SESSION_KEY]);

  useEffect(() => {
    if (!hasFetchedActivities.current) {
      loadActivities();
      hasFetchedActivities.current = true;
    }
  }, [loadActivities]);

  useEffect(() => {
    const wasUnlocked = sessionStorage.getItem(SESSION_KEY);

    if (isPro && wasUnlocked === "true" && !hasAttemptedAiLoad.current) {
      runAnalysis(true);
      hasAttemptedAiLoad.current = true;
    }
  }, [isPro, runAnalysis, SESSION_KEY]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 space-y-8">
        <div className="w-full h-[500px]">
          <StockVelocityChart transactions={activities} />
        </div>

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

      <div className="lg:col-span-4 sticky top-12">
        <div className="bg-[#0F172A] rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col min-h-[720px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400/80">Intelligence Hub</span>
            </div>
            {analysis && (
              <button
                onClick={() => runAnalysis(false)}
                disabled={isAiLoading || !isPro}
                className="group p-2.5 bg-blue-600 hover:bg-blue-500 rounded-full transition-all disabled:opacity-50"
              >
                <Play size={14} fill="currentColor" className={isAiLoading ? 'animate-pulse' : ''} />
              </button>
            )}
          </div>

          {isAiLoading && !analysis ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
              <Loader2 className="animate-spin text-blue-500" size={48} />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Analyzing Patterns...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-8 animate-in fade-in duration-700 relative z-10">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                    <circle
                      cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent"
                      strokeDasharray={276.46}
                      strokeDashoffset={276.46 - (276.46 * (analysis.healthScore || 0)) / 100}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black">{analysis.healthScore}</span>
                </div>
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase mb-2">
                  {analysis.status}
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Narrative Summary</h5>
                <p className="text-sm leading-relaxed font-bold italic text-white/80 bg-white/5 p-6 rounded-3xl">
                  "{analysis.summary}"
                </p>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Critical Actions</h5>
                <div className="space-y-3">
                  {(analysis.urgentActions ?? []).map((action, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <CheckCircle2 size={12} className="text-blue-400 mt-1" />
                      <span className="text-xs text-white/70 font-bold">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
               <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20">
                 <Sparkles className="text-blue-500" size={32} />
               </div>
               <h4 className="text-lg font-black mb-3 tracking-tight">AI Readiness Engine</h4>
               <p className="text-white/40 text-xs font-bold mb-10 leading-relaxed">
                 Connect your data patterns to unlock predictive health scores and stock velocity forecasting.
               </p>
               <button
                onClick={() => runAnalysis(false)}
                disabled={!isPro}
                className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors disabled:opacity-50"
               >
                  {isPro ? "Launch Analysis" : "Pro Only Feature"}
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
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  }).format(new Date(log.createdAt));

  return (
    <div className="flex gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isStockIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
        {isStockIn ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h5 className="font-black text-slate-900 truncate text-sm">{log.itemName || "Item"}</h5>
          <span className="text-[9px] font-black text-slate-400">{formattedDate}</span>
        </div>
        <p className="text-slate-500 text-[11px] font-bold">{log.reason}</p>
      </div>
    </div>
  );
}