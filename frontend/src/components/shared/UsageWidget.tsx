import { CreditCard, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface UsageWidgetProps {
  current: number;
  limit: number;
  plan: string;
  label?: string;
}

export function UsageWidget({ current, limit, plan, label = "Plan Usage" }: UsageWidgetProps) {
  const navigate = useNavigate();

  const isLimitReached = current >= limit;
  const isNearLimit = current >= (limit * 0.8) && !isLimitReached;
  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className={`${isLimitReached ? 'bg-rose-600' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'} p-3 rounded-2xl text-white shadow-lg transition-colors`}>
          <CreditCard size={20} />
        </div>
        <div>
          <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">
            {isLimitReached ? 'Limit Reached' : label}
          </p>
          <p className="text-lg font-black text-white tracking-tight">
            {current} / {limit} {label.includes("AI") ? "Credits" : "SKUs"} used
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-md bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out ${
            isLimitReached ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isLimitReached ? (
        <Button
          onClick={() => navigate('/billing')}
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl animate-pulse px-6 h-10"
        >
          <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Now
        </Button>
      ) : (
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{plan.toUpperCase()} Plan</p>
      )}
    </div>
  );
}