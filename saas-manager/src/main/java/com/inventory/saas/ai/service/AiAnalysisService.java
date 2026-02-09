package com.inventory.saas.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import com.inventory.saas.service.BillingGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AiAnalysisService.class);

    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;
    private final InventoryRepository inventoryRepository;
    private final BillingGuard billingGuard;
    private final ObjectMapper objectMapper;

    public AiAnalysisService(ChatClient chatClient,
                             TransactionRepository transactionRepository,
                             InventoryRepository inventoryRepository,
                             BillingGuard billingGuard,
                             ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.transactionRepository = transactionRepository;
        this.inventoryRepository = inventoryRepository;
        this.billingGuard = billingGuard;
        this.objectMapper = objectMapper;
    }

    public List<StockAIInsightDTO> calculateAllItemForecasts(String tenantId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, thirtyDaysAgo);

        Pageable pageable = PageRequest.of(0, 1000);
        List<InventoryItem> allItems = inventoryRepository.findByTenantIdAndDeletedFalse(tenantId, pageable).getContent();

        Map<String, List<StockTransaction>> itemsMap = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .collect(Collectors.groupingBy(t -> t.getInventoryItem().getName()));

        return allItems.stream().map(item -> {
            String itemName = item.getName();
            List<StockTransaction> txs = itemsMap.get(itemName);

            long totalOut = 0;
            if (txs != null) {
                totalOut = txs.stream()
                        .filter(t -> t.getType() != null && t.getType().contains("OUT"))
                        .mapToLong(t -> Math.abs(t.getQuantityChange()))
                        .sum();
            }

            double dailyBurnRate = totalOut / 30.0;
            int currentQty = item.getQuantity() != null ? item.getQuantity() : 0;
            int daysRemaining = (dailyBurnRate > 0) ? (int) (currentQty / dailyBurnRate) : 99;

            int suggestedThreshold = (int) Math.ceil(dailyBurnRate * 14);
            if (suggestedThreshold < 5) suggestedThreshold = 5;

            String status = daysRemaining < 7 ? "CRITICAL" : (daysRemaining < 20 ? "WARNING" : "STABLE");

            String notes = (txs == null || txs.isEmpty()) ?
                    "No recent activity in last 30 days" :
                    "Calculated based on 30-day velocity.";

            return new StockAIInsightDTO(
                    itemName,
                    item.getSku() != null ? item.getSku() : "N/A",
                    currentQty,
                    daysRemaining,
                    LocalDate.now().plusDays(daysRemaining),
                    status,
                    suggestedThreshold,
                    notes
            );
        }).collect(Collectors.toList());
    }

    @Cacheable(value = "ai-analysis", key = "#tenantId")
    public InventorySummaryAnalysisDTO getGlobalAnalysis(String tenantId, String plan) {
        billingGuard.validateTokenBudget(tenantId, plan);

        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, ninetyDaysAgo);

        if (history.isEmpty()) {
            return createEmptyResponse("No transaction history found for analysis.");
        }

        String dataFeed = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .map(t -> String.format("- Item: %s | Action: %s | Qty: %d",
                        t.getInventoryItem().getName(),
                        t.getType(),
                        Math.abs(t.getQuantityChange())))
                .collect(Collectors.joining("\n"));

        try {
            ChatResponse response = chatClient.prompt()
                    .user("Analyze these stock movements and return JSON report. DATA:\n" + dataFeed)
                    .call()
                    .chatResponse();

            if (response != null && response.getMetadata().getUsage() != null) {
                billingGuard.updateTokenUsage(tenantId, response.getMetadata().getUsage().getTotalTokens());
            }

            String content = response.getResult().getOutput().getContent();
            logger.info("Raw AI response for tenant {}: {}", tenantId, content);

            if (content.contains("REPLACE_WITH") || content.contains("[REPLACE_") || content.contains("placeholder")) {
                logger.warn("AI returned placeholder response instead of using tool data for tenant {}", tenantId);
                return createEmptyResponse("AI analysis failed to process provided data. Please try again.");
            }

            String cleanedJson = extractJson(content);
            logger.info("Cleaned AI JSON for tenant {}: {}", tenantId, cleanedJson);

            JsonNode root = objectMapper.readTree(cleanedJson);
            if (!root.has("status") && !root.has("summary")) {
                logger.warn("AI response missing required fields for tenant {}", tenantId);
                return createEmptyResponse("AI response format is invalid. Please try again.");
            }

            InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();

            dto.setStatus(root.path("status").asText("Warning"));
            dto.setSummary(root.path("summary").asText("Analysis complete."));

            List<String> actions = new ArrayList<>();
            if (root.has("urgentActions") && root.get("urgentActions").isArray()) {
                root.get("urgentActions").forEach(node -> actions.add(node.asText()));
            } else {
                actions.add("Continue monitoring stock levels");
            }
            dto.setUrgentActions(actions);

            JsonNode scoreNode = root.path("healthScore");
            if (scoreNode.isNumber()) {
                dto.setHealthScore(scoreNode.asInt());
            } else if (scoreNode.isObject()) {
                dto.setHealthScore(scoreNode.path("value").asInt(75));
            } else {
                dto.setHealthScore(75);
            }

            if (root.has("data") && root.get("data").isArray()) {
                List<Map<String, Object>> data = new ArrayList<>();
                root.get("data").forEach(node -> {
                    try {
                        data.add(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {}));
                    } catch (Exception e) {
                        logger.warn("Failed to convert data node: {}", e.getMessage());
                    }
                });
                dto.setData(data);
            }

            if (root.has("analysis") && root.get("analysis").isArray()) {
                List<Map<String, Object>> analysis = new ArrayList<>();
                root.get("analysis").forEach(node -> {
                    try {
                        analysis.add(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {}));
                    } catch (Exception e) {
                        logger.warn("Failed to convert analysis node: {}", e.getMessage());
                    }
                });
                dto.setAnalysis(analysis);
            }

            return dto;

        } catch (Exception e) {
            logger.error("AI Error for tenant {}: {}", tenantId, e.getMessage(), e);
            return createEmptyResponse("AI analysis failed to process. Ensure data is valid.");
        }
    }

    private String extractJson(String content) {
        if (content == null) return "{}";

        String cleaned = content.replaceAll("```json", "").replaceAll("```", "").trim();

        cleaned = cleaned.replaceAll("//.*", "");
        cleaned = cleaned.replaceAll("/\\*.*?\\*/", "");

        int start = cleaned.indexOf("{");
        int end = cleaned.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            return cleaned.substring(start, end + 1);
        }

        logger.warn("Could not extract valid JSON from AI response: {}", content);
        return "{}";
    }

    private InventorySummaryAnalysisDTO createEmptyResponse(String message) {
        InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();
        dto.setStatus("Warning");
        dto.setSummary(message);
        dto.setUrgentActions(List.of("Record more stock transactions to enable AI insights"));
        dto.setHealthScore(0);
        return dto;
    }
}
