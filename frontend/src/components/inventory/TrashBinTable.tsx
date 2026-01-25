import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, User, Inbox, AlertTriangle, X, AlertCircle } from 'lucide-react';
import type { InventoryItem } from '../../hooks/useInventory';

interface TrashBinTableProps {
  items: InventoryItem[];
  onFetch: () => void;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
}

const TrashBinTable: React.FC<TrashBinTableProps> = ({
  items,
  onFetch,
  onRestore,
  onHardDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onHardDelete(itemToDelete.id);
      closeDeleteModal();
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-50/30 rounded-xl border-2 border-dashed border-slate-100">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-slate-200" />
        </div>
        <p className="text-slate-500 font-bold text-lg">Your recycle bin is empty</p>
        <p className="text-slate-400 text-sm">Deleted items will stay here for 30 days.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">Deleted By</th>
                <th className="px-8 py-5 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => (
                <tr key={item.id} className="group hover:bg-red-50/10 transition-colors">
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-700 block text-lg leading-none mb-1">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        {item.sku || 'NO-SKU'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.category || 'Uncategorized'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-600">
                        {item.deletedBy || "System Admin"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button
                        onClick={() => onRestore(item.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase hover:bg-blue-100 transition-all active:scale-95"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-400 rounded-xl font-bold text-xs uppercase hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
                      >
                        <Trash2 size={14} /> Purge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-amber-50/50 border-t border-amber-100 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-500" />
          <p className="text-[11px] text-amber-700 font-medium leading-tight">
            Restoring an item will move it back to your active inventory list.
            Purging an item is permanent and cannot be undone.
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <button
                  onClick={closeDeleteModal}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Permanent Deletion</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-800">"{itemToDelete?.name}"</span>?
                This will wipe all historical transactions for this item. This action <span className="text-red-600 font-bold underline">cannot</span> be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors"
                >
                  No, Keep it
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-95"
                >
                  Yes, Purge Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashBinTable;