package com.inventory.saas.ai.intent;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Component
public class InventorySynonymProvider {

    private final Map<String, Set<String>> synonymMap = new HashMap<>();

    private final Map<String, Set<String>> intentKeywords = new HashMap<>();

    public InventorySynonymProvider() {
        initializeSynonyms();
        initializeIntentKeywords();
    }

    private void initializeSynonyms() {
        addSynonymGroup("stock", Arrays.asList(
            "inventory", "stock", "items", "products", "goods", "merchandise",
            "supplies", "materials", "resources", "assets", "catalog"
        ));

        addSynonymGroup("current", Arrays.asList(
            "current", "present", "existing", "available", "on hand", "in stock",
            "ready", "accessible", "presently", "now", "today"
        ));

        addSynonymGroup("levels", Arrays.asList(
            "levels", "quantity", "amount", "count", "number", "total",
            "volume", "size", "quantity", "how many", "how much"
        ));

        addSynonymGroup("recent", Arrays.asList(
            "recent", "latest", "new", "newest", "fresh", "current",
            "latest", "today", "just now", "latest updates"
        ));

        addSynonymGroup("transactions", Arrays.asList(
            "transactions", "movements", "changes", "updates", "activity",
            "history", "records", "logs", "entries", "actions", "operations"
        ));

        addSynonymGroup("low", Arrays.asList(
            "low", "reorder", "restock", "running low", "depleted", "scarce",
            "insufficient", "needed", "required", "out of stock", "empty"
        ));

        addSynonymGroup("forecast", Arrays.asList(
            "forecast", "prediction", "predict", "projection", "estimate",
            "outlook", "future", "run out", "depletion", "timeline", "when"
        ));

        addSynonymGroup("show", Arrays.asList(
            "show", "display", "list", "view", "see", "get", "find",
            "check", "look at", "examine", "reveal", "present"
        ));

        addSynonymGroup("filter", Arrays.asList(
            "by", "for", "of", "from", "related to", "about", "concerning",
            "regarding", "with", "containing", "involving"
        ));
    }

    private void initializeIntentKeywords() {
        intentKeywords.put("STOCK_SUMMARY", new HashSet<>(Arrays.asList(
            "stock levels", "inventory status", "current inventory", "what do i have",
            "available items", "in stock", "on hand", "stock count", "inventory count",
            "how many items", "what's available", "current stock", "inventory overview",
            "stock summary", "items available", "product count", "goods on hand",
            "current goods", "inventory levels", "stock status", "what's in stock"
        )));

        intentKeywords.put("RECENT_TRANSACTIONS", new HashSet<>(Arrays.asList(
            "recent transactions", "recent movements", "latest activity", "recent changes",
            "transaction history", "movement history", "recent updates", "latest transactions",
            "what's happening", "recent activity", "stock movements", "inventory changes",
            "recent records", "latest logs", "recent operations", "transaction updates",
            "show transactions", "show me transactions", "view transactions", "transactions",
            "recent stock movements", "what's been happening", "latest changes"
        )));

        intentKeywords.put("LOW_STOCK", new HashSet<>(Arrays.asList(
            "low stock", "reorder items", "restock needed", "running low", "depleted items",
            "items to reorder", "stock shortage", "insufficient stock", "out of stock",
            "need to order", "restock items", "low inventory", "critical stock",
            "items needed", "stock alert", "reorder point", "minimum stock"
        )));

        intentKeywords.put("FORECAST_QUERIES", new HashSet<>(Arrays.asList(
            "forecast", "prediction", "run out date", "when will", "future stock",
            "stock forecast", "inventory forecast", "depletion date", "days remaining",
            "future needs", "stock projection", "inventory outlook", "runout prediction",
            "when to reorder", "stock timeline", "future inventory", "prediction model"
        )));

        intentKeywords.put("FILTERED_TRANSACTIONS", new HashSet<>(Arrays.asList(
            "transactions by", "history for", "filter by", "show transactions for",
            "activity by", "records by", "movements for", "changes by", "updates for",
            "filter transactions", "specific transactions", "transaction filter",
            "history by person", "activity for item", "filtered history"
        )));
    }

