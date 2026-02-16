import { useState, useCallback, useEffect } from "react";
import { InventorySummary, StockTransaction } from "../../../../types/inventory";
import { useInventory } from "@/hooks/useInventory";
import { toast } from "sonner";

export function useIntelligenceHub(tenantId: string, isPro: boolean) {
  const { api } = useInventory();
  const [activities, setActivities] = useState<StockTransaction[]>([]);
  const [analysis, setAnalysis] = useState<InventorySummary | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const SESSION_KEY = `ai_unlocked_${tenantId}`;

  const loadActivities = useCallback(async () => {
    setIsActivityLoading(true);
    try {
      const { data } = await api.get(`/api/transactions/recent`);
      setActivities(data || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsActivityLoading(false);
    }
  }, [api]);

  const runAnalysis = useCallback(async (isAutoLoad = false) => {
    if (!isPro || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const { data } = await api.get('/api/v1/forecast/summary');
      setAnalysis(data);

      sessionStorage.setItem(SESSION_KEY, "true");

      if (!isAutoLoad) {
        toast.success("Intelligence report generated");
      }
    } catch (e: any) {
      console.error('AI Error:', e);
      if (e.response?.status !== 402 && !isAutoLoad) {
        toast.error("Failed to connect to Intelligence Service");
      }
    } finally {
      setIsAiLoading(false);
    }
  }, [api, isPro, isAiLoading, SESSION_KEY]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    const wasUnlocked = sessionStorage.getItem(SESSION_KEY);

    if (isPro && wasUnlocked === "true" && !analysis) {
      runAnalysis(true);
    }
  }, [isPro, runAnalysis, SESSION_KEY, analysis]);

  return {
    activities,
    analysis,
    isActivityLoading,
    isAiLoading,
    activeTab,
    loadActivities,
    runAnalysis,
    setActiveTab
  };
}
