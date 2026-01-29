import { useState } from 'react';
import { useInventory } from './useInventory';
import { StockTransaction } from './useInventory';

export function useInventoryHandlers() {
  const inventory = useInventory();

  const [currentView, setCurrentView] = useState<'active' | 'trash'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const handleAddProduct = async (formData: FormData) => {
    const success = await inventory.addItem({
      name: formData.get("name") as string,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      price: parseFloat(formData.get("price") as string) || 0,
      minThreshold: parseInt(formData.get("minThreshold") as string) || 0
    });
    if (success) setIsAddModalOpen(false);
  };

  const handleStockAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustItem) return;

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get("amount") as string);
    const reason = formData.get("reason") as string;

    const success = await inventory.recordMovement(
      adjustItem.id,
      amount,
      adjustItem.type,
      reason
    );

    if (success) {
      setAdjustItem(null);
      inventory.fetchRecentActivity();
    }
  };

  const handleOpenHistory = async (id: string, name: string) => {
    setHistoryItem({ id, name });
    setHistoryData([]);
    setIsHistoryLoading(true);
    try {
      const data = await inventory.fetchHistory(id);
      setHistoryData(data || []);
    } catch (err) {
      setHistoryData([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return {
    ...inventory,
    currentView,
    setCurrentView,
    isAddModalOpen,
    setIsAddModalOpen,
    adjustItem,
    setAdjustItem,
    historyItem,
    setHistoryItem,
    itemToDelete,
    setItemToDelete,
    historyData,
    setHistoryData,
    isHistoryLoading,
    handleAddProduct,
    handleStockAdjustment,
    handleOpenHistory
  };
}