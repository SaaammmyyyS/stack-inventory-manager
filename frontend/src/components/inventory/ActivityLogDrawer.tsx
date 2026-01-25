import { X, Clock, User, Loader2 } from 'lucide-react';
import type { StockTransaction } from '../../hooks/useInventory';

interface Props {
  isOpen: boolean;
  itemName: string;
  isLoading: boolean;
  data: StockTransaction[];
  onClose: () => void;
}

export default function ActivityLogDrawer({ isOpen, itemName, isLoading, data, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Activity Log</h2>
            <p className="text-slate-500 font-medium">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="space-y-6 overflow-y-auto h-[calc(100vh-180px)] pr-2">
            {data.length === 0 ? (
              <p className="text-slate-400 text-center py-10">No history recorded.</p>
            ) : (
              data.map((tx) => (
                <div key={tx.id} className="flex gap-4 border-l-2 border-slate-100 pl-6 relative">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${tx.type === 'STOCK_IN' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-black text-sm ${tx.type === 'STOCK_IN' ? 'text-green-600' : 'text-orange-600'}`}>
                        {tx.type === 'STOCK_IN' ? '+' : '-'}{Math.abs(tx.quantityChange)} Units
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={10} /> {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 font-bold text-sm">{tx.reason}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                      <User size={10} /> {tx.performedBy || 'System'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}