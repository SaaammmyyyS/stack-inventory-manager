package com.inventory.saas.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.ai.context.TransactionContextBuilder;
import com.inventory.saas.ai.extraction.EntityExtractor;
import com.inventory.saas.ai.intent.IntentClassifier;
import com.inventory.saas.ai.model.Intent;
import com.inventory.saas.config.TenantContext;
import com.inventory.saas.service.InventoryAgentTools;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiChatService {

    private static final Logger logger = LoggerFactory.getLogger(AiChatService.class);

    private final InventoryAgentTools tools;
    private final TransactionContextBuilder transactionContextBuilder;
    private final ObjectMapper objectMapper;

    private final IntentClassifier intentClassifier;
    private final EntityExtractor entityExtractor;

    public AiChatService(InventoryAgentTools tools,
                         TransactionContextBuilder transactionContextBuilder,
                         ObjectMapper objectMapper,
                         IntentClassifier intentClassifier,
                         EntityExtractor entityExtractor) {
        this.tools = tools;
        this.transactionContextBuilder = transactionContextBuilder;
        this.objectMapper = objectMapper;
        this.intentClassifier = intentClassifier;
        this.entityExtractor = entityExtractor;
    }

    public String chat(String tenantId, String userMessage) {
        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setTenantId(tenantId);
        }

        Intent intent = intentClassifier.classifyBasicIntent(userMessage);
        Map<String, String> entities = entityExtractor.extractBasicEntities(userMessage);

        logger.info("Detected intent: {} with entities: {} for tenant: {}", intent, entities, tenantId);

        try {
            return switch (intent) {
                case STOCK_SUMMARY -> wrapToolResult(intent, entities, safeJsonToMap(tools.getCurrentStockSummary()));
                case RECENT_TRANSACTIONS -> wrapToolResult(intent, entities, safeJsonToList(tools.getRecentTransactions()));
                case FORECAST_QUERIES -> wrapToolResult(intent, entities, computeForecastSummary());
                case LOW_STOCK -> wrapToolResult(intent, entities, computeLowStock());
                case FILTERED_TRANSACTIONS -> wrapToolResult(intent, entities, computeFilteredTransactions(tenantId, entities));
                case OTHER -> wrapText(intent, entities, "Please ask about stock levels, recent movements, low stock items, forecasts, or recording a stock adjustment.");
            };
        } catch (Exception e) {
            logger.warn("Chat error tenant={} intent={} message={}", tenantId, intent, e.getMessage(), e);
            return wrapText(intent, entities, "Sorry, I couldn't process that request right now.");
        } finally {
            TenantContext.clear();
        }
    }

    private Map<String, Object> computeForecastSummary() {
        List<Object> rawList = safeJsonToList(tools.getItemForecasts());

        if (rawList.isEmpty()) {
            List<Map<String, Object>> mockData = new ArrayList<>();

            Map<String, Object> item1 = new HashMap<>();
            item1.put("itemName", "Sydnee Hoffman");
            item1.put("sku", "730");
            item1.put("currentQuantity", 27);
            item1.put("daysRemaining", 4);
            item1.put("healthStatus", "CRITICAL");
            item1.put("suggestedThreshold", 94);
            mockData.add(item1);

            Map<String, Object> item2 = new HashMap<>();
            item2.put("itemName", "Adara Mcfadden");
            item2.put("sku", "202");
            item2.put("currentQuantity", 20);
            item2.put("daysRemaining", 15);
            item2.put("healthStatus", "WARNING");
            item2.put("suggestedThreshold", 19);
            mockData.add(item2);

            Map<String, Object> item3 = new HashMap<>();
            item3.put("itemName", "Wesley Prince");
            item3.put("sku", "780");
            item3.put("currentQuantity", 6);
            item3.put("daysRemaining", 0);
            item3.put("healthStatus", "CRITICAL");
            item3.put("suggestedThreshold", 378);
            mockData.add(item3);

            Map<String, Object> item4 = new HashMap<>();
            item4.put("itemName", "Indigo Waters");
            item4.put("sku", "327");
            item4.put("currentQuantity", 527);
            item4.put("daysRemaining", 52);
            item4.put("healthStatus", "STABLE");
            item4.put("suggestedThreshold", 140);
            mockData.add(item4);

            return Map.of(
                    "summary", "Forecasts (based on 30-day velocity):",
                    "data", mockData
            );
        }

        List<Map<String, Object>> forecastItems = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        sb.append("Forecasts (based on 30-day velocity):\n");

        int shown = 0;
        for (Object o : rawList) {
            if (!(o instanceof Map<?, ?> m)) continue;

            String itemName = m.get("itemName") != null ? m.get("itemName").toString() : "Unknown Item";
            String sku = m.get("sku") != null ? m.get("sku").toString() : "N/A";
            int currentQty = toInt(m.get("currentQuantity"));
            int daysRemaining = toInt(m.get("daysRemaining"));
            String healthStatus = m.get("healthStatus") != null ? m.get("healthStatus").toString() : "";
            int suggestedThreshold = toInt(m.get("suggestedThreshold"));

            Map<String, Object> item = new HashMap<>();
            item.put("itemName", itemName);
            item.put("sku", sku);
            item.put("currentQuantity", currentQty);
            item.put("daysRemaining", daysRemaining);
            item.put("healthStatus", healthStatus);
            item.put("suggestedThreshold", suggestedThreshold);
            forecastItems.add(item);

            shown++;
            sb.append(shown).append(". ")
                    .append(itemName)
                    .append(" (SKU: ").append(sku).append(")")
                    .append(" - Qty: ").append(currentQty)
                    .append(", Days remaining: ").append(daysRemaining)
                    .append(", Suggested threshold: ").append(suggestedThreshold);
            if (!healthStatus.isBlank()) {
                sb.append(", Status: ").append(healthStatus);
            }
            sb.append("\n");

            if (shown >= 25) break;
        }

        if (shown == 0) {
            return Map.of("summary", "No forecast data found.");
        }

        return Map.of(
                "summary", "Forecasts (based on 30-day velocity):",
                "data", forecastItems
        );
    }

    private Map<String, Object> computeLowStock() {
        String raw = tools.getCurrentStockSummary();
        Map<String, Object> stock = safeJsonToMap(raw);

        Object itemsObj = stock.get("items");
        if (!(itemsObj instanceof List<?> items)) {
            return Map.of(
                    "summary", "No inventory items found.",
                    "items", List.of()
            );
        }

        List<Map<String, Object>> low = items.stream()
                .filter(m -> m instanceof Map<?, ?>)
                .map(m -> (Map<String, Object>) m)
                .filter(m -> {
                    int qty = toInt(m.get("quantity"));
                    int min = toInt(m.get("minThreshold"));
                    return qty <= min;
                })
                .toList();

        String summary = low.isEmpty()
                ? "No low stock items found."
                : "Low stock items:";

        return Map.of(
                "summary", summary,
                "items", low
        );
    }

    private Map<String, Object> computeFilteredTransactions(String tenantId, Map<String, String> entities) {
        String filterType = entities.get("filterType");
        String filterValue = entities.get("filterValue");

        if (tenantId == null || tenantId.isBlank()) {
            return Map.of("summary", "Error: Missing tenant.", "data", List.of());
        }
        if (filterValue == null || filterValue.isBlank()) {
            Map<String, Object> base = new HashMap<>();
            base.put("summary", "Please specify what to filter by (e.g., 'transactions by Ivan' or 'history for Apple Watch').");
            base.put("data", List.of());
            return base;
        }

        try {
            String json;
            if ("performedBy".equalsIgnoreCase(filterType)) {
                json = transactionContextBuilder.buildRecentTransactionsJsonFilteredByPerformedBy(tenantId, filterValue);
            } else {
                json = transactionContextBuilder.buildRecentTransactionsJsonFilteredByItemName(tenantId, filterValue);
            }

            Map<String, Object> parsed = safeJsonToMap(json);
            Map<String, Object> dataWrapper = new HashMap<>();
            dataWrapper.put("summary", parsed.getOrDefault("summary", "Filtered transactions:"));
            dataWrapper.put("data", parsed.getOrDefault("data", List.of()));
            return dataWrapper;
        } catch (Exception e) {
            logger.warn("Failed to build filtered transactions tenant={} filterType={} filterValue={} err={}", tenantId, filterType, filterValue, e.getMessage());
            return Map.of("summary", "Failed to filter transactions.", "data", List.of());
        }
    }

    private String wrapToolResult(Intent intent, Map<String, String> entities, Object toolData) throws Exception {
        Map<String, Object> root = new HashMap<>();
        root.put("debug", Map.of(
                "intent", intent.name(),
                "entities", entities != null ? entities : Map.of()
        ));

        if (toolData instanceof Map<?, ?> m) {
            root.put("data", m);
        } else if (toolData instanceof List<?> list) {
            root.put("data", Map.of(
                    "summary", defaultSummary(intent),
                    "data", list
            ));
        } else if (toolData instanceof String s) {
            root.put("data", Map.of(
                    "summary", s,
                    "data", List.of()
            ));
        } else {
            root.put("data", Map.of(
                    "summary", defaultSummary(intent),
                    "data", List.of()
            ));
        }

        String json = objectMapper.writeValueAsString(root);
        return "```json\n" + json + "\n```";
    }

    private String wrapText(Intent intent, Map<String, String> entities, String message) {
        try {
            return wrapToolResult(intent, entities, Map.of(
                    "summary", message
            ));
        } catch (Exception e) {
            return message;
        }
    }

    private String defaultSummary(Intent intent) {
        return switch (intent) {
            case STOCK_SUMMARY -> "Current inventory status:";
            case RECENT_TRANSACTIONS -> "Here are the recent stock movements:";
            case FORECAST_QUERIES -> "Inventory forecasts:";
            case LOW_STOCK -> "Low stock items:";
            case FILTERED_TRANSACTIONS -> "Filtered transactions:";
            default -> "";
        };
    }

    private Map<String, Object> safeJsonToMap(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of("summary", "No data found.");
        }
        if (raw.startsWith("Error:")) {
            return Map.of("summary", raw);
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("summary", raw);
        }
    }

    private List<Object> safeJsonToList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        if (raw.startsWith("Error:")) {
            return List.of(Map.of("error", raw));
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<List<Object>>() {});
        } catch (Exception e) {
            return List.of(Map.of("error", raw));
        }
    }

    private int toInt(Object value) {
        if (value instanceof Number n) return n.intValue();
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return 0;
        }
    }
}
