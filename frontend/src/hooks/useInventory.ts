import { useState, useCallback, useTransition, useMemo } from 'react';
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
  itemName?: string;
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
  const { organization, isLoaded: isOrgLoaded, membership } = useOrganization();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [trashedItems, setTrashedItems] = useState<InventoryItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  const tenantId = useMemo(() => organization?.id || user?.id || "personal", [organization, user]);

  const isAdmin = useMemo(() => {
    const isOrgAdmin = membership?.role === "org:admin" || membership?.role === "admin";
    const isMetadataAdmin = user?.publicMetadata?.role === 'admin';
    return isOrgAdmin || isMetadataAdmin;
  }, [membership, user]);

  const getAuthToken = useCallback(() =>
    getToken({ template: "spring-boot-backend" }),
  [getToken]);

  const syncPlanFromToken = useCallback(async () => {
    const token = await getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const plan = payload.org_plan || payload.plan || 'free';
        const lowerPlan = plan.toLowerCase();
        setCurrentPlan(lowerPlan);
        return lowerPlan;
      } catch (e) {
        setCurrentPlan('free');
        return 'free';
      }
    }
    return 'free';
  }, [getAuthToken]);

  const fetchItems = useCallback(async (options: FetchOptions = {}) => {
    if (!isOrgLoaded) return;
    setIsLoading(true);
    await syncPlanFromToken();

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
          'X-Tenant-ID': tenantId
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
  }, [getAuthToken, tenantId, isOrgLoaded, syncPlanFromToken]);

  const fetchTrash = useCallback(async () => {
    if (!isOrgLoaded) return;
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/trash`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      const data = await response.json();
      setTrashedItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load recycle bin");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, tenantId, isOrgLoaded]);

  const addItem = useCallback(async (data: any): Promise<boolean> => {
    setError(null);
    return new Promise((resolve) => {
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
            body: JSON.stringify({ ...data, tenantId })
          });
          if (!response.ok) {
             const ed = await response.json();
             throw new Error(ed.message || "Failed to add product");
          }
          await fetchItems();
          resolve(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to add product");
          resolve(false);
        }
      });
    });
  }, [getAuthToken, tenantId, fetchItems]);

  const updateItem = useCallback(async (id: string, data: any): Promise<boolean> => {
    setError(null);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const token = await getAuthToken();
          const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Tenant-ID': tenantId,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          if (!response.ok) {
            const ed = await response.json();
            throw new Error(ed.message || "Failed to update product");
          }
          await fetchItems();
          resolve(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to update product");
          resolve(false);
        }
      });
    });
  }, [getAuthToken, tenantId, fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      const adminName = user?.fullName || "Admin";
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
          'X-Performed-By': adminName
        }
      });
      setItems(prev => prev.filter(item => item.id !== id));
      fetchTrash();
    } catch (err) {
      setError("Delete failed.");
    }
  }, [getAuthToken, tenantId, user, fetchTrash]);

  const restoreItem = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_BASE_URL}/restore/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      fetchItems();
      fetchTrash();
    } catch (err) {
      setError("Restore failed");
    }
  }, [getAuthToken, tenantId, fetchItems, fetchTrash]);

  const permanentlyDelete = useCallback(async (id: string) => {
    try {
      const token = await getAuthToken();
      await fetch(`${API_BASE_URL}/permanent/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      setTrashedItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError("Permanent delete failed");
    }
  }, [getAuthToken, tenantId]);

  const recordMovement = useCallback(async (
    itemId: string,
    amount: number,
    type: 'STOCK_IN' | 'STOCK_OUT',
    reason: string
  ): Promise<boolean> => {
    setError(null);
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
          performedBy: user?.fullName || user?.primaryEmailAddress?.emailAddress || "System"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Adjustment failed");
      }

      await fetchItems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment error");
      return false;
    }
  }, [getAuthToken, tenantId, user, fetchItems]);

  const fetchHistory = useCallback(async (itemId: string): Promise<StockTransaction[]> => {
    if (!itemId) return [];
    try {
      const token = await getAuthToken();
      const response = await fetch(`${TRANSACTION_URL}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      if (!response.ok) throw new Error("History fetch failed");
      return await response.json();
    } catch (err) {
      return [];
    }
  }, [getAuthToken, tenantId]);

  const fetchRecentActivity = useCallback(async () => {
    if (!isOrgLoaded) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`${TRANSACTION_URL}/recent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      const data = await response.json();
      setRecentActivity(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load activity feed");
    }
  }, [getAuthToken, tenantId, isOrgLoaded]);

  return {
    items, totalCount, trashedItems, recentActivity,
    isLoading, error, setError, isPending, isAdmin, currentPlan,
    getAuthToken, addItem, updateItem, deleteItem, restoreItem,
    permanentlyDelete, recordMovement, fetchTrash,
    fetchItems, fetchHistory, fetchRecentActivity
  };
}