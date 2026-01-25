import { useState } from 'react';
import { useInventory, type StockTransaction } from '../hooks/useInventory';
import { Plus, Minus, Trash2, Loader2, AlertCircle, History } from 'lucide-react';

import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import ActivityLogDrawer from './inventory/ActivityLogDrawer';
import AddProductModal from './inventory/AddProductModal';
import DeleteConfirmModal from './inventory/DeleteConfirmModal';

export default function InventoryView() {
  const {
    optimisticItems,
    isLoading,
    error,
    isPending,
    addItem,
    deleteItem,
    recordMovement,
    fetchHistory
  } = useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<{id: string, name: string, type: 'STOCK_IN' | 'STOCK_OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<{id: string, name: string} | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [historyData, setHistoryData] = useState<StockTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const handleAddProduct = async (formData: FormData) => {
    await addItem(
      formData.get("name") as string,
      parseInt(formData.get("quantity") as string),
      formData.get("sku") as string,
      formData.get("category") as string
    );
    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustItem) return;
    const formData = new FormData(e.currentTarget);
    await recordMovement(
        adjustItem.id,
        parseInt(formData.get("amount") as string),
        adjustItem.type,
        formData.get("reason") as string
    );
    setAdjustItem(null);
  };

  const handleOpenHistory = async (id: string, name: string) => {
    setIsHistoryLoading(true);
    setHistoryItem({ id, name });
    setHistoryData(await fetchHistory(id));
    setIsHistoryLoading(false);
  };

  return (
    <div className="relative animate-in fade-in duration-500 pb-10">

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 font-medium text-sm">Professional stock tracking and audit log.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total SKUs" value={optimisticItems.length} />
        <StatCard title="Total Units" value={optimisticItems.reduce((acc, item) => acc + item.quantity, 0)} />
        <StatCard title="Low Stock" value={optimisticItems.filter(i => i.quantity <= 5).length} alert />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && optimisticItems.length === 0 ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-300" size={40} /></div>
        ) : (
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
                {optimisticItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-700 block text-lg leading-none mb-1">{item.name}</span>
                      <span className="text-xs text-slate-400 font-mono uppercase">{item.sku || 'NO-SKU'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setAdjustItem({id: item.id, name: item.name, type: 'STOCK_OUT'})} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg border border-orange-100 transition-colors">
                          <Minus size={18} />
                        </button>
                        <div className={`px-4 py-2 rounded-xl text-xs font-black min-w-[110px] text-center border ${item.quantity > 5 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {item.quantity} UNITS
                        </div>
                        <button onClick={() => setAdjustItem({id: item.id, name: item.name, type: 'STOCK_IN'})} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors">
                          <Plus size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end items-center gap-2 text-slate-300">
                         <button onClick={() => handleOpenHistory(item.id, item.name)} className="hover:text-blue-500 p-2 transition-all">
                          <History size={18} />
                        </button>
                        <button onClick={() => setItemToDelete({id: item.id, name: item.name})} className="hover:text-red-500 p-2 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddProductModal
        isOpen={isAddModalOpen} isPending={isPending}
        onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddProduct}
      />

      <StockAdjustmentModal
        item={adjustItem} onClose={() => setAdjustItem(null)} onSubmit={handleAdjustmentSubmit}
      />

      <ActivityLogDrawer
        isOpen={!!historyItem} itemName={historyItem?.name || ''}
        isLoading={isHistoryLoading} data={historyData} onClose={() => setHistoryItem(null)}
      />

      <DeleteConfirmModal
        itemName={itemToDelete?.name || null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function StatCard({ title, value, alert }: { title: string; value: number; alert?: boolean }) {
  const isAlertActive = alert && value > 0;
  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${isAlertActive ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
      <h3 className={`text-3xl font-black ${isAlertActive ? 'text-red-600' : 'text-slate-900'}`}>{value}</h3>
    </div>
  );
}