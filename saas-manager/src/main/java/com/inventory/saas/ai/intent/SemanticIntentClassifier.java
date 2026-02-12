package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class SemanticIntentClassifier {

    private static final Logger logger = LoggerFactory.getLogger(SemanticIntentClassifier.class);

    private final ChatClient chatClient;

    private static final String INTENT_CLASSIFICATION_PROMPT = """
        You are an inventory management AI assistant. Classify the user's intent into one of these categories:

        CATEGORIES:
        - STOCK_SUMMARY: User wants to see current inventory levels, stock status, what items are available
        - RECENT_TRANSACTIONS: User wants to see recent stock movements, transaction history, recent activity
        - LOW_STOCK: User wants to see items that need restocking, are running low, need to be reordered
        - FORECAST_QUERIES: User wants to see predictions, forecasts, when items will run out, future stock needs
        - FILTERED_TRANSACTIONS: User wants to see transactions filtered by person or item
        - OTHER: Request doesn't match any inventory-related intent

        EXAMPLES:
        User: "show me stock levels" -> STOCK_SUMMARY
        User: "what do I have in inventory" -> STOCK_SUMMARY
        User: "current inventory status" -> STOCK_SUMMARY
        User: "show me recent transactions" -> RECENT_TRANSACTIONS
        User: "recent stock movements" -> RECENT_TRANSACTIONS
        User: "what's been happening with inventory" -> RECENT_TRANSACTIONS
        User: "low stock items" -> LOW_STOCK
        User: "what needs to be restocked" -> LOW_STOCK
        User: "items running low" -> LOW_STOCK
        User: "forecast predictions" -> FORECAST_QUERIES
        User: "when will items run out" -> FORECAST_QUERIES
        User: "future inventory needs" -> FORECAST_QUERIES
        User: "transactions by John" -> FILTERED_TRANSACTIONS
        User: "history for product X" -> FILTERED_TRANSACTIONS
        User: "what's the weather" -> OTHER

        Classify this user message: "%s"

        Respond with only the intent name (e.g., STOCK_SUMMARY).
        """;

    private static final double CONFIDENCE_THRESHOLD = 0.7;

    public SemanticIntentClassifier(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    public IntentClassificationResult classifyIntent(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new IntentClassificationResult(Intent.OTHER, 0.0, "Empty message");
        }

        try {
            String prompt = String.format(INTENT_CLASSIFICATION_PROMPT, userMessage.trim());

            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            logger.debug("ML classifier response for '{}': {}", userMessage, response);

            Intent intent = parseIntentFromResponse(response);
            double confidence = calculateConfidence(response, userMessage);

            logger.info("ML classified '{}' as {} with confidence {}", userMessage, intent, confidence);

            return new IntentClassificationResult(intent, confidence, "ML classification successful");

        } catch (Exception e) {
            logger.warn("ML classification failed for '{}': {}", userMessage, e.getMessage());
            return new IntentClassificationResult(Intent.OTHER, 0.0, "ML classification failed: " + e.getMessage());
        }
    }

    private Intent parseIntentFromResponse(String response) {
        if (response == null) return Intent.OTHER;

        String cleanResponse = response.toUpperCase().trim();

        Map<String, Intent> intentMap = new HashMap<>();
        intentMap.put("STOCK_SUMMARY", Intent.STOCK_SUMMARY);
        intentMap.put("RECENT_TRANSACTIONS", Intent.RECENT_TRANSACTIONS);
        intentMap.put("LOW_STOCK", Intent.LOW_STOCK);
        intentMap.put("FORECAST_QUERIES", Intent.FORECAST_QUERIES);
        intentMap.put("FILTERED_TRANSACTIONS", Intent.FILTERED_TRANSACTIONS);
        intentMap.put("OTHER", Intent.OTHER);

        for (Map.Entry<String, Intent> entry : intentMap.entrySet()) {
            if (cleanResponse.equals(entry.getKey())) {
                return entry.getValue();
            }
        }

        for (Map.Entry<String, Intent> entry : intentMap.entrySet()) {
            if (cleanResponse.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return Intent.OTHER;
    }

    private double calculateConfidence(String response, String originalMessage) {
        if (response == null) return 0.0;

        String cleanResponse = response.toUpperCase().trim();

        if (cleanResponse.equals("STOCK_SUMMARY") || cleanResponse.equals("RECENT_TRANSACTIONS") ||
            cleanResponse.equals("LOW_STOCK") || cleanResponse.equals("FORECAST_QUERIES") ||
            cleanResponse.equals("FILTERED_TRANSACTIONS")) {
            return 0.9;
        }

        if (cleanResponse.contains("STOCK") || cleanResponse.contains("TRANSACTION") ||
            cleanResponse.contains("LOW") || cleanResponse.contains("FORECAST") ||
            cleanResponse.contains("FILTER")) {
            return 0.7;
        }

        return 0.3;
    }

    public record IntentClassificationResult(
        Intent intent,
        double confidence,
        String explanation
    ) {
        public boolean isHighConfidence() {
            return confidence >= CONFIDENCE_THRESHOLD;
        }
    }
}
