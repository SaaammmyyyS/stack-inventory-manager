import { X, Clock, User, Loader2, ArrowUpRight, ArrowDownLeft, RotateCcw, Trash2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Activity Log</h2>
            <p className="text-slate-500 font-medium">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-slate-400 font-medium">Fetching history...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {data.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 font-medium">No history recorded.</p>
              </div>
            ) : (
              data.map((tx) => (
                <div key={tx.id} className="flex gap-4 border-l-2 border-slate-100 pl-6 relative">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                    tx.type === 'STOCK_IN' ? 'bg-green-500' :
                    tx.type === 'STOCK_OUT' ? 'bg-orange-500' :
                    tx.type === 'DELETED' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-black text-sm flex items-center gap-1 ${
                        tx.type === 'STOCK_IN' ? 'text-green-600' :
                        tx.type === 'STOCK_OUT' ? 'text-orange-600' : 'text-slate-600'
                      }`}>
                        {tx.type === 'STOCK_IN' && <ArrowUpRight size={14} />}
                        {tx.type === 'STOCK_OUT' && <ArrowDownLeft size={14} />}
                        {tx.type === 'DELETED' && <Trash2 size={14} />}
                        {tx.type === 'RESTORED' && <RotateCcw size={14} />}

                        {tx.type.replace('_', ' ')}
                        {tx.quantityChange !== 0 && ` (${tx.quantityChange > 0 ? '+' : ''}${tx.quantityChange})`}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock size={10} /> {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-600 font-bold text-sm leading-snug">{tx.reason}</p>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 uppercase font-bold tracking-wider">
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