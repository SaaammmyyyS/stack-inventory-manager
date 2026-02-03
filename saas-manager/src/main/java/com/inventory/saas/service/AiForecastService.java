package com.inventory.saas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiForecastService {

    private static final Logger logger = LoggerFactory.getLogger(AiForecastService.class);
    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;
    private final BillingGuard billingGuard;
    private final ObjectMapper objectMapper;

    public AiForecastService(ChatClient.Builder chatClientBuilder,
                             TransactionRepository transactionRepository,
                             BillingGuard billingGuard,
                             ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are a Senior Supply Chain Consultant. " +
                        "Analyze transaction data and provide a JSON executive report. " +
                        "REQUIRED JSON STRUCTURE:\n" +
                        "{\n" +
                        "  \"status\": \"Healthy\" | \"Warning\" | \"Critical\",\n" +
                        "  \"summary\": \"2-3 sentences explaining the state.\",\n" +
                        "  \"urgentActions\": [\"Action 1\", \"Action 2\"],\n" +
                        "  \"healthScore\": 85\n" +
                        "}\n" +
                        "IMPORTANT: healthScore must be a naked INTEGER (0-100). " +
                        "Output ONLY valid JSON.")
                .build();
        this.transactionRepository = transactionRepository;
        this.billingGuard = billingGuard;
        this.objectMapper = objectMapper;
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
                    .filter(t -> t.getType() != null && t.getType().contains("OUT"))
                    .mapToLong(t -> Math.abs(t.getQuantityChange()))
                    .sum();

            double dailyBurnRate = totalOut / 30.0;
            int currentQty = item.getQuantity() != null ? item.getQuantity() : 0;
            int daysRemaining = (dailyBurnRate > 0) ? (int) (currentQty / dailyBurnRate) : 99;

            int suggestedThreshold = (int) Math.ceil(dailyBurnRate * 14);
            if (suggestedThreshold < 5) suggestedThreshold = 5;

            String status = daysRemaining < 7 ? "CRITICAL" : (daysRemaining < 20 ? "WARNING" : "STABLE");

            return new StockAIInsightDTO(
                    name,
                    item.getSku() != null ? item.getSku() : "N/A",
                    currentQty,
                    daysRemaining,
                    LocalDate.now().plusDays(daysRemaining),
                    status,
                    suggestedThreshold,
                    "Calculated based on 30-day velocity."
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
                    .user("Analyze these stock movements and provide the executive JSON report:\n" + dataFeed)
                    .options(OllamaOptions.builder()
                            .format("json")
                            .temperature(0.1)
                            .build())
                    .call()
                    .chatResponse();

            if (response != null && response.getMetadata().getUsage() != null) {
                billingGuard.updateTokenUsage(tenantId, response.getMetadata().getUsage().getTotalTokens());
            }

            String content = response.getResult().getOutput().getContent();
            String cleanedJson = content.replaceAll("```json", "").replaceAll("```", "").trim();

            logger.info("AI raw output for tenant {}: {}", tenantId, cleanedJson);

            JsonNode root = objectMapper.readTree(cleanedJson);
            InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();

            dto.setStatus(root.path("status").asText("Warning"));
            dto.setSummary(root.path("summary").asText("Analysis complete."));

            if (root.has("urgentActions") && root.get("urgentActions").isArray()) {
                List<String> actions = new ArrayList<>();
                root.get("urgentActions").forEach(node -> actions.add(node.asText()));
                dto.setUrgentActions(actions);
            } else {
                dto.setUrgentActions(List.of("Continue monitoring stock levels"));
            }

            JsonNode scoreNode = root.path("healthScore");
            if (scoreNode.isObject()) {
                dto.setHealthScore(scoreNode.path("value").asInt(scoreNode.path("score").asInt(50)));
            } else {
                dto.setHealthScore(scoreNode.asInt(50));
            }

            return dto;

        } catch (Exception e) {
            logger.error("AI Analysis Failed for tenant {}: {}", tenantId, e.getMessage());
            return createEmptyResponse("AI unavailable or returned invalid data format.");
        }
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