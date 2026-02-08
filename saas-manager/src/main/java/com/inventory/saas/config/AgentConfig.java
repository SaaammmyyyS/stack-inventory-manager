package com.inventory.saas.config;

import com.inventory.saas.service.InventoryAgentTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.function.Function;

@Configuration
@Profile("!test")
public class AgentConfig {

    private static final Logger logger = LoggerFactory.getLogger(AgentConfig.class);
    private static final String REACT_SYSTEM_PROMPT = """
        You are an Inventory Management Agent. You MUST call tools before responding.

        CRITICAL RULES:
        - ALWAYS call the appropriate tool FIRST before providing any response
        - NEVER invent data or use placeholders like "REPLACE_WITH_"
        - When tools return data, analyze that specific data and provide insights
        - If tools return empty data, say "No data found" explicitly
        - NEVER provide template responses or example code

        TOOL USAGE:
        - For stock levels: Call getCurrentStockSummary() first
        - For recent movements: Call getRecentTransactions() first
        - For item history: Call getItemTransactionHistory() with itemId
        - For forecasts: Call getItemForecasts() first
        - For recording movements: Call recordStockMovement() with parameters

        RESPONSE FORMAT:
        - Use ONLY the actual data returned by tools
        - For transactions: Use real data from getRecentTransactions results
        - For inventory: Use real data from getCurrentStockSummary results
        - If no data exists: Say "No transactions found" or "No inventory items found"

        Be helpful and concise, always base responses on ACTUAL tool results.
        """;

    @Bean
    @Primary
    public ChatClient inventoryAgentChatClient(
            ChatClient.Builder builder,
            InventoryAgentTools tools) {

        try {
            return builder
                    .defaultSystem(REACT_SYSTEM_PROMPT)
                    .defaultFunction("getCurrentStockSummary",
                            "Fetch paginated list of inventory items (name, sku, quantity, minThreshold) for the current tenant. Use when the user asks about stock levels, what's in inventory, or low stock.",
                            (Function<Map<String, Object>, String>) map -> tools.getCurrentStockSummary())
                    .defaultFunction("getRecentTransactions",
                            "Return the last N stock movements (in/out) for the current tenant. Use when the user asks about recent activity or history.",
                            (Function<Map<String, Object>, String>) map -> tools.getRecentTransactions())
                    .defaultFunction("getItemTransactionHistory",
                            "Return transaction history for a specific item by ID. Use when the user asks about history for one product. Call only with an item ID that belongs to the current tenant. Parameter: itemId (UUID string).",
                            (Function<Map<String, Object>, String>) map -> {
                                Object id = map != null ? map.get("itemId") : null;
                                return tools.getItemTransactionHistory(id != null ? id.toString() : null);
                            })
                    .defaultFunction("getItemForecasts",
                            "Get per-item forecasts (days remaining, suggested threshold, status) based on 30-day velocity. Use when the user asks about runout dates or reorder suggestions.",
                            (Function<Map<String, Object>, String>) map -> tools.getItemForecasts())
                    .defaultFunction("recordStockMovement",
                            "Record a stock-in or stock-out for an item. Use when the user wants to add or remove quantity. Parameters: itemId (UUID), amount (positive integer), type (STOCK_IN or STOCK_OUT), optional reason and performedBy. Validate item belongs to current tenant.",
                            (Function<Map<String, Object>, String>) map -> {
                                if (map == null) return "Error: No parameters.";
                                Object itemId = map.get("itemId");
                                Object amountObj = map.get("amount");
                                Object type = map.get("type");
                                Object reason = map.get("reason");
                                Object performedBy = map.get("performedBy");
                                int amount = amountObj instanceof Number ? ((Number) amountObj).intValue() : 0;
                                return tools.recordStockMovement(
                                        itemId != null ? itemId.toString() : null,
                                        amount,
                                        type != null ? type.toString() : "STOCK_IN",
                                        reason != null ? reason.toString() : null,
                                        performedBy != null ? performedBy.toString() : null);
                            })
                    .build();
        } catch (Exception e) {
            logger.warn("Failed to create ChatClient with tools, falling back to simple chat client: {}", e.getMessage());
            return createSimpleChatClient(builder);
        }
    }

    @Bean("simpleChatClient")
    public ChatClient simpleChatClient(ChatClient.Builder builder) {
        return createSimpleChatClient(builder);
    }

    private ChatClient createSimpleChatClient(ChatClient.Builder builder) {
        String simplePrompt = """
            You are a helpful Inventory Management Assistant. You can answer questions about inventory management,
            provide general advice, and help with basic queries. For specific data operations, please inform the user
            that they need access to the full agent tools.
            """;

        return builder
                .defaultSystem(simplePrompt)
                .build();
    }
}
