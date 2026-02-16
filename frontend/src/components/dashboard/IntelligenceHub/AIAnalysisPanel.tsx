import { Loader2, Sparkles, Play, CheckCircle2 } from "lucide-react";
import { InsightsPanel } from "./InsightsPanel";
import { MetricsDisplay } from "./MetricsDisplay";
import { AnalysisExport } from "./AnalysisExport";
import { IntelligenceHubTabs } from "./IntelligenceHubTabs";
import { AIAnalysisPanelProps } from "./types";

export function AIAnalysisPanel({
  analysis,
  isLoading,
  activeTab,
  onTabChange,
  onRunAnalysis,
  isPro,
  tenantId
}: AIAnalysisPanelProps) {
  if (isLoading && !analysis) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Hub</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">AI Analysis</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analyzing Patterns...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Hub</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">AI Analysis</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
            <Sparkles className="text-blue-600" size={28} />
          </div>
          <h4 className="text-lg font-black mb-3 tracking-tight text-slate-900">AI Readiness Engine</h4>
          <p className="text-slate-500 text-xs font-bold mb-8 leading-relaxed max-w-sm">
            Connect your data patterns to unlock predictive health scores and stock velocity forecasting.
          </p>
          <button
            onClick={onRunAnalysis}
            disabled={!isPro}
            className={`w-full max-w-xs py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors ${
              isPro
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isPro ? "Launch Analysis" : "Pro Only Feature"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Hub</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">AI Analysis</p>
            </div>
          </div>
          <button
            onClick={onRunAnalysis}
            disabled={isLoading || !isPro}
            className={`p-3 rounded-xl transition-all ${
              isPro
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            } disabled:opacity-50`}
          >
            <Play size={14} fill="currentColor" className={isLoading ? 'animate-pulse' : ''} />
          </button>
        </div>

        <IntelligenceHubTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          hasInsights={!!analysis?.analysis?.length}
          hasMetrics={!!analysis?.data?.length}
        />
      </div>

      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="space-y-6 animate-in fade-in duration-700">
          {activeTab === 'overview' && analysis && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <svg className="w-6 h-6" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-blue-100" />
                      <circle
                        cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
                        strokeDasharray={226.19}
                        strokeDashoffset={226.19 - (226.19 * (analysis.healthScore || 0)) / 100}
                        strokeLinecap="round"
                        className="text-blue-500 transition-all duration-1000"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Health Score</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                      System Performance
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900">{analysis.healthScore}</div>
                  <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mt-1">
                    {analysis.status}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Narrative Summary</h5>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-sm leading-relaxed font-bold text-slate-700 italic">
                      "{analysis.summary}"
                    </p>
                  </div>
                </div>

                {analysis.urgentActions && analysis.urgentActions.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Critical Actions</h5>
                    <div className="space-y-2">
                      {analysis.urgentActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <CheckCircle2 size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-bold text-slate-700">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
}
