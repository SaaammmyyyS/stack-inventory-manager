import { useState, useCallback, useEffect, useRef } from "react";
import { InventorySummary, StockTransaction } from "../../../../types/inventory";
import { useInventory } from "@/hooks/useInventory";
import { toast } from "sonner";

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function useIntelligenceHub(tenantId: string, isPro: boolean) {
  const { api } = useInventory();
  const [activities, setActivities] = useState<StockTransaction[]>([]);
  const [analysis, setAnalysis] = useState<InventorySummary | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const isLoadingRef = useRef(false);

  const SESSION_KEY = `ai_unlocked_${tenantId}`;

  const handleRateLimitError = (error: any) => {
    const retryAfter = parseInt(error.response?.headers?.['retry-after']) || 60;
    const plan = error.response?.data?.plan || 'free';
    const limit = error.response?.data?.limit || 60;

    console.warn(`Rate limit exceeded for ${plan} plan (${limit} req/min). Retry in ${retryAfter}s`);

    toast.error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
  };

  const loadActivities = useCallback(
    debounce(async (dateRange?: any) => {
      console.log('loadActivities called with dateRange:', dateRange);

      if (isLoadingRef.current) {
        console.log('Skipping - already loading');
        return;
      }

      isLoadingRef.current = true;
      setIsActivityLoading(true);

      try {
        const params = new URLSearchParams();

        params.set('limit', '500');

        if (dateRange && dateRange.startDate && dateRange.endDate) {
          params.set('startDate', dateRange.startDate.toISOString());
          params.set('endDate', dateRange.endDate.toISOString());
        }

        console.log('Making API call to:', `/api/transactions/recent?${params}`);
        const { data } = await api.get(`/api/transactions/recent?${params}`);
        console.log('API response data length:', data?.length || 0);
        setActivities(data || []);
      } catch (error: any) {
        console.error('API call failed:', error);
        if (error.response?.status === 429) {
          handleRateLimitError(error);
        } else {
          // Activity fetch failed - using empty array as fallback
          console.error('Failed to load activities:', error);
        }
      } finally {
        isLoadingRef.current = false;
        setIsActivityLoading(false);
      }
    }, 500),
    [api]
  );

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
      if (e.response?.status !== 402 && !isAutoLoad) {
        toast.error("Failed to connect to Intelligence Service");
      }
    } finally {
      setIsAiLoading(false);
    }
  }, [api, isPro, isAiLoading, SESSION_KEY]);

  useEffect(() => {
    console.log('Initial loadActivities triggered');
    loadActivities();
  }, []);

  useEffect(() => {
    if (activities.length === 0 && !isActivityLoading && !isLoadingRef.current) {
      console.log('Retry loadActivities - no data and not loading');
      loadActivities();
    }
  }, [activities.length, isActivityLoading]);

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
