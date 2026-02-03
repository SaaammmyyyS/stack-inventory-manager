import { useState, useCallback } from 'react';
import { useInventory } from './useInventory';
import type { InventoryItem, StockTransaction } from './useInventory';
import { toast } from 'sonner';
import { useOrganization, useUser } from "@clerk/clerk-react";

export function useInventoryHandlers() {
  const inventory = useInventory();
  const { organization } = useOrganization();
  const { user } = useUser();

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

  const tenantId = organization?.id || user?.id || "personal";

  const handleAddProduct = async (data: any) => {
    const success = await inventory.addItem(data);
    if (success) {
      sessionStorage.removeItem(`ai_unlocked_${tenantId}`);
      setIsAddModalOpen(false);
      toast.success("Product added successfully");
    }
  };

  const handleUpdateProduct = async (data: Partial<InventoryItem>) => {
    if (!itemToUpdate?.id) return;
    const success = await inventory.updateItem(itemToUpdate.id, data);
    if (success) {
      sessionStorage.removeItem(`ai_unlocked_${tenantId}`);
      setItemToUpdate(null);
      toast.success("Product updated");
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustItem) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get("amount") as string);
    const reason = formData.get("reason") as string;

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const targetItem = { ...adjustItem };
    setAdjustItem(null);

    const stockPromise = inventory.recordMovement(targetItem.id, amount, targetItem.type, reason);

    toast.promise(stockPromise, {
      loading: `Updating stock for ${targetItem.name}...`,
      success: (isSuccessful) => {
        if (isSuccessful === false) throw new Error("Server rejected update");

        sessionStorage.removeItem(`ai_unlocked_${tenantId}`);
        inventory.fetchRecentActivity();
        return `Stock ${targetItem.type === 'STOCK_IN' ? 'replenished' : 'deducted'} for ${targetItem.name}`;
      },
      error: (err) => {
        return err?.message || 'Stock update failed. Reverting changes.';
      },
    });
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
  }, [inventory]);

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