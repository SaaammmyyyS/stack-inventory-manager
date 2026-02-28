import { StockVelocityChart } from "../StockVelocityChart";
import { ActivityFeed } from "./ActivityFeed";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { useIntelligenceHub } from "./hooks/useIntelligenceHub";
import { IntelligenceHubProps } from "./types";
import { DateRange } from "../StockVelocityChart/types";
import { useCallback } from "react";

export function IntelligenceHub({ tenantId, isPro }: IntelligenceHubProps) {
  const {
    activities,
    analysis,
    isActivityLoading,
    isAiLoading,
    activeTab,
    setActiveTab,
    runAnalysis,
    loadActivities
  } = useIntelligenceHub(tenantId, isPro);

  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    console.log('handleDateRangeChange called with:', dateRange);
    loadActivities(dateRange);
  }, [loadActivities]);

  return (
    <div className="space-y-6">

      <AIAnalysisPanel
        analysis={analysis}
        isLoading={isAiLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRunAnalysis={() => runAnalysis(false)}
        isPro={isPro}
        tenantId={tenantId}
      />

      <StockVelocityChart
        transactions={activities}
        onDateRangeChange={handleDateRangeChange}
      />

      <ActivityFeed activities={activities} isLoading={isActivityLoading} />

    </div>
  );
}
