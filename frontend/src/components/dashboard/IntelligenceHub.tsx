  import { useState, useEffect, useCallback } from "react";
  import {
    History, Clock, ArrowUpRight, ArrowDownLeft,
    Sparkles, Loader2, Play, AlertTriangle, ShieldCheck,
    TrendingUp, CheckCircle2, AlertCircle
  } from "lucide-react";

  interface GlobalAnalysis {
    status: string;
    summary: string;
    urgentActions: string[];
    healthScore: number;
  }

  export function IntelligenceHub({ tenantId, getAuthToken, isPro }: { tenantId: string, getAuthToken: any, isPro: boolean }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<GlobalAnalysis | null>(null);
    const [isActivityLoading, setIsActivityLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
      const loadActivities = async () => {
        setIsActivityLoading(true);
        try {
          const token = await getAuthToken();
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/recent`, {
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId }
          });
          const data = await res.json();
          setActivities(data || []);
        } catch (e) { console.error(e); } finally { setIsActivityLoading(false); }
      };
      loadActivities();
    }, [tenantId, getAuthToken]);

    const runAnalysis = useCallback(async () => {
      if (!isPro || isAiLoading) return;
      setIsAiLoading(true);
      try {
        const token = await getAuthToken();
        const aiRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/forecast/summary`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId }
        });
        if (aiRes.ok) setAnalysis(await aiRes.json());
      } catch (e) { console.error(e); } finally { setIsAiLoading(false); }
    }, [tenantId, getAuthToken, isPro, isAiLoading]);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white"><History size={20} /></div>
            <h3 className="text-xl font-bold text-slate-900">Live Transaction Feed</h3>
          </div>
          <div className="space-y-1">
            {isActivityLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-200" size={32} /></div>
            ) : activities.map((log, idx) => (
              <ActivityItem key={log.id} log={log} isLast={idx === activities.length - 1} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg"><Sparkles size={18} /></div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">AI Intelligence</span>
              </div>
              {analysis && !isAiLoading && (
                <button onClick={runAnalysis} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Play size={14} /></button>
              )}
            </div>

            {isAiLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400/50" size={16} />
                </div>
                <p className="text-sm font-medium text-slate-400 animate-pulse">Consulting Mistral AI...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * analysis.healthScore) / 100}
                        className="text-blue-500 transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-sm font-black">{analysis.healthScore}</span>
                  </div>
                  <div>
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1 inline-block ${
                          analysis.status.toLowerCase() === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                          {analysis.status}
                      </div>
                      <p className="text-xs text-slate-400">Overall Fleet Health</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 mb-3 flex items-center gap-2">
                    <TrendingUp size={12} /> Executive Summary
                  </h5>
                  <p className="text-sm leading-relaxed text-slate-200 font-medium italic">
                    "{analysis.summary}"
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-tighter text-slate-500 flex items-center gap-2">
                    <AlertCircle size={12} /> Priority Recommendations
                  </h5>
                  {analysis.urgentActions.map((action, i) => (
                    <div key={i} className="group flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300 font-medium leading-tight">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="text-slate-600" size={24} />
                </div>
                <h4 className="font-bold text-lg mb-2">Deep Insights Ready</h4>
                <p className="text-sm text-slate-500 mb-8">Run a global scan to detect anomalies and get strategic stock advice.</p>
                <button onClick={runAnalysis} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20">
                  Run AI Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function ActivityItem({ log, isLast }: { log: any, isLast: boolean }) {
    const isStockIn = log.type === 'STOCK_IN';
    const isDeleted = log.type === 'DELETED';
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(log.createdAt));

    return (
      <div className="flex gap-6 p-2 group">
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isDeleted ? 'bg-red-50 text-red-600' : isStockIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            {isStockIn ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
          </div>
          {!isLast && <div className="w-px h-full bg-slate-50 my-2" />}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center justify-between mb-1">
            <h5 className="font-bold text-slate-900 truncate">{log.itemName || "Item Removed"}</h5>
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 shrink-0"><Clock size={12} /> {formattedDate}</span>
          </div>
          <p className="text-slate-500 text-xs font-medium">{log.reason} • <span className="text-slate-900 font-bold">{Math.abs(log.quantityChange)} units</span></p>
        </div>
      </div>
    );
  }