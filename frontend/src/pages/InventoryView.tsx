import { useEffect, useState, useMemo } from 'react';
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
import DensitySelector from '../components/inventory/DensitySelector';
import { PaginationLoader, ButtonLoader, TableSkeleton } from '../components/inventory/loading';
import TrashBinTable from '../components/inventory/TrashBinTable';
import AddProductModal from '../components/inventory/AddProductModal';
import { UpdateProductModal } from '../components/inventory/UpdateProductModal';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import ActivityLogDrawer from '../components/inventory/ActivityLogDrawer';
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal';
import { UsageWidget } from '../components/UsageWidget';
import { FilterPanel } from '../components/inventory/FilterPanel';
import { useInventoryHandlers } from '@/hooks/useInventoryHandlers';
import { useDebounce } from '@/hooks/useDebounce';
import { useFilters, FilterState } from '@/hooks/useFilters';

export default function InventoryView() {
  const h = useInventoryHandlers();
  const { isLoaded: isAuthLoaded } = useAuth();

  const getFiltersFromURL = (): FilterState => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || '',
      category: params.get('category') || 'all',
      stockStatus: (params.get('stockStatus') as FilterState['stockStatus']) || 'all',
      priceRange: params.get('minPrice') && params.get('maxPrice')
        ? [parseFloat(params.get('minPrice')!), parseFloat(params.get('maxPrice')!)]
        : null,

    };
  };

  const updateURL = (filters: FilterState) => {
    const params = new URLSearchParams();

    if (filters.search.trim()) params.set('search', filters.search);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus);
    if (filters.priceRange) {
      params.set('minPrice', filters.priceRange[0].toString());
      params.set('maxPrice', filters.priceRange[1].toString());
    }


    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
  };

  const filters = useFilters(getFiltersFromURL());
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('page') || '1', 10);
  });
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => {
    return (localStorage.getItem('inventory-density') as 'compact' | 'comfortable' | 'spacious') || 'comfortable';
  });

  const pageSize = {
    compact: 25,
    comfortable: 10,
    spacious: 8
  }[density];

  const handleDensityChange = (mode: 'compact' | 'comfortable' | 'spacious') => {
    setDensity(mode);
    localStorage.setItem('inventory-density', mode);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    filters.updateFilter('search', newFilters.search);
    filters.updateFilter('category', newFilters.category);
    filters.updateFilter('stockStatus', newFilters.stockStatus);
    filters.updateFilter('priceRange', newFilters.priceRange);

    updateURL(newFilters);
    setPage(1);
  };

  const categories = useMemo(() => ['Electronics', 'Furniture', 'Apparel', 'Other'], []);

  const isLimitReached = h.skuLimit > 0 && h.pagination.totalCount >= h.skuLimit;
  const isNearLimit = h.skuLimit > 0 && h.pagination.totalCount >= (h.skuLimit * 0.8) && !isLimitReached;

  const isEffectivelyLoading = h.isLoading &&
    (h.currentView === 'active' ? h.items.length === 0 : h.trashedItems.length === 0);

  const showPaginationLoader = h.isPaginating && h.items.length > 0;
  const showSearchLoader = h.isSearching && h.items.length > 0;

  useEffect(() => {
    if (h.currentView === 'active') {
      const filterParams = filters.getApiParams();
      const context = page === 1 && !filters.hasActiveFilters ? 'initial' :
                     filters.hasActiveFilters ? 'search' : 'pagination';

      h.fetchItems({
        page,
        limit: pageSize,
        ...filterParams
      }, context);
    } else {
      h.fetchTrash();
    }
  }, [filters.filters, page, pageSize, h.currentView, h.fetchItems, h.fetchTrash, filters.hasActiveFilters, filters.getApiParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
  }, [page]);

  if (!isAuthLoaded) return null;

  return (
    <div className="relative animate-in fade-in duration-500 pb-10 max-w-7xl mx-auto px-4">
      {h.currentPlan === 'free' && h.currentView === 'active' && h.skuLimit > 0 && (
        <div className="mt-8">
          <UsageWidget
            current={h.pagination.totalCount}
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
        <div className="mb-6">
          <FilterPanel
            filters={filters.filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            isLoading={h.isLoading || h.isSearching}
          />
          <div className="flex justify-end mt-4">
            <DensitySelector density={density} onDensityChange={handleDensityChange} />
          </div>
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
            <>
              {showPaginationLoader && <PaginationLoader />}
              {showSearchLoader && <PaginationLoader />}
              <ActiveInventoryTable
                items={h.items}
                totalCount={h.pagination.totalCount}
                currentPage={h.pagination.currentPage}
                pageSize={pageSize}
                density={density}
                isPaginating={h.isPaginating}
                onPageChange={(pageNumber) => {
  const filterParams = filters.getApiParams();
  h.fetchItems({ page: pageNumber, limit: pageSize, ...filterParams }, 'pagination');
}}
                onAdjust={(id, name, type) => {
                  const item = h.items.find(i => i.id === id);
                  h.setAdjustItem({ id, name, quantity: item?.quantity || 0, type });
                }}
                onEdit={(item) => h.setItemToUpdate(item)}
                onHistory={h.handleOpenHistory}
                onDelete={(id, name) => h.setItemToDelete({ id, name })}
                isAdmin={h.isAdmin}
              />
            </>
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
      <ActivityLogDrawer isOpen={!!h.historyItem} itemName={h.historyItem?.name || ''} isLoading={h.isHistoryLoading} data={h.historyData} onClose={() => { h.setHistoryItem(null); }} />
      <DeleteConfirmModal itemName={h.itemToDelete?.name || null} onClose={() => h.setItemToDelete(null)} onConfirm={async () => { if (h.itemToDelete) { await h.deleteItem(h.itemToDelete.id); h.setItemToDelete(null); } }} />
    </div>
  );
}