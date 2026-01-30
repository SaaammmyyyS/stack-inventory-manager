import React from 'react';
import { Plus, Minus, Trash2, History, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import type { InventoryItem } from '../../hooks/useInventory';
import { Button } from "@/components/ui/button";

interface ActiveInventoryTableProps {
  items: InventoryItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isAdmin: boolean;
  onPageChange: (page: number) => void;
  onAdjust: (id: string, name: string, type: 'STOCK_IN' | 'STOCK_OUT') => void;
  onHistory: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  onEdit: (item: InventoryItem) => void;
}

const ActiveInventoryTable: React.FC<ActiveInventoryTableProps> = ({
  items,
  totalCount,
  currentPage,
  pageSize,
  isAdmin,
  onPageChange,
  onAdjust,
  onHistory,
  onDelete,
  onEdit
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
            <tr>
              <th className="px-8 py-6">Product Info</th>
              <th className="px-8 py-6 text-center">Stock Management</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                  <td className="px-8 py-5">
                    <span className="font-black text-slate-900 block text-lg leading-none mb-1.5 tracking-tight">
                      {item.name}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.sku || 'NO-SKU'}
                      </span>
                      <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.category || 'General'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-3">
                      {isAdmin && (
                        <button
                          onClick={() => onAdjust(item.id, item.name, 'STOCK_OUT')}
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-xl border border-orange-100 transition-colors"
                        >
                          <Minus size={16} strokeWidth={3} />
                        </button>
                      )}

                      <div className={`px-5 py-2.5 rounded-2xl text-[11px] font-black min-w-[120px] text-center border shadow-sm ${
                        item.quantity > (item.minThreshold || 5)
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100 motion-safe:animate-pulse'
                      }`}>
                        {item.quantity} UNITS
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => onAdjust(item.id, item.name, 'STOCK_IN')}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl border border-blue-100 transition-colors"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-1.5 text-slate-300">
                      {isAdmin && (
                        <button
                          onClick={() => onEdit(item)}
                          className="hover:text-amber-500 hover:bg-amber-50 p-2.5 rounded-xl transition-all"
                          title="Edit Details"
                        >
                          <Edit size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => onHistory(item.id, item.name)}
                        className="hover:text-blue-500 hover:bg-blue-50 p-2.5 rounded-xl transition-all"
                        title="View History"
                      >
                        <History size={18} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onDelete(item.id, item.name)}
                          className="hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-xl transition-all"
                          title="Move to Trash"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-8 py-24 text-center">
                   <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No matching records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-white mt-auto">
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Showing <span className="text-slate-900">{items.length}</span> / {totalCount} SKUs
        </div>

        <div className="flex items-center gap-6">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-100 h-10 px-4 font-black text-[10px] uppercase tracking-widest"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-100 h-10 px-4 font-black text-[10px] uppercase tracking-widest"
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