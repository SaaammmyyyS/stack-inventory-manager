import { TransactionItem, ForecastItem } from '@/types/chat';

export const normalizeTransactionItem = (item: any): TransactionItem => {
  return {
    ...item,
    itemId: item.itemId || item.itemname,
    itemName: item.itemName || item.itemname,
    performedBy: item.performedBy || item.performedby,
    amount: item.amount || item.quantitychange,
    createdAt: item.createdAt || item.createdat,
    type: item.type,
    reason: item.reason,
    id: item.id
  };
};

export const normalizeForecastItem = (item: any): ForecastItem => {
  return {
    ...item,
    itemName: item.itemName || item.name,
    daysRemaining: item.daysRemaining || item.days_remaining,
    currentQuantity: item.currentQuantity || item.current_quantity,
    healthStatus: item.healthStatus || item.health_status,
    suggestedThreshold: item.suggestedThreshold || item.suggested_threshold,
    sku: item.sku,
    runoutDate: item.runoutDate
  };
};

export const normalizeTransactionItems = (items: any[]): TransactionItem[] => {
  return items.map(normalizeTransactionItem);
};

export const normalizeForecastItems = (items: any[]): ForecastItem[] => {
  return items.map(normalizeForecastItem);
};

export const normalizeChatData = (data: unknown, type: 'transactions' | 'forecast' | 'inventory'): unknown => {
  if (!Array.isArray(data)) return data;

  switch (type) {
    case 'transactions':
      return normalizeTransactionItems(data);
    case 'forecast':
      return normalizeForecastItems(data);
    case 'inventory':
      return data;
    default:
      return data;
  }
};
