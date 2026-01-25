import { useState, useCallback, useEffect, useOptimistic, useTransition } from 'react';
import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  tenantId: string;
  sku?: string;
  category?: string;
  deletedBy?: string;
  isSending?: boolean;
}

export interface StockTransaction {
  id: string;
  quantityChange: number;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'DELETED' | 'RESTORED';
  reason: string;
  performedBy?: string;
  createdAt: string;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;
const TRANSACTION_URL = `${import.meta.env.VITE_API_BASE_URL}/api/transactions`;

export function useInventory() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [trashedItems, setTrashedItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tenantId = organization?.id || "personal";

  const [optimisticItems] = useOptimistic(
    items,
    (state, newItem: InventoryItem) => [...state, { ...newItem, isSending: true }]
  );

  const fetchItems = useCallback(async (options: FetchOptions = {}) => {
    setIsLoading(true);
    const { page = 1, limit = 10, search = "", category = "" } = options;

    try {
      const token = await getToken();

      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category,
      });

      const response = await fetch(`${API_BASE_URL}?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Could not load inventory");

      const data = await response.json();

      setItems(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, tenantId]);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/trash`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Could not load trash");
      setTrashedItems(await response.json());
    } catch (err) {
      setError("Failed to load recycle bin");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, tenantId]);

  const fetchHistory = useCallback(async (itemId: string): Promise<StockTransaction[]> => {
    try {
      const token = await getToken();
      const response = await fetch(`${TRANSACTION_URL}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Could not load history");
      return await response.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [getToken, tenantId]);

  const addItem = async (name: string, quantity: number, sku: string, category: string) => {
    startTransition(async () => {
      try {
        const token = await getToken();
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, quantity, sku, category })
        });
        if (!response.ok) throw new Error("Failed to add item");
        fetchItems();
      } catch (err) {
        setError("Failed to add product");
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
          'X-Tenant-ID': tenantId,
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

  const deleteItem = async (id: string) => {
    try {
      const token = await getToken();
      const adminName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin";
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Performed-By': adminName
        }
      });
      if (!response.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(item => item.id !== id));
      fetchTrash();
    } catch (err) {
      setError("Delete failed.");
    }
  };

  const restoreItem = async (id: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/restore/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      if (!response.ok) throw new Error("Restore failed");
      fetchItems();
      fetchTrash();
    } catch (err) {
      setError("Failed to restore item");
    }
  };

  const permanentlyDelete = async (id: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/permanent/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      if (!response.ok) throw new Error("Permanent delete failed");
      setTrashedItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError("Failed to permanently remove item");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    totalCount,
    trashedItems,
    optimisticItems,
    isLoading,
    error,
    isPending,
    addItem,
    deleteItem,
    restoreItem,
    permanentlyDelete,
    recordMovement,
    fetchTrash,
    fetchItems,
    fetchHistory
  };
}