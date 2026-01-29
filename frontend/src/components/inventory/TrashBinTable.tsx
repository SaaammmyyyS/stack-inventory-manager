import React, { useState } from 'react';
import { RotateCcw, Trash2, User, Inbox, AlertTriangle, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  deletedBy?: string;
  [key: string]: any;
}

interface TrashBinTableProps {
  items: InventoryItem[];
  isAdmin: boolean;
  onFetch: () => void;
  onRestore: (id: string) => Promise<void>;
  onHardDelete: (id: string) => Promise<void>;
}

const TrashBinTable: React.FC<TrashBinTableProps> = ({
  items = [],
  isAdmin,
  onFetch,
  onRestore,
  onHardDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;
  const totalItems = items?.length || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = (items || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setItemToDelete(null);
  };

  const handleRestore = async (id: string) => {
    try {
      await onRestore(id);
      onFetch();
    } catch (err) {
      console.error("Failed to restore item", err);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await onHardDelete(itemToDelete.id);
        closeDeleteModal();
        onFetch();
      } catch (err) {
        console.error("Failed to purge item", err);
      }
    }
  };

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-50/30 rounded-[2rem] border-2 border-dashed border-slate-100 mx-4 my-4">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-slate-200" />
        </div>
        <p className="text-slate-500 font-bold text-lg">Your recycle bin is empty</p>
        <p className="text-slate-400 text-sm">Deleted items will stay here until purged.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
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
            {paginatedItems.map((item) => (
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
                  {isAdmin ? (
                    <div className="flex justify-end items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestore(item.id)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold border-none h-9"
                      >
                        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(item)}
                        className="border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl font-bold h-9"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-auto">
        <div className="p-4 bg-amber-50/50 border-t border-b border-amber-100 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium leading-tight">
            Restoring moves the item back to active inventory. Purging is <span className="underline font-bold">permanent</span> and wipes all history.
          </p>
        </div>

        <div className="px-8 py-4 flex items-center justify-between bg-white rounded-b-[2rem]">
          <div className="text-sm text-slate-500 font-medium">
            Total Trashed: <span className="text-slate-900 font-bold">{totalItems}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-bold uppercase">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-9"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertTriangle size={28} />
                </div>
                <button onClick={closeDeleteModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">Final Warning</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                You are about to purge <span className="font-bold text-slate-900">"{itemToDelete?.name}"</span>.
                This action is irreversible and will delete all associated stock history records.
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={confirmDelete}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-100"
                >
                  Yes, Permanently Purge
                </Button>
                <Button
                  variant="ghost"
                  onClick={closeDeleteModal}
                  className="w-full text-slate-500 font-bold h-12 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashBinTable;