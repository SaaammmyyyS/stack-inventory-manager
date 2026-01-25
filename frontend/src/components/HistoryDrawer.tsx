import { X, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  quantityChange: number;
  type: 'STOCK_IN' | 'STOCK_OUT';
  reason: string;
  createdAt: string;
}

export default function HistoryDrawer({
  itemName,
  history,
  onClose
}: {
  itemName: string,
  history: Transaction[],
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">

      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Activity Log</h2>
            <p className="text-slate-500 font-medium">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto h-[calc(100vh-150px)] pr-2">
          {history.length === 0 ? (
            <p className="text-slate-400 text-center py-10">No transactions recorded yet.</p>
          ) : (
            history.map((tx) => (
              <div key={tx.id} className="flex gap-4 border-l-2 border-slate-100 pl-6 relative">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white ${
                  tx.type === 'STOCK_IN' ? 'bg-green-500' : 'bg-orange-500'
                }`} />

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`font-bold text-sm ${tx.type === 'STOCK_IN' ? 'text-green-600' : 'text-orange-600'}`}>
                      {tx.type === 'STOCK_IN' ? <ArrowUpRight size={14} className="inline mr-1"/> : <ArrowDownLeft size={14} className="inline mr-1"/>}
                      {tx.type === 'STOCK_IN' ? '+' : ''}{tx.quantityChange} Units
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock size={10} /> {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 font-semibold text-sm">{tx.reason || 'No reason provided'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}