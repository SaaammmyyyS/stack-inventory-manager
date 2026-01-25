import React from 'react';
import { Plus, Minus, Trash2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InventoryItem } from '../../hooks/useInventory';
import { Button } from "@/components/ui/button";

interface ActiveInventoryTableProps {
  items: InventoryItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAdjust: (id: string, name: string, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onHistory: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

const ActiveInventoryTable: React.FC<ActiveInventoryTableProps> = ({
  items,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onAdjust,
  onHistory,
  onDelete
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col h-full">
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
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-700 block text-lg leading-none mb-1">
                      {item.name}
                      {item.isSending && (
                        <span className="ml-2 text-xs font-medium text-blue-400 animate-pulse">
                          (Saving...)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      {item.sku || 'NO-SKU'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => onAdjust(item.id, item.name, 'STOCK_OUT')}
                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg border border-orange-100 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <div className={`px-4 py-2 rounded-xl text-xs font-black min-w-[110px] text-center border ${
                        item.quantity > 5
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
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
                      <button
                        onClick={() => onHistory(item.id, item.name)}
                        className="hover:text-blue-500 p-2 transition-all"
                        title="View History"
                      >
                        <History size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id, item.name)}
                        className="hover:text-red-500 p-2 transition-all"
                        title="Soft Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-medium">
                  No active items found in your inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white mt-auto">
        <div className="text-sm text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{items.length}</span> of {totalCount} results
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-400 font-bold uppercase tracking-tighter">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 hover:bg-slate-50"
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInventoryTable;