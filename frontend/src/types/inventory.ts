export interface TrashBinItem extends InventoryItem {
  deletedAt: string;
  deletedBy?: string;
  deletionReason?: string;
  [key: string]: unknown;
}

export interface ForecastInsight extends StockAIInsight {
  // Additional forecast-specific properties can be added here
}

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
  healthStatus: 'GOOD' | 'CRITICAL' | 'CAUTION' | 'STABLE' | 'WARNING' | 'OVERSTOCKED';
  suggestedThreshold?: number;
  thresholdReason?: string;
}

export interface InventorySummary {
  status: string;
  summary: string;
  urgentActions: string[];
  healthScore: number;
  data?: Array<{
    type: string;
    value: string;
    description: string;
  }>;
  analysis?: Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
}

export interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}