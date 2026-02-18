import { TrendingUp, TrendingDown, Minus, BarChart3, Bug } from "lucide-react";
import { useState } from "react";

interface MetricsDisplayProps {
  data?: Array<{
    type: string;
    value: string;
    description: string;
  }>;
  tenantId?: string;
}

export function MetricsDisplay({ data, tenantId }: MetricsDisplayProps) {
  const [showDebug, setShowDebug] = useState(false);

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

  const loadDebugData = async () => {
    if (!tenantId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/transactions/debug/all`, {
        headers: {
          'Authorization': `Bearer ${await localStorage.getItem('clerk-db-jwt')}`,
          'X-Tenant-ID': tenantId
        }
      });
      const transactions = await response.json();
      console.group('🔍 Debug Transaction Data');
      console.log('Total transactions:', transactions.length);
      console.log('Transaction types:', transactions.reduce((acc: any, t: any) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {}));
      console.log('Stock IN total:', transactions
        .filter((t: any) => t.type === 'STOCK_IN')
        .reduce((sum: number, t: any) => sum + Math.abs(t.quantityChange), 0));
      console.log('Stock OUT total:', transactions
        .filter((t: any) => t.type === 'STOCK_OUT')
        .reduce((sum: number, t: any) => sum + Math.abs(t.quantityChange), 0));
      console.log('All transactions:', transactions);
      console.groupEnd();
    } catch (error) {
      console.error('Failed to load debug data:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Transaction Metrics
        </h5>
        <button
          onClick={() => {
            setShowDebug(!showDebug);
            if (!showDebug) loadDebugData();
          }}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Debug Information"
        >
          <Bug size={14} className="text-slate-600" />
        </button>
      </div>

      {showDebug && (
        <div className="mx-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-mono text-amber-800 mb-2">
            🔍 Debug mode - Check console for transaction details
          </p>
          <p className="text-[10px] text-amber-600">
            Metrics should reflect recent stock adjustments. If totals are 0, check browser console for debug data.
          </p>
        </div>
      )}

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
