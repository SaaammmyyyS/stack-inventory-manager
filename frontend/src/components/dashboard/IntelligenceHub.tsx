import { useState, useEffect, useCallback, useRef } from "react";
import {
  History, ArrowUpRight, ArrowDownLeft,
  Sparkles, Loader2, Play, TrendingUp, CheckCircle2, Zap,
  AlertCircle
} from "lucide-react";
import { InventorySummary, StockTransaction } from "../../types/inventory";

interface OverviewTabProps {
  analysis: InventorySummary;
}

function OverviewTab({ analysis }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center">
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
            <circle
              cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={226.19}
              strokeDashoffset={226.19 - (226.19 * (analysis.healthScore || 0)) / 100}
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-1000"
            />
          </svg>
          <span className="absolute text-xl font-black">{analysis.healthScore}</span>
        </div>
        <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase mb-2">
          {analysis.status}
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Narrative Summary</h5>
        <p className="text-sm leading-relaxed font-bold italic text-white/80 bg-white/5 p-4 rounded-2xl">
          "{analysis.summary}"
        </p>
      </div>

      {analysis.urgentActions && analysis.urgentActions.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2">Critical Actions</h5>
          <div className="space-y-2">
            {analysis.urgentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                <CheckCircle2 size={12} className="text-blue-400 mt-1" />
                <span className="text-xs text-white/70 font-bold">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { StockVelocityChart } from "./StockVelocityChart";
import { MetricsDisplay } from "./MetricsDisplay";
import { InsightsPanel } from "./InsightsPanel";
import { AnalysisExport } from "./AnalysisExport";
import { IntelligenceHubTabs } from "./IntelligenceHubTabs";
import { IntelligenceHubLayout } from "./IntelligenceHubLayout";
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
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="space-y-6">
      <div className="w-full h-80 overflow-hidden">
        <StockVelocityChart transactions={activities} />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {isActivityLoading ? (
            <div className="col-span-2 flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-200" size={32} />
            </div>
          ) : activities.length > 0 ? (
            activities.slice(0, 6).map((log) => (
              <ActivityItem key={log.id} log={log} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-bold text-sm">No recent movement detected.</p>
            </div>
          )}
        </div>
      </div>

      <IntelligenceHubLayout>
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
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

          <IntelligenceHubTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasInsights={!!analysis?.analysis?.length}
            hasMetrics={!!analysis?.data?.length}
          />
        </div>

        <div className="flex-1 overflow-hidden p-6">
          {isAiLoading && !analysis ? (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Analyzing Patterns...</p>
            </div>
          ) : analysis ? (
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="space-y-6 animate-in fade-in duration-700">
                {activeTab === 'overview' && (
                  <OverviewTab analysis={analysis} />
                )}
                {activeTab === 'insights' && (
                  <InsightsPanel analysis={analysis.analysis} />
                )}
                {activeTab === 'metrics' && (
                  <MetricsDisplay data={analysis.data} />
                )}
                {activeTab === 'export' && (
                  <AnalysisExport analysis={analysis} tenantId={tenantId} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full">
               <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                 <Sparkles className="text-blue-500" size={28} />
               </div>
               <h4 className="text-lg font-black mb-3 tracking-tight">AI Readiness Engine</h4>
               <p className="text-white/40 text-xs font-bold mb-8 leading-relaxed max-w-sm">
                 Connect your data patterns to unlock predictive health scores and stock velocity forecasting.
               </p>
               <button
                onClick={() => runAnalysis(false)}
                disabled={!isPro}
                className="w-full max-w-xs bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors disabled:opacity-50"
               >
                  {isPro ? "Launch Analysis" : "Pro Only Feature"}
               </button>
            </div>
          )}
        </div>
      </IntelligenceHubLayout>
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