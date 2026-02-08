package com.inventory.saas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiForecastService {

    private static final Logger logger = LoggerFactory.getLogger(AiForecastService.class);
    private final ChatClient chatClient;
    private final ChatClient simpleChatClient;
    private final TransactionRepository transactionRepository;
    private final InventoryRepository inventoryRepository;
    private final BillingGuard billingGuard;
    private final ObjectMapper objectMapper;

    public AiForecastService(ChatClient chatClient,
                             @Qualifier("simpleChatClient") ChatClient simpleChatClient,
                             TransactionRepository transactionRepository,
                             InventoryRepository inventoryRepository,
                             BillingGuard billingGuard,
                             ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.simpleChatClient = simpleChatClient;
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
                        data.add(objectMapper.convertValue(node, Map.class));
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
                        analysis.add(objectMapper.convertValue(node, Map.class));
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

    private String buildRecentTransactionsJsonFilteredByItemName(String tenantId, String itemNameFilter) throws Exception {
        List<Map<String, Object>> raw = transactionRepository.findRecentTransactionsRaw(tenantId);
        String filter = itemNameFilter != null ? itemNameFilter.trim().toLowerCase() : "";

        List<Map<String, Object>> data = raw.stream()
                .filter(row -> row != null)
                .filter(row -> {
                    if (filter.isEmpty()) return true;
                    Object itemName = row.get("itemName");
                    return itemName != null && itemName.toString().toLowerCase().contains(filter);
                })
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    Object id = row.get("id");
                    Object itemName = row.get("itemName");
                    Object type = row.get("type");
                    Object qtyChange = row.get("quantityChange");
                    Object reason = row.get("reason");
                    Object performedBy = row.get("performedBy");
                    Object createdAt = row.get("createdAt");

                    m.put("id", id != null ? id.toString() : null);
                    m.put("itemName", itemName);
                    m.put("type", type);

                    int qc = 0;
                    if (qtyChange instanceof Number n) {
                        qc = n.intValue();
                    }
                    m.put("quantityChange", qc);
                    m.put("amount", Math.abs(qc));

                    m.put("reason", reason);
                    m.put("performedBy", performedBy);
                    m.put("createdAt", createdAt != null ? createdAt.toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        if (!filter.isEmpty()) {
            result.put("summary", data.isEmpty() ? "No transactions found for '" + itemNameFilter + "'." : "Transactions for '" + itemNameFilter + "':");
        } else {
            result.put("summary", data.isEmpty() ? "No recent transactions found." : "Here are the recent stock movements:");
        }
        result.put("data", data);
        result.put("total", data.size());

        return objectMapper.writeValueAsString(result);
    }

    private String buildRecentTransactionsJsonFilteredByPerformedBy(String tenantId, String performedByFilter) throws Exception {
        List<Map<String, Object>> raw = transactionRepository.findRecentTransactionsRaw(tenantId);
        String filter = performedByFilter != null ? performedByFilter.trim().toLowerCase() : "";

        List<Map<String, Object>> data = raw.stream()
                .filter(row -> row != null)
                .filter(row -> {
                    if (filter.isEmpty()) return true;
                    Object performedBy = row.get("performedBy");
                    return performedBy != null && performedBy.toString().toLowerCase().contains(filter);
                })
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    Object id = row.get("id");
                    Object itemName = row.get("itemName");
                    Object type = row.get("type");
                    Object qtyChange = row.get("quantityChange");
                    Object reason = row.get("reason");
                    Object performedBy = row.get("performedBy");
                    Object createdAt = row.get("createdAt");

                    m.put("id", id != null ? id.toString() : null);
                    m.put("itemName", itemName);
                    m.put("type", type);

                    int qc = 0;
                    if (qtyChange instanceof Number n) {
                        qc = n.intValue();
                    }
                    m.put("quantityChange", qc);
                    m.put("amount", Math.abs(qc));

                    m.put("reason", reason);
                    m.put("performedBy", performedBy);
                    m.put("createdAt", createdAt != null ? createdAt.toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        if (!filter.isEmpty()) {
            result.put("summary", data.isEmpty() ? "No transactions found performed by '" + performedByFilter + "'." : "Transactions performed by '" + performedByFilter + "':");
        } else {
            result.put("summary", data.isEmpty() ? "No recent transactions found." : "Here are the recent stock movements:");
        }
        result.put("data", data);
        result.put("total", data.size());

        return objectMapper.writeValueAsString(result);
    }

    private String buildRecentTransactionsJson(String tenantId) throws Exception {
        return buildRecentTransactionsJsonFilteredByItemName(tenantId, null);
    }

    private String buildStockSummaryJson(String tenantId) throws Exception {
        Pageable pageable = PageRequest.of(0, 100);
        List<InventoryItem> items = inventoryRepository.findByTenantIdAndDeletedFalse(tenantId, pageable).getContent();

        List<Map<String, Object>> payloadItems = items.stream()
                .map(item -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", item.getId() != null ? item.getId().toString() : null);
                    m.put("name", item.getName());
                    m.put("sku", item.getSku());
                    m.put("quantity", item.getQuantity() != null ? item.getQuantity() : 0);
                    m.put("minThreshold", item.getMinThreshold());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("summary", payloadItems.isEmpty() ? "No inventory items found." : "Current inventory status:");
        result.put("items", payloadItems);
        result.put("total", payloadItems.size());

        return objectMapper.writeValueAsString(result);
    }

    private String buildLowStockSummaryJson(String tenantId) throws Exception {
        Pageable pageable = PageRequest.of(0, 100);
        List<InventoryItem> items = inventoryRepository.findByTenantIdAndDeletedFalse(tenantId, pageable).getContent();

        List<Map<String, Object>> payloadItems = items.stream()
                .filter(item -> {
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    int threshold = item.getMinThreshold() != null ? item.getMinThreshold() : 0;
                    return qty <= threshold;
                })
                .map(item -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", item.getId() != null ? item.getId().toString() : null);
                    m.put("name", item.getName());
                    m.put("sku", item.getSku());
                    m.put("quantity", item.getQuantity() != null ? item.getQuantity() : 0);
                    m.put("minThreshold", item.getMinThreshold());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("summary", payloadItems.isEmpty() ? "No items need restocking." : "Items that need restocking soon:");
        result.put("items", payloadItems);
        result.put("total", payloadItems.size());

        return objectMapper.writeValueAsString(result);
    }

    public String chat(String tenantId, String userMessage) {
        if (tenantId == null || userMessage == null || userMessage.isBlank()) {
            return "Please provide a non-empty message.";
        }

        Map<String, String> entities = extractBasicEntities(userMessage);
        String intent = classifyBasicIntent(userMessage);
        logger.info("Detected intent: {} with entities: {} for tenant: {}", intent, entities, tenantId);

        if ("filtered_transactions".equals(intent)) {
            try {
                String filterType = entities.get("filterType");
                String filterValue = entities.get("filterValue");
                String toolJson;
                if ("performedBy".equals(filterType)) {
                    toolJson = buildRecentTransactionsJsonFilteredByPerformedBy(tenantId, filterValue);
                } else {
                    toolJson = buildRecentTransactionsJsonFilteredByItemName(tenantId, filterValue);
                }
                return "```json\n" + toolJson + "\n```";
            } catch (Exception e) {
                logger.warn("Filtered transactions deterministic path failed for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        if ("recent_transactions".equals(intent)) {
            try {
                String toolJson = buildRecentTransactionsJson(tenantId);
                return "```json\n" + toolJson + "\n```";
            } catch (Exception e) {
                logger.warn("Recent transactions deterministic path failed for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        if ("stock_summary".equals(intent)) {
            try {
                String toolJson = buildStockSummaryJson(tenantId);
                return "```json\n" + toolJson + "\n```";
            } catch (Exception e) {
                logger.warn("Stock summary deterministic path failed for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        if ("low_stock".equals(intent)) {
            try {
                String toolJson = buildLowStockSummaryJson(tenantId);
                return "```json\n" + toolJson + "\n```";
            } catch (Exception e) {
                logger.warn("Low stock deterministic path failed for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        if (isBasicChatQuery(userMessage)) {
            try {
                String content = simpleChatClient.prompt()
                        .user(userMessage)
                        .call()
                        .content();
                return formatChatResponse(content);
            } catch (Exception e) {
                logger.warn("Simple chat failed for tenant {}: {}", tenantId, e.getMessage());
            }
        }

        try {
            String enhancedPrompt = userMessage;
            if (!entities.isEmpty()) {
                enhancedPrompt += "\n\nImportant: Respect these specific constraints from the user's query: " + entities;
            }

            String content = chatClient.prompt()
                    .user(enhancedPrompt)
                    .call()
                    .content();
            return formatChatResponse(content);
        } catch (Exception e) {
            logger.warn("Primary chat client failed for tenant {}, trying fallback: {}", tenantId, e.getMessage());
            try {
                String content = simpleChatClient.prompt()
                        .user(userMessage)
                        .call()
                        .content();
                return formatChatResponse(content);
            } catch (Exception fallbackError) {
                logger.error("Both chat clients failed for tenant {}: {}", tenantId, fallbackError.getMessage(), fallbackError);
                return "Sorry, I'm currently unavailable. Please try again later or contact support if the issue persists.";
            }
        }
    }

    private Map<String, String> extractBasicEntities(String userMessage) {
        Map<String, String> entities = new HashMap<>();
        String m = userMessage.toLowerCase();

        Pattern byPattern = Pattern.compile("\\bby\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,3})");
        Matcher byMatcher = byPattern.matcher(userMessage);
        if (byMatcher.find()) {
            entities.put("filterType", "performedBy");
            entities.put("filterValue", byMatcher.group(1));
            entities.put("personName", byMatcher.group(1));
        } else {
            Pattern forOfPattern = Pattern.compile("\\b(?:for|of)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,3})");
            Matcher forOfMatcher = forOfPattern.matcher(userMessage);
            if (forOfMatcher.find()) {
                entities.put("filterType", "itemName");
                entities.put("filterValue", forOfMatcher.group(1));
            }
        }

        String[] words = userMessage.split("\\s+");
        for (String word : words) {
            if (word.length() <= 2 || !Character.isUpperCase(word.charAt(0))) continue;
            String cleaned = word.replaceAll("[^A-Za-z]", "");
            if (cleaned.isBlank()) continue;

            String lower = cleaned.toLowerCase();
            if ("transactions".equals(lower) || "transaction".equals(lower) || "history".equals(lower) ||
                    "show".equals(lower) || "stock".equals(lower) || "levels".equals(lower) || "movements".equals(lower)) {
                continue;
            }

            if (!entities.containsKey("filterValue")) {
                entities.put("filterType", "itemName");
                entities.put("filterValue", cleaned);
            }
            if (!entities.containsKey("itemName") || cleaned.length() > entities.get("itemName").length()) {
                entities.put("itemName", cleaned);
            }
        }

        return entities;
    }

    private String classifyBasicIntent(String userMessage) {
        String m = userMessage.toLowerCase();

        if ((m.contains("transaction") || m.contains("transactions") || m.contains("history")) && (m.contains(" for ") || m.contains(" of ") || m.contains(" by "))) {
            return "filtered_transactions";
        }

        if (m.contains("stock level") || m.contains("stock levels") || m.contains("stock") || m.contains("inventory") || m.contains("in stock") || m.contains("what do i have")) {
            return "stock_summary";
        }

        if (m.contains("recent") || m.contains("recent movements") || m.contains("movements") || m.contains("activity")) {
            return "recent_transactions";
        }

        if (m.contains("low stock") || m.contains("restock") || m.contains("restocking")) {
            return "low_stock";
        }

        if (m.contains("forecast") || m.contains("runout") || m.contains("run out")) {
            return "forecast_queries";
        }

        return "other";
    }

    private String formatChatResponse(String content) {
        if (content == null) return "No response available.";

        if (content.contains("```json") || content.contains("```")) {
            try {
                String jsonContent = content.replaceAll("```json", "").replaceAll("```", "").trim();

                JsonNode jsonNode = objectMapper.readTree(jsonContent);

                if (jsonNode.has("data") && jsonNode.get("data").isArray()) {
                    return formatTransactionData(jsonNode.get("data"));
                } else if (jsonNode.has("items") && jsonNode.get("items").isArray()) {
                    return formatInventoryData(jsonNode.get("items"));
                } else if (jsonNode.has("status") || jsonNode.has("summary")) {
                    return formatForecastResponse(jsonNode);
                }
            } catch (Exception e) {
                logger.debug("Could not parse response as JSON, treating as plain text: {}", e.getMessage());
            }
        }

        String cleaned = content.replaceAll("```json", "").replaceAll("```", "").trim();

        if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
            return extractNaturalLanguageFromJson(cleaned);
        }

        return cleaned;
    }

    private String formatTransactionData(JsonNode data) {
        StringBuilder sb = new StringBuilder();
        sb.append("Here are the recent stock movements:\n\n");

        for (JsonNode item : data) {
            String itemName = item.path("itemName").asText("Unknown Item");
            String type = item.path("type").asText("Unknown");
            int amount = item.path("amount").asInt(0);
            String performedBy = item.path("performedBy").asText("Unknown");

            sb.append(String.format("• %s: %s %d units by %s\n",
                itemName,
                type.equals("STOCK_IN") ? "added" : "removed",
                amount,
                performedBy));
        }

        return sb.toString();
    }

    private String formatInventoryData(JsonNode items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Current inventory status:\n\n");

        for (JsonNode item : items) {
            String name = item.path("name").asText("Unknown");
            int quantity = item.path("quantity").asInt(0);
            int threshold = item.path("minThreshold").asInt(0);
            String sku = item.path("sku").asText("N/A");

            String status = quantity <= threshold ? "⚠️ Low stock" : "✅ In stock";
            sb.append(String.format("• %s (%s): %d units %s\n", name, sku, quantity, status));
        }

        return sb.toString();
    }

    private String formatForecastResponse(JsonNode json) {
        StringBuilder sb = new StringBuilder();

        if (json.has("summary")) {
            sb.append(json.get("summary").asText()).append("\n\n");
        }

        if (json.has("urgentActions") && json.get("urgentActions").isArray()) {
            sb.append("Urgent Actions:\n");
            for (JsonNode action : json.get("urgentActions")) {
                sb.append("• ").append(action.asText()).append("\n");
            }
            sb.append("\n");
        }

        if (json.has("healthScore")) {
            int score = json.get("healthScore").asInt();
            String status = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
            sb.append(String.format("Overall Health: %d/100 (%s)\n", score, status));
        }

        return sb.toString();
    }

    private String extractNaturalLanguageFromJson(String json) {
        if (json.contains("itemName") && json.contains("type")) {
            return "I found recent stock movements but had trouble formatting them. Please try asking again.";
        }
        if (json.contains("name") && json.contains("quantity")) {
            return "I found inventory data but had trouble formatting it. Please try asking again.";
        }
        return json;
    }

    private boolean isBasicChatQuery(String message) {
        String lowerMessage = message.toLowerCase();
        String[] basicKeywords = {
            "hello", "hi", "hey", "thanks", "thank you", "bye", "goodbye",
            "how are you", "what's your name", "who are you", "help", "explain"
        };

        for (String keyword : basicKeywords) {
            if (lowerMessage.contains(keyword)) {
                return true;
            }
        }

        String[] inventoryKeywords = {
            "inventory", "stock", "item", "product", "quantity", "forecast",
            "report", "transaction", "movement", "sku", "category", "threshold"
        };

        for (String keyword : inventoryKeywords) {
            if (lowerMessage.contains(keyword)) {
                return false; // Needs tools
            }
        }

        return true;
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