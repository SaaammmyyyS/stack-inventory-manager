import { useState, useCallback } from 'react';
import { useInventory } from './useInventory';
import type { InventoryItem, StockTransaction } from './useInventory';
import { toast } from 'sonner';

export function useInventoryHandlers() {
  const inventory = useInventory();

  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState<InventoryItem | null>(null);

  const [adjustItem, setAdjustItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    type: 'STOCK_IN' | 'STOCK_OUT'
  } | null>(null);

  const [historyItem, setHistoryItem] = useState<{ id: string, name: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  const [historyData, setHistoryData] = useState<StockTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const handleAddProduct = async (data: any) => {
    const success = await inventory.addItem(data);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleUpdateProduct = async (data: Partial<InventoryItem>) => {
    if (!itemToUpdate?.id) return;
    const success = await inventory.updateItem(itemToUpdate.id, data);
    if (success) {
      setItemToUpdate(null);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustItem) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get("amount") as string);
    const reason = formData.get("reason") as string;

    if (isNaN(amount)) {
      toast.error("Please enter a valid number");
      return;
    }

    const success = await inventory.recordMovement(adjustItem.id, amount, adjustItem.type, reason);
    if (success) {
      setAdjustItem(null);
      inventory.fetchRecentActivity();
    }
  };

  const handleOpenHistory = async (id: string, name: string) => {
    setHistoryItem({ id, name });
    setHistoryData([]);
    setIsHistoryLoading(true);
    const data = await inventory.fetchHistory(id);
    setHistoryData(data || []);
    setIsHistoryLoading(false);
  };

  const syncPlan = useCallback(async () => {
    toast.promise(inventory.refreshPlan(), {
      loading: 'Syncing subscription...',
      success: 'Sync complete!',
      error: 'Sync failed.',
    });
  }, [inventory.refreshPlan]);

  return {
    ...inventory,
    currentView, setCurrentView,
    isAddModalOpen, setIsAddModalOpen,
    itemToUpdate, setItemToUpdate,
    adjustItem, setAdjustItem,
    historyItem, setHistoryItem,
    itemToDelete, setItemToDelete,
    historyData, isHistoryLoading,
    handleAddProduct, handleUpdateProduct,
    handleStockAdjustment, handleOpenHistory,
    syncPlan
  };
}