import { TransactionItem, ForecastItem, InventoryItem } from '@/types/chat';

export const isTransactionItem = (item: unknown): item is TransactionItem => {
  return typeof item === 'object' && item !== null &&
         ('itemId' in item || 'itemName' in item || 'itemname' in item);
};

export const isForecastItem = (item: unknown): item is ForecastItem => {
  return typeof item === 'object' && item !== null &&
         ('itemName' in item || 'name' in item || 'daysRemaining' in item);
};

export const isInventoryItem = (item: unknown): item is InventoryItem => {
  return typeof item === 'object' && item !== null &&
         'name' in item && 'quantity' in item;
};

export const isTransactionItemArray = (items: unknown): items is TransactionItem[] => {
  return Array.isArray(items) && items.every(isTransactionItem);
};

export const isForecastItemArray = (items: unknown): items is ForecastItem[] => {
  return Array.isArray(items) && items.every(isForecastItem);
};

export const isInventoryItemArray = (items: unknown): items is InventoryItem[] => {
  return Array.isArray(items) && items.every(isInventoryItem);
};
