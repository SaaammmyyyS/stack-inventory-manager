import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Package, Search, CreditCard, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useInventoryHandlers } from '@/hooks/useInventoryHandlers';

export default function InventoryView() {
  const h = useInventoryHandlers();
  const navigate = useNavigate();
  const { has, isLoaded: isAuthLoaded } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const isPro = has?.({ plan: 'test' }) || false;
  const isFreePlan = !isPro;
  const isLimitReached = isFreePlan && h.totalCount >= 50;

  const isEffectivelyLoading = h.isLoading &&
    (h.currentView === 'active' ? h.items.length === 0 : h.trashedItems.length === 0);

  useEffect(() => {
    if (h.currentView === 'active') {
      const timer = setTimeout(() => {
        h.fetchItems({
          page,
          limit,
          search,
          category: category === 'all' ? '' : category
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      h.fetchTrash();
    }
  }, [search, category, page, h.currentView, h.fetchItems, h.fetchTrash]);

  if (!isAuthLoaded) return null;

  return (
    <div className="relative animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4">
      {isFreePlan && h.currentView === 'active' && (
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Free Tier Usage</p>
              <p className="text-lg font-black text-white tracking-tight">{h.totalCount} / 50 SKUs used</p>
            </div>
          </div>
          <div className="flex-1 max-w-md bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out ${isLimitReached ? 'bg-rose-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min((h.totalCount / 50) * 100, 100)}%` }}
            />
          </div>
          {isLimitReached ? (
            <Button
              onClick={() => navigate('/billing')}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl animate-pulse px-6 h-10"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Now
            </Button>
          ) : (
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Standard Plan</p>
          )}
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
            onClick={() => h.setCurrentView(h.currentView === 'active' ? 'trash' : 'active')}
            className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-14 px-8 border-slate-200"
          >
            {h.currentView === 'active' ? <Trash2 className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
            {h.currentView === 'active' ? 'Recycle Bin' : 'Back to Active'}
          </Button>

          {h.currentView === 'active' && h.isAdmin && (
            <Button
              onClick={() => !isLimitReached && h.setIsAddModalOpen(true)}
              disabled={isLimitReached}
              className={`${
                isLimitReached
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200'
              } font-black text-[10px] uppercase tracking-[0.2em] h-14 px-10 rounded-2xl transition-all`}
            >
              <Plus className="mr-2 h-5 w-5 stroke-[3]" />
              {isLimitReached ? 'Limit Reached' : 'New Product'}
            </Button>
          )}
        </div>
      </div>
      {h.currentView === 'active' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[3]" />
            <Input
              placeholder="Filter by name or SKU identifier..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-12 h-14 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-blue-500 font-bold text-slate-600"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-64 h-14 rounded-2xl border-slate-100 bg-white shadow-sm font-black text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
        {isEffectivelyLoading ? (
          <div className="p-32 flex flex-col items-center justify-center gap-6">
            <div className="relative">
               <Loader2 className="animate-spin text-blue-500" size={56} strokeWidth={3} />
               <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200" size={20} />
            </div>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Cloud Database</p>
          </div>
        ) : (
          h.currentView === 'active' ? (
            <ActiveInventoryTable
              items={h.items}
              totalCount={h.totalCount}
              currentPage={page}
              pageSize={limit}
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

      <AddProductModal
        isOpen={h.isAddModalOpen}
        isPending={h.isPending}
        error={h.error}
        onClose={() => h.setIsAddModalOpen(false)}
        onSubmit={h.handleAddProduct}
      />

      <UpdateProductModal
        isOpen={!!h.itemToUpdate}
        isPending={h.isPending}
        item={h.itemToUpdate}
        error={h.error}
        onClose={() => h.setItemToUpdate(null)}
        onSubmit={h.handleUpdateProduct}
      />

      <StockAdjustmentModal
        item={h.adjustItem}
        error={h.error}
        onClose={() => h.setAdjustItem(null)}
        onSubmit={h.handleStockAdjustment}
      />

      <ActivityLogDrawer
        isOpen={!!h.historyItem}
        itemName={h.historyItem?.name || ''}
        isLoading={h.isHistoryLoading}
        data={h.historyData}
        onClose={() => { h.setHistoryItem(null); h.setHistoryData([]); }}
      />

      <DeleteConfirmModal
        itemName={h.itemToDelete?.name || null}
        onClose={() => h.setItemToDelete(null)}
        onConfirm={async () => {
          if (h.itemToDelete) {
            await h.deleteItem(h.itemToDelete.id);
            h.setItemToDelete(null);
          }
        }}
      />
    </div>
  );
}