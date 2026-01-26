import { useState, useCallback, useEffect, useOptimistic, useTransition, useMemo } from 'react';
import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  tenantId: string;
  sku?: string;
  category?: string;
  price?: number;
  minThreshold?: number;
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
  const { organization, membership } = useOrganization();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [trashedItems, setTrashedItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tenantId = organization?.id || "personal";

  const isAdmin = useMemo(() => {
    const isOrgAdmin = membership?.role === "org:admin";
    const isMetadataAdmin = user?.publicMetadata?.role === 'admin';
    return isOrgAdmin || isMetadataAdmin;
  }, [membership, user]);

  const getAuthToken = useCallback(() =>
    getToken({ template: "spring-boot-backend" }),
  [getToken]);

  const [optimisticItems] = useOptimistic(
    items,
    (state, newItem: InventoryItem) => [...state, { ...newItem, isSending: true }]
  );

  const fetchItems = useCallback(async (options: FetchOptions = {}) => {
    setIsLoading(true);
    const { page = 1, limit = 10, search = "", category = "" } = options;

    try {
      const token = await getAuthToken();
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
  }, [getAuthToken, tenantId]);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/trash`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error("Could not load trash");
      const data = await response.json();
      setTrashedItems(data || []);
    } catch (err) {
      setError("Failed to load recycle bin");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, tenantId]);

  const fetchHistory = useCallback(async (itemId: string): Promise<StockTransaction[]> => {
    try {
      const token = await getAuthToken();
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
  }, [getAuthToken, tenantId]);

  const addItem = async (data: any) => {
    startTransition(async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        if (response.status === 403) throw new Error("Permission denied: Admins only.");
        if (!response.ok) throw new Error("Failed to add item");
        fetchItems();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add product");
      }
    });
  };

  const recordMovement = async (itemId: string, amount: number, type: 'STOCK_IN' | 'STOCK_OUT', reason: string) => {
    try {
      const token = await getAuthToken();
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
      const token = await getAuthToken();
      const adminName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin";
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Performed-By': adminName
        }
      });
      if (response.status === 403) throw new Error("Permission denied: Admins only.");
      if (!response.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(item => item.id !== id));
      fetchTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const restoreItem = async (id: string) => {
    try {
      const token = await getAuthToken();
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
      const token = await getAuthToken();
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
    isAdmin,
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