import { ArrowUpRight, ArrowDownLeft, History, Loader2, AlertCircle } from "lucide-react";
import { StockTransaction } from "../../../types/inventory";
import { ActivityFeedProps } from "./types";

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl border border-slate-100">
              <History size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Operations Feed</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Live Inventory Stream</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl border border-slate-100">
            <History size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Operations Feed</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Live Inventory Stream</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 6).map((log) => (
            <ActivityItem key={log.id} log={log} />
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-500 font-bold text-sm">No recent movement detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ log }: { log: StockTransaction }) {
  const isStockIn = log.type === 'STOCK_IN';
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  }).format(new Date(log.createdAt));

  return (
    <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isStockIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {isStockIn ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h5 className="font-black text-slate-900 truncate text-sm">{log.itemName || "Item"}</h5>
          <span className="text-[9px] font-black text-slate-400 flex-shrink-0">{formattedDate}</span>
        </div>
        <p className="text-slate-500 text-[11px] font-bold mt-1">{log.reason}</p>
      </div>
    </div>
  );
}
