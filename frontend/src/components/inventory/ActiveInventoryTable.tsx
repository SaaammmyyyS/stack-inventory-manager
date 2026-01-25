import React from 'react';
import { Plus, Minus, Trash2, History } from 'lucide-react';
import type { InventoryItem } from '../../hooks/useInventory';

interface ActiveInventoryTableProps {
  items: InventoryItem[];
  onAdjust: (id: string, name: string, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onHistory: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

const ActiveInventoryTable: React.FC<ActiveInventoryTableProps> = ({
  items,
  onAdjust,
  onHistory,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-widest">
          <tr>
            <th className="px-8 py-5">Product Info</th>
            <th className="px-8 py-5 text-center">Stock Management</th>
            <th className="px-8 py-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => (
            <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
              <td className="px-8 py-5">
                <span className="font-bold text-slate-700 block text-lg leading-none mb-1">
                  {item.name}
                  {item.isSending && <span className="ml-2 text-xs font-medium text-blue-400 animate-pulse">(Saving...)</span>}
                </span>
                <span className="text-xs text-slate-400 font-mono uppercase">{item.sku || 'NO-SKU'}</span>
              </td>
              <td className="px-8 py-5">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => onAdjust(item.id, item.name, 'STOCK_OUT')}
                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg border border-orange-100 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <div className={`px-4 py-2 rounded-xl text-xs font-black min-w-[110px] text-center border ${item.quantity > 5 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {item.quantity} UNITS
                  </div>
                  <button
                    onClick={() => onAdjust(item.id, item.name, 'STOCK_IN')}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </td>
              <td className="px-8 py-5 text-right">
                <div className="flex justify-end items-center gap-2 text-slate-300">
                  <button onClick={() => onHistory(item.id, item.name)} className="hover:text-blue-500 p-2 transition-all">
                    <History size={18} />
                  </button>
                  <button onClick={() => onDelete(item.id, item.name)} className="hover:text-red-500 p-2 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveInventoryTable;