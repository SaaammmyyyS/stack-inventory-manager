import { useMemo } from 'react';
import { useInventory } from './useInventory';

export function useDashboardStats() {
  const { items, trashedItems, isLoading, error } = useInventory();

  const stats = useMemo(() => {
    const totalValuation = items.reduce((acc, item) => {
      return acc + ((item.quantity || 0) * (item.price || 0));
    }, 0);

    const totalRecords = items.length + trashedItems.length;
    const healthRatio = totalRecords > 0
      ? Math.round((items.length / totalRecords) * 100)
      : 100;

    const lowStockCount = items.filter(i => (i.quantity || 0) <= (i.minThreshold || 5)).length;

    return {
      totalValuation,
      healthRatio,
      lowStockCount,
      totalSKUs: items.length,
      totalUnits: items.reduce((acc, item) => acc + (item.quantity || 0), 0)
    };
  }, [items, trashedItems]);

  return { ...stats, isLoading, error };
}