import { useState, useCallback, useTransition, useMemo } from 'react';
import { useAuth, useOrganization, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import axios from "axios";

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

export function useInventory() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [skuLimit, setSkuLimit] = useState(0);
  const [aiUsage, setAiUsage] = useState(0);
  const [aiLimit, setAiLimit] = useState(0);

  const [trashedItems, setTrashedItems] = useState<InventoryItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tenantId = useMemo(() => organization?.id || user?.id || "personal", [organization?.id, user?.id]);
  const currentPlan = useMemo(() => (organization?.publicMetadata?.plan as string)?.toLowerCase() || 'free', [organization]);

  const isAdmin = useMemo(() => {
    const isOrgAdmin = organization?.membershipList?.find(m => m.publicUserData.userId === user?.id)?.role === "org:admin";
    const isMetadataAdmin = user?.publicMetadata?.role === 'admin';
    return isOrgAdmin || isMetadataAdmin;
  }, [organization, user]);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
    });

    instance.interceptors.request.use(async (config) => {
      const token = await getToken({ template: "spring-boot-backend" });
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Tenant-ID'] = tenantId;
      config.headers['X-Organization-Plan'] = currentPlan;
      return config;
    });

    instance.interceptors.response.use(
      (response) => {
        const processHeader = (headerName: string, type: 'sku' | 'ai') => {
          const val = response.headers[headerName.toLowerCase()] || response.headers[headerName];
          if (val && typeof val === 'string') {
            const [curr, lim] = val.split('/').map(Number);
            if (type === 'sku') {
              setTotalCount(curr);
              setSkuLimit(lim);
            } else {
              setAiUsage(curr);
              setAiLimit(lim);
            }
          }
        };
        processHeader('X-Usage-SKU', 'sku');
        processHeader('X-Usage-AI', 'ai');
        return response;
      },
      (err) => {
        if (err.response?.status === 402 || err.response?.status === 429) {
          toast.error(err.response?.status === 402 ? "Limit Reached" : "Too Many Requests", {
            description: err.response.data?.message || "Please upgrade your plan."
          });
        }
        return Promise.reject(err);
      }
    );
    return instance;
  }, [getToken, tenantId, currentPlan]);

  const fetchItems = useCallback(async (options: FetchOptions = {}) => {
    if (!isOrgLoaded) return;
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/inventory', { params: options });
      setItems(data.items || []);
    } catch (err) {
      setError("Could not load inventory");
    } finally {
      setIsLoading(false);
    }
  }, [api, isOrgLoaded]);

  const addItem = useCallback(async (data: any): Promise<boolean> => {
    setError(null);
    try {
      await api.post('/api/inventory', { ...data, tenantId });
      await fetchItems();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add product");
      return false;
    }
  }, [api, tenantId, fetchItems]);

  const updateItem = useCallback(async (id: string, data: any): Promise<boolean> => {
    setError(null);
    try {
      await api.put(`/api/inventory/${id}`, data);
      await fetchItems();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update product");
      return false;
    }
  }, [api, fetchItems]);

  const deleteItem = useCallback(async (id: string) => {
    let previousItems: InventoryItem[] = [];
    setItems(prev => {
      previousItems = [...prev];
      return prev.filter(item => item.id !== id);
    });

    try {
      await api.delete(`/api/inventory/${id}`, {
        headers: { 'X-Performed-By': user?.fullName || "Admin" }
      });
      toast.info("Item moved to trash");
    } catch (err) {
      setItems(previousItems);
      toast.error("Failed to delete item");
    }
  }, [api, user?.fullName]);

  const recordMovement = useCallback(async (itemId: string, amount: number, type: 'STOCK_IN' | 'STOCK_OUT', reason: string): Promise<boolean> => {
    let rollbackItems: InventoryItem[] = [];
    setItems(prev => {
      rollbackItems = [...prev];
      return prev.map(item => {
        if (item.id === itemId) {
          const change = type === 'STOCK_IN' ? amount : -amount;
          return { ...item, quantity: item.quantity + change };
        }
        return item;
      });
    });

    try {
      await api.post(`/api/transactions/${itemId}`, {
        amount, type, reason,
        performedBy: user?.fullName || "System"
      });
      fetchItems();
      return true;
    } catch (err: any) {
      setItems(rollbackItems);
      setError(err.response?.data?.message || "Failed to update stock");
      return false;
    }
  }, [api, user?.fullName, fetchItems]);

  const fetchTrash = useCallback(async () => {
    if (!isOrgLoaded) return;
    try {
      const { data } = await api.get('/api/inventory/trash');
      setTrashedItems(Array.isArray(data) ? data : []);
    } catch (err) {}
  }, [api, isOrgLoaded]);

  const restoreItem = useCallback(async (id: string) => {
    try {
      await api.put(`/api/inventory/restore/${id}`);
      await fetchItems();
      await fetchTrash();
      toast.success("Item restored");
    } catch (err) {}
  }, [api, fetchItems, fetchTrash]);

  const permanentlyDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/inventory/permanent/${id}`);
      setTrashedItems(prev => prev.filter(item => item.id !== id));
      toast.error("Item permanently deleted");
    } catch (err) {}
  }, [api]);

  const fetchHistory = useCallback(async (itemId: string): Promise<StockTransaction[]> => {
    if (!itemId) return [];
    try {
      const { data } = await api.get(`/api/transactions/${itemId}`);
      return data;
    } catch (err) { return []; }
  }, [api]);

  const fetchRecentActivity = useCallback(async () => {
    if (!isOrgLoaded) return;
    try {
      const { data } = await api.get('/api/transactions/recent');
      setRecentActivity(Array.isArray(data) ? data : []);
    } catch (err) {}
  }, [api, isOrgLoaded]);

  const refreshPlan = useCallback(async () => {
    if (organization) {
      await organization.reload();
      toast.success(`Plan updated!`);
      await fetchItems();
    }
  }, [organization, fetchItems]);

  return {
    items, totalCount, skuLimit, aiUsage, aiLimit, trashedItems, recentActivity,
    isLoading, error, setError, isPending, isAdmin, currentPlan,
    addItem, updateItem, deleteItem, restoreItem,
    permanentlyDelete, recordMovement, fetchTrash,
    fetchItems, fetchHistory, fetchRecentActivity, refreshPlan,
    api
  };
}