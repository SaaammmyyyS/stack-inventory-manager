import { Zap, AlertTriangle, CheckCircle } from "lucide-react";

export function ForecastCard({ insight }: { insight: any }) {
  const isWarning = insight.thresholdReason.includes("too low");

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-slate-900 tracking-tight">{insight.itemName}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{insight.sku}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          insight.healthStatus === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {insight.healthStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-3 rounded-2xl">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Stock</p>
          <p className="text-lg font-black text-slate-900">{insight.currentQuantity}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Days Left</p>
          <p className="text-lg font-black text-slate-900">{insight.daysRemaining}</p>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border ${
        isWarning ? 'bg-amber-50 border-amber-100' : 'bg-blue-50/50 border-blue-100'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {isWarning ? (
            <AlertTriangle size={14} className="text-amber-600" />
          ) : (
            <Zap size={14} className="text-blue-600" />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            isWarning ? 'text-amber-700' : 'text-blue-700'
          }`}>
            Threshold Insight
          </span>
        </div>
        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
          {insight.thresholdReason}
        </p>

        {isWarning && insight.suggestedThreshold != null && (
          <div className="mt-3 pt-3 border-t border-amber-200/50">
            <p className="text-[10px] font-black text-amber-800">
              Suggested: <span className="text-sm">{insight.suggestedThreshold} units</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}