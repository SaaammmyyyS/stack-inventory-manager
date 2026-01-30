import { InventorySummary, InventoryForecast } from '../types/inventory';

export const useDashboardStats = () => {
  const mockSummary: InventorySummary = {
    status: "CRITICAL",
    summary: "High sales velocity detected in Electronics. 3 items are projected to hit zero stock within 72 hours. Aggregate warehouse health is declining due to MacBook Pro demand.",
    urgentActions: ["Restock SKU: LAP-MBP-14", "Review Sony Audio levels", "Approve pending PO #442"],
    healthScore: 68
  };

  const mockForecasts: InventoryForecast[] = [
    {
      sku: "LAP-MBP-14",
      itemName: "MacBook Pro 14",
      currentStock: 2,
      recommendation: "Order 15 Units",
      reasoning: "Stock will be depleted in 2 days based on average daily sales of 1.2 units.",
      predictedDaysUntilOut: 2
    },
    {
      sku: "AUD-SNY-XM5",
      itemName: "Sony WH-1000XM5",
      currentStock: 1,
      recommendation: "Order 5 Units",
      reasoning: "Low stock alert. Current velocity suggests depletion by tomorrow evening.",
      predictedDaysUntilOut: 1
    }
  ];

  return { summary: mockSummary, forecasts: mockForecasts, isLoading: false };
};