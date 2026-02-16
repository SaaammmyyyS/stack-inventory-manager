import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface MetricsDisplayProps {
  data?: Array<{
    type: string;
    value: string;
    description: string;
  }>;
}

export function MetricsDisplay({ data }: MetricsDisplayProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const getMetricIcon = (type: string) => {
    if (type.toLowerCase().includes('stock in') || type.toLowerCase().includes('inflow')) {
      return <TrendingUp className="text-emerald-600" size={16} />;
    }
    if (type.toLowerCase().includes('stock out') || type.toLowerCase().includes('outflow')) {
      return <TrendingDown className="text-red-600" size={16} />;
    }
    if (type.toLowerCase().includes('net') || type.toLowerCase().includes('movement')) {
      const value = data.find(d => d.type === type)?.value || "0";
      return parseInt(value) >= 0
        ? <TrendingUp className="text-blue-600" size={16} />
        : <TrendingDown className="text-orange-600" size={16} />;
    }
    return <BarChart3 className="text-slate-600" size={16} />;
  };

  const getMetricColor = (type: string, value: string) => {
    if (type.toLowerCase().includes('stock in')) {
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }
    if (type.toLowerCase().includes('stock out')) {
      return "text-red-700 bg-red-50 border-red-200";
    }
    if (type.toLowerCase().includes('net')) {
      const numValue = parseInt(value) || 0;
      return numValue >= 0
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : "text-orange-700 bg-orange-50 border-orange-200";
    }
    return "text-slate-700 bg-slate-50 border-slate-200";
  };

  return (
    <div className="space-y-4">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">
        Transaction Metrics
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((metric, index) => {
          const colorClass = getMetricColor(metric.type, metric.value);
          return (
            <div
              key={index}
              className={`p-3 rounded-xl border ${colorClass} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getMetricIcon(metric.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h6 className="text-xs font-black truncate text-slate-800">{metric.type}</h6>
                    <span className="text-base font-black text-slate-900">{metric.value}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {metric.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
