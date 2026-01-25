interface Props {
  item: { id: string; name: string; type: 'STOCK_IN' | 'STOCK_OUT' } | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function StockAdjustmentModal({ item, onClose, onSubmit }: Props) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[80] p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black mb-1 text-slate-900">
          {item.type === 'STOCK_IN' ? 'Restock' : 'Deduct Stock'}
        </h3>
        <p className="text-slate-500 text-sm mb-6 font-medium">{item.name}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Quantity</label>
            <input name="amount" type="number" required placeholder="0" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Reason</label>
            <select name="reason" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium">
              <option value="Regular Restock">Regular Restock</option>
              <option value="Customer Sale">Customer Sale</option>
              <option value="Damaged Goods">Damaged/Waste</option>
              <option value="Inventory Correction">Correction</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl">Cancel</button>
            <button type="submit" className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg ${item.type === 'STOCK_IN' ? 'bg-blue-600' : 'bg-orange-600'}`}>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}