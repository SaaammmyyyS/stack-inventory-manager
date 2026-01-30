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

export interface StockAIInsight {
  sku: string;
  itemName: string;
  currentQuantity: number;
  daysRemaining: number;
  predictedDepletionDate: string;
  healthStatus: 'STABLE' | 'WARNING' | 'CRITICAL' | 'OVERSTOCKED';
  confidenceScore: number;
}

export interface InventorySummary {
  status: string;
  summary: string;
  urgentActions: string[];
  healthScore: number;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}