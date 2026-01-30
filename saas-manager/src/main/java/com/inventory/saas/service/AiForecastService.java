package com.inventory.saas.service;

import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiForecastService {

    private static final Logger logger = LoggerFactory.getLogger(AiForecastService.class);
    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;

    public AiForecastService(ChatClient.Builder chatClientBuilder, TransactionRepository transactionRepository) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are a Senior Supply Chain Consultant. " +
                        "Analyze the transaction ledger and provide a professional executive report. " +
                        "Focus on Inventory Health and Threshold Optimization. " +
                        "1. status: 'Healthy', 'Warning', or 'Critical'. " +
                        "2. summary: 2-3 sentences of meaningful business insight. " +
                        "3. urgentActions: 3 specific recommendations (e.g., 'Increase threshold for high-velocity items'). " +
                        "4. healthScore: Integer 0-100. " +
                        "Output ONLY valid JSON.")
                .build();
        this.transactionRepository = transactionRepository;
    }

    public List<StockAIInsightDTO> calculateAllItemForecasts(String tenantId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, thirtyDaysAgo);

        Map<String, List<StockTransaction>> itemsMap = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .collect(Collectors.groupingBy(t -> t.getInventoryItem().getName()));

        return itemsMap.entrySet().stream().map(entry -> {
            String name = entry.getKey();
            List<StockTransaction> txs = entry.getValue();
            var item = txs.get(0).getInventoryItem();

            long totalOut = txs.stream()
                    .filter(t -> t.getType() != null && t.getType().toString().contains("OUT"))
                    .mapToLong(t -> Math.abs(t.getQuantityChange()))
                    .sum();

            double dailyBurnRate = totalOut / 30.0;
            int currentQty = item.getQuantity() != null ? item.getQuantity() : 0;
            int daysRemaining = (dailyBurnRate > 0) ? (int) (currentQty / dailyBurnRate) : 99;

            int suggestedThreshold = (int) Math.ceil(dailyBurnRate * 14);
            if (suggestedThreshold < 5) suggestedThreshold = 5;

            int currentThreshold = item.getMinThreshold() != null ? item.getMinThreshold() : 0;
            String thresholdReason = "Optimal threshold is " + suggestedThreshold + " units (14-day buffer).";

            if (currentThreshold < suggestedThreshold) {
                thresholdReason = "⚠️ Threshold too low! Increase to " + suggestedThreshold + " to avoid stockouts.";
            }

            String status = "STABLE";
            if (daysRemaining < 7) status = "CRITICAL";
            else if (daysRemaining < 20) status = "WARNING";

            return new StockAIInsightDTO(
                    name,
                    item.getSku() != null ? item.getSku() : "N/A",
                    currentQty,
                    daysRemaining,
                    LocalDate.now().plusDays(daysRemaining),
                    status,
                    suggestedThreshold,
                    thresholdReason
            );
        }).collect(Collectors.toList());
    }

    public InventorySummaryAnalysisDTO getGlobalAnalysis(String tenantId) {
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, sixtyDaysAgo);

        if (history.isEmpty()) {
            return createEmptyResponse("No transaction history found to analyze.");
        }

        String dataFeed = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .map(t -> String.format("- %s: %s (%d units). Current Threshold: %d",
                        t.getInventoryItem().getName(),
                        t.getType(),
                        Math.abs(t.getQuantityChange()),
                        t.getInventoryItem().getMinThreshold() != null
                                ? t.getInventoryItem().getMinThreshold() : 0))
                .collect(Collectors.joining("\n"));
        try {
            return chatClient.prompt()
                    .user("Analyze velocity and suggest threshold adjustments:\n" + dataFeed)
                    .options(OllamaOptions.builder()
                            .format("json")
                            .temperature(0.7)
                            .build())
                    .call()
                    .entity(InventorySummaryAnalysisDTO.class);
        } catch (Exception e) {
            logger.error("AI Error: {}", e.getMessage());
            return createEmptyResponse("AI is currently unavailable: " + e.getLocalizedMessage());
        }
    }

    private InventorySummaryAnalysisDTO createEmptyResponse(String message) {
        InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();
        dto.setStatus("Warning");
        dto.setSummary(message);
        dto.setUrgentActions(List.of("Check data sync"));
        dto.setHealthScore(0);
        return dto;
    }
}