import { useState } from 'react';
import { useInventory, type StockTransaction } from '../hooks/useInventory';
import { Plus, Trash2, Loader2, AlertCircle, Package } from 'lucide-react';

import ActiveInventoryTable from './inventory/ActiveInventoryTable';
import TrashBinTable from './inventory/TrashBinTable';
import AddProductModal from './inventory/AddProductModal';
import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import ActivityLogDrawer from './inventory/ActivityLogDrawer';
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
    fetchHistory,
    restoreItem,
    permanentlyDelete,
    fetchTrash,
    trashedItems
  } = useInventory();

  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
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

  const handleOpenHistory = async (id: string, name: string) => {
    setHistoryItem({ id, name });
    setIsHistoryLoading(true);
    setHistoryData([]);

    try {
      const data = await fetchHistory(id);
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <div className="relative animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {currentView === 'active' ? 'Inventory' : 'Recycle Bin'}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {currentView === 'active'
              ? 'Professional stock tracking and audit log.'
              : 'Restore or permanently remove items.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentView(currentView === 'active' ? 'trash' : 'active')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            {currentView === 'active' ? <Trash2 size={18} /> : <Package size={18} />}
            {currentView === 'active' ? 'View Trash' : 'Back to Inventory'}
          </button>

          {currentView === 'active' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 text-sm"
            >
              <Plus size={20} /> Add Product
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 md:mx-0 mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {currentView === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 px-4 md:px-0">
          <StatCard title="Total SKUs" value={optimisticItems.length} />
          <StatCard title="Total Units" value={optimisticItems.reduce((acc, item) => acc + item.quantity, 0)} />
          <StatCard title="Low Stock" value={optimisticItems.filter(i => i.quantity <= 5).length} alert />
        </div>
      )}

      <div className="mx-4 md:mx-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && optimisticItems.length === 0 ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-300" size={40} /></div>
        ) : (
          currentView === 'active' ? (
            <ActiveInventoryTable
              items={optimisticItems}
              onAdjust={(id, name, type) => setAdjustItem({id, name, type})}
              onHistory={handleOpenHistory}
              onDelete={(id, name) => setItemToDelete({id, name})}
            />
          ) : (
            <TrashBinTable
              items={trashedItems}
              onFetch={fetchTrash}
              onRestore={restoreItem}
              onHardDelete={permanentlyDelete}
            />
          )
        )}
      </div>

      <AddProductModal
        isOpen={isAddModalOpen} isPending={isPending}
        onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddProduct}
      />

      <StockAdjustmentModal
        item={adjustItem} onClose={() => setAdjustItem(null)}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!adjustItem) return;
          const formData = new FormData(e.currentTarget);
          await recordMovement(adjustItem.id, parseInt(formData.get("amount") as string), adjustItem.type, formData.get("reason") as string);
          setAdjustItem(null);
        }}
      />

      <ActivityLogDrawer
        isOpen={!!historyItem}
        itemName={historyItem?.name || ''}
        isLoading={isHistoryLoading}
        data={historyData}
        onClose={() => {
          setHistoryItem(null);
          setHistoryData([]);
        }}
      />

      <DeleteConfirmModal
        itemName={itemToDelete?.name || null}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
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