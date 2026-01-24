import { useState, useCallback, useEffect, useOptimistic, useTransition } from 'react';
import { useAuth, useOrganization } from "@clerk/clerk-react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  tenantId: string;
  isSending?: boolean;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;

export function useInventory() {
  const { getToken } = useAuth();
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
      const tenantId = organization?.id || "personal";

      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId,
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

  const addItem = async (name: string, quantity: number) => {
    const tempItem: InventoryItem = { id: Math.random().toString(), name, quantity, tenantId: 'temp' };

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
          body: JSON.stringify({ name, quantity })
        });
        if (!response.ok) throw new Error("Failed to save");
        fetchItems();
      } catch (err) {
        setError("Failed to save item. Rolling back...");
        fetchItems();
      }
    });
  };

  const deleteItem = async (id: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': organization?.id || "personal"
        }
      });
      if (!response.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError("Delete failed.");
    }
  };

  return { items, optimisticItems, isLoading, error, isPending, addItem, deleteItem };
}