    private void addSynonymGroup(String key, List<String> synonyms) {
        Set<String> synonymSet = new HashSet<>();
        for (String synonym : synonyms) {
            synonymSet.add(synonym.toLowerCase());
        }
        synonymMap.put(key, synonymSet);
    }

    public String expandWithSynonyms(String message) {
        if (message == null || message.trim().isEmpty()) {
            return message;
        }

        String expanded = message.toLowerCase();
        String[] words = expanded.split("\\s+");

        for (int i = 0; i < words.length; i++) {
            String word = words[i];

            String context = getContextWindow(words, i, 2);

            String expandedWord = expandWithContext(word, context);
            if (!expandedWord.equals(word) && !expanded.contains(expandedWord)) {
                expanded += " " + expandedWord;
            }
        }

        return expanded;
    }

    private String getContextWindow(String[] words, int currentIndex, int windowSize) {
        StringBuilder context = new StringBuilder();

        int start = Math.max(0, currentIndex - windowSize);
        int end = Math.min(words.length - 1, currentIndex + windowSize);

        for (int i = start; i <= end; i++) {
            if (i != currentIndex) {
                if (context.length() > 0) {
                    context.append(" ");
                }
                context.append(words[i]);
            }
        }

        return context.toString();
    }

    private String expandWithContext(String word, String context) {
        if (isInSynonymGroup(word, "stock") || isInSynonymGroup(word, "inventory")) {
            if (context.contains("current") || context.contains("status") ||
                context.contains("level") || context.contains("how many") ||
                context.contains("what") || context.contains("show")) {
                return "stock inventory items products goods";
            }
            if (context.contains("recent") || context.contains("movement") ||
                context.contains("history") || context.contains("transaction")) {
                return "stock inventory movements changes activity";
            }
            return "stock inventory items products";
        }

        if (isInSynonymGroup(word, "transactions") || isInSynonymGroup(word, "movements")) {
            if (context.contains("recent") || context.contains("latest") ||
                context.contains("new") || context.contains("history")) {
                return "transactions movements changes activity history records";
            }
            return "transactions movements changes activity";
        }

        if (isInSynonymGroup(word, "low") || isInSynonymGroup(word, "reorder")) {
            if (context.contains("stock") || context.contains("inventory") ||
                context.contains("items") || context.contains("products")) {
                return "low reorder restock depleted insufficient needed";
            }
            return "low reorder restock";
        }

        if (isInSynonymGroup(word, "forecast") || isInSynonymGroup(word, "prediction")) {
            if (context.contains("when") || context.contains("run") ||
                context.contains("out") || context.contains("deplete")) {
                return "forecast prediction runout depletion timeline when";
            }
            return "forecast prediction outlook future projection";
        }

        if (isInSynonymGroup(word, "show") || isInSynonymGroup(word, "display")) {
            return "show display list view get check see find";
        }

        return word;
    }

    private boolean isInSynonymGroup(String word, String groupKey) {
        Set<String> group = synonymMap.get(groupKey);
        return group != null && group.contains(word.toLowerCase());
    }

    public boolean containsIntentKeywords(String message, String intentType) {
        if (message == null || intentType == null) {
            return false;
        }

        Set<String> keywords = intentKeywords.get(intentType);
        if (keywords == null) {
            return false;
        }

        String lowerMessage = message.toLowerCase();

        for (String keyword : keywords) {
            if (lowerMessage.contains(keyword.toLowerCase())) {
                return true;
            }
        }

        String expanded = expandWithSynonyms(message);
        for (String keyword : keywords) {
            if (expanded.contains(keyword.toLowerCase())) {
                return true;
            }
        }

        return false;
    }

    public Set<String> getIntentKeywords(String intentType) {
        return intentKeywords.getOrDefault(intentType, new HashSet<>());
    }

    public Set<String> getSynonyms(String term) {
        return synonymMap.getOrDefault(term.toLowerCase(), new HashSet<>());
    }
}
