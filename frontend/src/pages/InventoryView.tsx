import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Package, Search, CreditCard, ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOrganization, useAuth } from "@clerk/clerk-react";
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
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import ActivityLogDrawer from '../components/inventory/ActivityLogDrawer';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';
import { useInventoryHandlers } from '@/hooks/useInventoryHandlers';

export default function InventoryView() {
  const h = useInventoryHandlers();
  const navigate = useNavigate();
  const { organization } = useOrganization();
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
  }, [search, category, page, h.currentView]);

  if (!isAuthLoaded) return null;

  return (
    <div className="relative animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4">
      {isFreePlan && h.currentView === 'active' && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Free Tier Usage</p>
              <p className="text-xs text-blue-600 font-medium">{h.totalCount} / 50 SKUs used</p>
            </div>
          </div>
          <div className="flex-1 max-w-md bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isLimitReached ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min((h.totalCount / 50) * 100, 100)}%` }}
            />
          </div>
          {isLimitReached ? (
            <Button
              onClick={() => navigate('/billing')}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg animate-pulse"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade Now
            </Button>
          ) : (
            <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Standard Plan</p>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 pt-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {h.currentView === 'active' ? 'Inventory' : 'Recycle Bin'}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {h.currentView === 'active'
              ? 'Professional stock tracking and audit log.'
              : 'Restore or permanently remove items.'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => h.setCurrentView(h.currentView === 'active' ? 'trash' : 'active')}
            className="rounded-xl font-bold h-12"
          >
            {h.currentView === 'active' ? <Trash2 className="mr-2 h-4 w-4" /> : <Package className="mr-2 h-4 w-4" />}
            {h.currentView === 'active' ? 'View Trash' : 'Back to Inventory'}
          </Button>

          {h.currentView === 'active' && h.isAdmin && (
            <Button
              onClick={() => !isLimitReached && h.setIsAddModalOpen(true)}
              disabled={isLimitReached}
              className={`${
                isLimitReached
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
              } font-bold h-12 rounded-xl transition-all`}
            >
              <Plus className="mr-2 h-5 w-5" />
              {isLimitReached ? 'Limit Reached' : 'Add Product'}
            </Button>
          )}
        </div>
      </div>

      {h.currentView === 'active' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

      {h.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold text-sm">{h.error}</p>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {isEffectivelyLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <p className="text-slate-400 font-medium">Syncing {h.currentView}...</p>
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

      <AddProductModal isOpen={h.isAddModalOpen} isPending={h.isPending} onClose={() => h.setIsAddModalOpen(false)} onSubmit={h.handleAddProduct} />
      <StockAdjustmentModal item={h.adjustItem} error={h.error} onClose={() => h.setAdjustItem(null)} onSubmit={h.handleStockAdjustment} />
      <ActivityLogDrawer isOpen={!!h.historyItem} itemName={h.historyItem?.name || ''} isLoading={h.isHistoryLoading} data={h.historyData} onClose={() => { h.setHistoryItem(null); h.setHistoryData([]); }} />
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

function StatCard({ title, value, alert }: { title: string; value: number; alert?: boolean }) {
  const isAlertActive = alert && value > 0;
  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm transition-all ${isAlertActive ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
      <h3 className={`text-3xl font-black ${isAlertActive ? 'text-red-600' : 'text-slate-900'}`}>{value}</h3>
    </div>
  );
}