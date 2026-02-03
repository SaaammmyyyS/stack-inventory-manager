import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Package, Search, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ActiveInventoryTable from '../components/inventory/ActiveInventoryTable';
import TrashBinTable from '../components/inventory/TrashBinTable';
import AddProductModal from '../components/inventory/AddProductModal';
import { UpdateProductModal } from '../components/inventory/UpdateProductModal';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import ActivityLogDrawer from '../components/inventory/ActivityLogDrawer';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';
import { UsageWidget } from '../components/UsageWidget';
import { useInventoryHandlers } from '@/hooks/useInventoryHandlers';

export default function InventoryView() {
  const h = useInventoryHandlers();
  const { isLoaded: isAuthLoaded } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const isLimitReached = h.skuLimit > 0 && h.totalCount >= h.skuLimit;
  const isNearLimit = h.skuLimit > 0 && h.totalCount >= (h.skuLimit * 0.8) && !isLimitReached;

  const isEffectivelyLoading = h.isLoading &&
    (h.currentView === 'active' ? h.items.length === 0 : h.trashedItems.length === 0);

  useEffect(() => {
    if (h.currentView === 'active') {
      const timer = setTimeout(() => {
        h.fetchItems({
          page,
          limit: PAGE_SIZE,
          search,
          category: category === 'all' ? '' : category
        });
      }, 400);
      return () => clearTimeout(timer);
    } else {
      h.fetchTrash();
    }
  }, [search, category, page, h.currentView, h.fetchItems, h.fetchTrash]);

  if (!isAuthLoaded) return null;

  return (
    <div className="relative animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4">
      {h.currentPlan === 'free' && h.currentView === 'active' && h.skuLimit > 0 && (
        <div className="mt-8">
          <UsageWidget
            current={h.totalCount}
            limit={h.skuLimit}
            plan={h.currentPlan}
            label="Inventory Usage"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 pt-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
            {h.currentView === 'active' ? 'Inventory' : 'Recycle Bin'}
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-tight">
            {h.currentView === 'active'
              ? 'Professional stock tracking and supply chain audit log.'
              : 'Restore items to inventory or permanently remove records.'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              h.setCurrentView(h.currentView === 'active' ? 'trash' : 'active');
              setPage(1);
            }}
            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-8 border-slate-200"
          >
            {h.currentView === 'active' ? <Trash2 className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
            {h.currentView === 'active' ? 'Recycle Bin' : 'Back to Active'}
          </Button>

          {h.currentView === 'active' && h.isAdmin && (
            <Button
              onClick={() => h.setIsAddModalOpen(true)}
              disabled={isLimitReached || h.isLoading}
              className={`${
                isLimitReached
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                : isNearLimit
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200'
              } font-black text-[10px] uppercase tracking-[0.2em] h-14 px-10 rounded-2xl transition-all`}
            >
              {isLimitReached ? (
                <><AlertCircle className="mr-2 h-5 w-5" /> Limit Reached</>
              ) : h.isLoading && h.items.length === 0 ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...</>
              ) : (
                <><Plus className="mr-2 h-5 w-5 stroke-[3]" /> New Product</>
              )}
            </Button>
          )}
        </div>
      </div>

      {h.currentView === 'active' && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by SKU or Name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-12 h-14 rounded-2xl border-slate-200 focus:ring-blue-500"
            />
          </div>
          <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[200px] h-14 rounded-2xl border-slate-200 font-bold">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Apparel">Apparel</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
        {isEffectivelyLoading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-blue-500" size={56} strokeWidth={3} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Syncing Cloud Database</p>
          </div>
        ) : (
          h.currentView === 'active' ? (
            <ActiveInventoryTable
              items={h.items}
              totalCount={h.totalCount}
              currentPage={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onAdjust={(id, name, type) => {
                const item = h.items.find(i => i.id === id);
                h.setAdjustItem({ id, name, quantity: item?.quantity || 0, type });
              }}
              onEdit={(item) => h.setItemToUpdate(item)}
              onHistory={h.handleOpenHistory}
              onDelete={(id, name) => h.setItemToDelete({ id, name })}
              isAdmin={h.isAdmin}
            />
          ) : (
            <TrashBinTable
              items={h.trashedItems}
              isAdmin={h.isAdmin}
              onFetch={h.fetchTrash}
              onRestore={h.restoreItem}
              onHardDelete={h.permanentlyDelete}
            />
          )
        )}
      </div>

      <AddProductModal isOpen={h.isAddModalOpen} isPending={h.isPending} error={h.error} onClose={() => h.setIsAddModalOpen(false)} onSubmit={h.handleAddProduct} />
      <UpdateProductModal isOpen={!!h.itemToUpdate} isPending={h.isPending} item={h.itemToUpdate} error={h.error} onClose={() => h.setItemToUpdate(null)} onSubmit={h.handleUpdateProduct} />
      <StockAdjustmentModal item={h.adjustItem} error={h.error} onClose={() => h.setAdjustItem(null)} onSubmit={h.handleStockAdjustment} />
      <ActivityLogDrawer isOpen={!!h.historyItem} itemName={h.historyItem?.name || ''} isLoading={h.isHistoryLoading} data={h.historyData} onClose={() => { h.setHistoryItem(null); h.setHistoryData([]); }} />
      <DeleteConfirmModal itemName={h.itemToDelete?.name || null} onClose={() => h.setItemToDelete(null)} onConfirm={async () => { if (h.itemToDelete) { await h.deleteItem(h.itemToDelete.id); h.setItemToDelete(null); } }} />
    </div>
  );
}