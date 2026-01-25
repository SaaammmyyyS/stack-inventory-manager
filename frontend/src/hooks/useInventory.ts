import { useState, useCallback, useEffect, useOptimistic, useTransition } from 'react';
import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  tenantId: string;
  sku?: string;
  category?: string;
  isSending?: boolean;
}

export interface StockTransaction {
  id: string;
  quantityChange: number;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'DELETED';
  reason: string;
  performedBy?: string;
  createdAt: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;
const TRANSACTION_URL = `${import.meta.env.VITE_API_BASE_URL}/api/transactions`;

export function useInventory() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, newItem: InventoryItem) => [...state, { ...newItem, isSending: true }]
  );

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': organization?.id || "personal",
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Could not load inventory");
      setItems(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, organization?.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (name: string, quantity: number, sku?: string, category?: string) => {
    const tempItem: InventoryItem = { id: Math.random().toString(), name, quantity, sku, category, tenantId: 'temp' };
    startTransition(async () => {
      addOptimisticItem(tempItem);
      try {
        const token = await getToken();
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': organization?.id || "personal",
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, quantity, sku, category })
        });
        if (!response.ok) throw new Error("Failed to save");
        fetchItems();
      } catch (err) {
        setError("Failed to save item.");
        fetchItems();
      }
    });
  };

  const recordMovement = async (itemId: string, amount: number, type: 'STOCK_IN' | 'STOCK_OUT', reason: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${TRANSACTION_URL}/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': organization?.id || "personal",
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          type,
          reason,
          performedBy: user?.fullName || user?.primaryEmailAddress?.emailAddress || "System User"
        })
      });
      if (!response.ok) throw new Error("Movement failed");
      fetchItems();
    } catch (err) {
      setError("Failed to record movement");
    }
  };

  const fetchHistory = async (itemId: string): Promise<StockTransaction[]> => {
    try {
      const token = await getToken();
      const response = await fetch(`${TRANSACTION_URL}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': organization?.id || "personal"
        }
      });
      if (!response.ok) throw new Error("Failed to load history");
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const token = await getToken();

      const adminName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin";

      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': organization?.id || "personal",
          'X-Performed-By': adminName
        }
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Delete failed");
      }

      setItems(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return {
    items,
    optimisticItems,
    isLoading,
    error,
    isPending,
    addItem,
    deleteItem,
    recordMovement,
    fetchHistory
  };
}