import { useState, useCallback, useTransition, useMemo } from 'react';
import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

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

  const tenantId = useMemo(() => organization?.id || user?.id || "personal", [organization?.id, user?.id]);

  const currentPlan = useMemo(() => {
    const plan = organization?.publicMetadata?.plan as string;
    return plan?.toLowerCase() || 'free';
  }, [organization?.publicMetadata?.plan]);

  const isAdmin = useMemo(() => {
    const isOrgAdmin = membership?.role === "org:admin" || membership?.role === "admin";
    const isMetadataAdmin = user?.publicMetadata?.role === 'admin';
    return isOrgAdmin || isMetadataAdmin;
  }, [membership?.role, user?.publicMetadata?.role]);

  const getAuthToken = useCallback((forceRefresh = false) =>
    getToken({
      template: "spring-boot-backend",
      skipCache: forceRefresh
    }),
  [getToken]);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getAuthToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId,
      'X-Organization-Plan': currentPlan,
      'Content-Type': 'application/json',
    };

    return fetch(url, { ...options, headers });
  }, [getAuthToken, tenantId, currentPlan]);

  const fetchItems = useCallback(async (options: FetchOptions = {}) => {
    if (!isOrgLoaded) return;
    setIsLoading(true);

    const { page = 1, limit = 10, search = "", category = "" } = options;

    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category,
      });

      const response = await fetchWithAuth(`${API_BASE_URL}?${query.toString()}`);

      if (!response.ok) throw new Error("Could not load inventory");
      const data = await response.json();
      setItems(data.items || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, isOrgLoaded]);

  const fetchTrash = useCallback(async () => {
    if (!isOrgLoaded) return;
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/trash`);
      const data = await response.json();
      setTrashedItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load recycle bin");
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth, isOrgLoaded]);

  const addItem = useCallback(async (data: any): Promise<boolean> => {
    setError(null);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const response = await fetchWithAuth(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ ...data, tenantId })
          });
          if (!response.ok) {
              const ed = await response.json();
              throw new Error(ed.message || "Failed to add product");
          }
          await fetchItems();
          toast.success("Item added successfully");
          resolve(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to add product");
          toast.error(err instanceof Error ? err.message : "Failed to add item");
          resolve(false);
        }
      });
    });
  }, [fetchWithAuth, tenantId, fetchItems]);

  const updateItem = useCallback(async (id: string, data: any): Promise<boolean> => {
    setError(null);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          if (!response.ok) {
            const ed = await response.json();
            throw new Error(ed.message || "Failed to update product");
          }
          await fetchItems();
          toast.success("Item updated");
          resolve(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to update product");
          resolve(false);
        }
      });
    });
  }, [fetchWithAuth, fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const adminName = user?.fullName || "Admin";
      await fetchWithAuth(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'X-Performed-By': adminName }
      });
      setItems(prev => prev.filter(item => item.id !== id));
      fetchTrash();
      toast.info("Item moved to trash");
    } catch (err) {
      setError("Delete failed.");
    }
  }, [fetchWithAuth, user?.fullName, fetchTrash]);

  const restoreItem = useCallback(async (id: string) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/restore/${id}`, { method: 'PUT' });
      fetchItems();
      fetchTrash();
      toast.success("Item restored");
    } catch (err) {
      setError("Restore failed");
    }
  }, [fetchWithAuth, fetchItems, fetchTrash]);

  const permanentlyDelete = useCallback(async (id: string) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/permanent/${id}`, { method: 'DELETE' });
      setTrashedItems(prev => prev.filter(item => item.id !== id));
      toast.error("Item permanently deleted");
    } catch (err) {
      setError("Permanent delete failed");
    }
  }, [fetchWithAuth]);

  const recordMovement = useCallback(async (
    itemId: string,
    amount: number,
    type: 'STOCK_IN' | 'STOCK_OUT',
    reason: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetchWithAuth(`${TRANSACTION_URL}/${itemId}`, {
        method: 'POST',
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
      toast.success(`Stock ${type === 'STOCK_IN' ? 'added' : 'removed'}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment error");
      return false;
    }
  }, [fetchWithAuth, user?.fullName, user?.primaryEmailAddress?.emailAddress, fetchItems]);

  const fetchHistory = useCallback(async (itemId: string): Promise<StockTransaction[]> => {
    if (!itemId) return [];
    try {
      const response = await fetchWithAuth(`${TRANSACTION_URL}/${itemId}`);
      if (!response.ok) throw new Error("History fetch failed");
      return await response.json();
    } catch (err) {
      return [];
    }
  }, [fetchWithAuth]);

  const fetchRecentActivity = useCallback(async () => {
    if (!isOrgLoaded) return;
    try {
      const response = await fetchWithAuth(`${TRANSACTION_URL}/recent`);
      const data = await response.json();
      setRecentActivity(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load activity feed");
    }
  }, [fetchWithAuth, isOrgLoaded]);

  const refreshPlan = useCallback(async () => {
    if (organization) {
      try {
        const oldPlan = organization.publicMetadata.plan;
        await organization.reload();
        await getAuthToken(true);
        const newPlan = organization.publicMetadata.plan;

        if (oldPlan !== newPlan) {
          toast.success(`Plan updated to ${newPlan || 'Free'}!`);
          fetchItems();
        } else {
          toast.info("Plan status is already up to date.");
        }
      } catch (err) {
        console.error("Plan sync failed:", err);
      }
    }
  }, [organization, getAuthToken, fetchItems]);

  return {
    items, totalCount, trashedItems, recentActivity,
    isLoading, error, setError, isPending, isAdmin, currentPlan,
    getAuthToken, addItem, updateItem, deleteItem, restoreItem,
    permanentlyDelete, recordMovement, fetchTrash,
    fetchItems, fetchHistory, fetchRecentActivity, refreshPlan,
    fetchWithTenant: fetchWithAuth
  };
}