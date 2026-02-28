import { InventorySummary, StockTransaction } from "@/types/inventory";

export interface IntelligenceHubProps {
  tenantId: string;
  isPro: boolean;
  plan?: string;
}

export interface UseIntelligenceHubReturn {
  activities: StockTransaction[];
  analysis: InventorySummary | null;
  isActivityLoading: boolean;
  isAiLoading: boolean;
  activeTab: string;
  loadActivities: () => Promise<void>;
  runAnalysis: (isAutoLoad?: boolean) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export interface OverviewCardProps {
  analysis: InventorySummary;
}

export interface ActivityFeedProps {
  activities: StockTransaction[];
  isLoading: boolean;
}

export interface AIAnalysisPanelProps {
  analysis: InventorySummary | null;
  isLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRunAnalysis: () => void;
  isPro: boolean;
  tenantId: string;
}
