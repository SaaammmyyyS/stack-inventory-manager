import { useState, useEffect } from "react";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import { useInventory } from "@/hooks/useInventory";

interface ForecastData {
  itemName: string;
  currentQuantity: number;
  lowThreshold: number | null;
  recentTransactions: Array<{
    action: string;
    quantity: number;
  }>;
}

interface ForecastAnalysis {
  itemName: string;
  status: string;
  recentActivity: string;
  lowThreshold: number | null;
}

interface ForecastSummaryResponse {
  status: string;
  summary: string;
  urgentActions: string[];
  healthScore: number;
  data: ForecastData[];
  analysis: ForecastAnalysis[];
}

interface ForecastSummaryViewProps {
  tenantId: string;
  isPro: boolean;
  plan?: string;
}

export function ForecastSummaryView({ isPro }: ForecastSummaryViewProps) {
  const [summaryData, setSummaryData] = useState<ForecastSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { api } = useInventory();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!isPro) return;
      setIsLoading(true);
      try {
        const { data } = await api.get('/api/v1/forecast/summary');
        setSummaryData(data);
      } catch (e: any) {
        console.error("Forecast Summary Error:", e);
        if (e.response?.status !== 402) {
          toast.error("Could not load forecast summary");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [api, isPro]);

  if (!isPro) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center shadow-sm">
        <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600">
          <TrendingUp size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Pro Feature Required</h2>
        <p className="text-slate-500 font-bold max-w-md mx-auto">Upgrade to access AI-driven stock analysis and forecasting.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-6" size={40} />
        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Generating AI Analysis...</p>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-slate-500">No forecast data available.</p>
      </div>
    );
  }

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="text-green-500" size={20} />;
    if (score >= 60) return <Activity className="text-blue-500" size={20} />;
    if (score >= 40) return <AlertTriangle className="text-yellow-500" size={20} />;
    return <AlertTriangle className="text-red-500" size={20} />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("low") || lowerStatus.includes("critical")) return "text-red-600 bg-red-50";
    if (lowerStatus.includes("warning")) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">AI Stock Analysis</h2>
            <p className="text-sm text-slate-500 mt-1">{summaryData.summary}</p>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getHealthColor(summaryData.healthScore)}`}>
            {getHealthIcon(summaryData.healthScore)}
            <div>
              <div className="text-sm font-bold">Health Score</div>
              <div className="text-xl font-black">{summaryData.healthScore}/100</div>
            </div>
          </div>
        </div>

        {summaryData.urgentActions && summaryData.urgentActions.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Urgent Actions Required
            </h3>
            <ul className="space-y-2">
              {summaryData.urgentActions.map((action, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <Activity size={20} className="text-blue-600" />
          Detailed Item Analysis
        </h3>

        <div className="space-y-6">
          {summaryData.analysis?.map((item, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{item.itemName}</h4>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                {item.lowThreshold !== null && (
                  <div className="text-sm text-slate-500">
                    Threshold: {item.lowThreshold}
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {item.recentActivity}
              </p>

              {summaryData.data && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Transactions</h5>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.data
                      .find(d => d.itemName === item.itemName)
                      ?.recentTransactions?.map((tx, txIndex) => (
                        <span
                          key={txIndex}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            tx.action === 'STOCK_IN'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.action === 'STOCK_IN' ? '+' : '-'}{tx.quantity}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
