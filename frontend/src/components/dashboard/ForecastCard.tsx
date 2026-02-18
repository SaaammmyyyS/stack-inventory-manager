import { Zap, AlertTriangle, CheckCircle } from "lucide-react";

export function ForecastCard({ insight }: { insight: any }) {
  const isWarning = insight.healthStatus === 'CRITICAL' || insight.healthStatus === 'CAUTION';
  const isGood = insight.healthStatus === 'GOOD' || insight.healthStatus === 'STABLE';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-600';
      case 'CAUTION':
      case 'WARNING':
        return 'bg-amber-50 text-amber-600';
      case 'GOOD':
      case 'STABLE':
        return 'bg-emerald-50 text-emerald-600';
      case 'OVERSTOCKED':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-slate-900 tracking-tight">{insight.itemName}</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{insight.sku}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(insight.healthStatus)}`}>
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
        isWarning ? 'bg-amber-50 border-amber-100' : isGood ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {isWarning ? (
            <AlertTriangle size={14} className="text-amber-600" />
          ) : isGood ? (
            <CheckCircle size={14} className="text-emerald-600" />
          ) : (
            <Zap size={14} className="text-blue-600" />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${
            isWarning ? 'text-amber-700' : isGood ? 'text-emerald-700' : 'text-blue-700'
          }`}>
            {isWarning ? 'Stock Alert' : isGood ? 'Good Stock' : 'Stock Insight'}
          </span>
        </div>
        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
          {insight.thresholdReason || 'No threshold information available'}
        </p>

        {insight.suggestedThreshold != null && (
          <div className="mt-3 pt-3 border-t border-slate-200/50">
            <p className="text-[10px] font-black text-slate-600">
              Suggested Threshold: <span className="text-sm">{insight.suggestedThreshold} units</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}