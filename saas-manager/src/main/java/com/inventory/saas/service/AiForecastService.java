package com.inventory.saas.service;

import com.inventory.saas.ai.service.AiAnalysisService;
import com.inventory.saas.ai.service.AiChatService;
import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiForecastService {

    private final AiAnalysisService aiAnalysisService;
    private final AiChatService aiChatService;

    public AiForecastService(AiAnalysisService aiAnalysisService, AiChatService aiChatService) {
        this.aiAnalysisService = aiAnalysisService;
        this.aiChatService = aiChatService;
    }

    public List<StockAIInsightDTO> calculateAllItemForecasts(String tenantId) {
        return aiAnalysisService.calculateAllItemForecasts(tenantId);
    }

    @Cacheable(value = "ai-analysis", key = "#tenantId")
    public InventorySummaryAnalysisDTO getGlobalAnalysis(String tenantId, String plan) {
        return aiAnalysisService.getGlobalAnalysis(tenantId, plan);
    }

    public String chat(String tenantId, String userMessage) {
        return aiChatService.chat(tenantId, userMessage);
    }
}