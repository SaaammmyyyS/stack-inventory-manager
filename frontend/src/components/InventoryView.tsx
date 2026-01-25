import { useState, useEffect, useCallback } from 'react';
import { useInventory, type StockTransaction } from '@/hooks/useInventory';
import { Plus, Trash2, Loader2, AlertCircle, Package, Search } from 'lucide-react';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ActiveInventoryTable from './inventory/ActiveInventoryTable';
import TrashBinTable from './inventory/TrashBinTable';
import AddProductModal from './inventory/AddProductModal';
import StockAdjustmentModal from './inventory/StockAdjustmentModal';
import ActivityLogDrawer from './inventory/ActivityLogDrawer';
import DeleteConfirmModal from './inventory/DeleteConfirmModal';

export default function InventoryView() {
  const {
    items,
    totalCount,
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
    trashedItems,
    fetchItems
  } = useInventory();

  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<{id: string, name: string, type: 'STOCK_IN' | 'STOCK_OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<{id: string, name: string} | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  const [historyData, setHistoryData] = useState<StockTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (currentView === 'active') {
      const timer = setTimeout(() => {
        fetchItems({
          page,
          limit,
          search,
          category: category === 'all' ? '' : category
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, category, page, currentView, fetchItems]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

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
    <div className="relative animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 pt-8">
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
          <Button
            variant="outline"
            onClick={() => setCurrentView(currentView === 'active' ? 'trash' : 'active')}
            className="rounded-xl font-bold h-12"
          >
            {currentView === 'active' ? <Trash2 className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
            {currentView === 'active' ? 'View Trash' : 'Back to Inventory'}
          </Button>

          {currentView === 'active' && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-200"
            >
              <Plus className="mr-2 h-5 w-5" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {currentView === 'active' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-blue-500"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl border-slate-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {currentView === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total SKUs" value={totalCount} />
          <StatCard title="Total Units" value={items.reduce((acc, item) => acc + item.quantity, 0)} />
          <StatCard title="Low Stock" value={items.filter(i => i.quantity <= 5).length} alert />
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {isLoading && items.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-slate-400 font-medium">Syncing inventory...</p>
          </div>
        ) : (
          currentView === 'active' ? (
            <ActiveInventoryTable
              items={items}
              totalCount={totalCount}
              currentPage={page}
              pageSize={limit}
              onPageChange={setPage}
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