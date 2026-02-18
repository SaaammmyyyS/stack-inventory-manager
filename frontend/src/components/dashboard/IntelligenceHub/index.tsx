import { StockVelocityChart } from "../StockVelocityChart";
import { ActivityFeed } from "./ActivityFeed";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { useIntelligenceHub } from "./hooks/useIntelligenceHub";
import { IntelligenceHubProps } from "./types";

export function IntelligenceHub({ tenantId, isPro }: IntelligenceHubProps) {
  const {
    activities,
    analysis,
    isActivityLoading,
    isAiLoading,
    activeTab,
    setActiveTab,
    runAnalysis
  } = useIntelligenceHub(tenantId, isPro);

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

      <StockVelocityChart transactions={activities} />

      <ActivityFeed activities={activities} isLoading={isActivityLoading} />

    </div>
  );
}
