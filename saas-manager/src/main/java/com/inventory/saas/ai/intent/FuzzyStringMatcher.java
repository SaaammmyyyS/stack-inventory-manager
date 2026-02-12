package com.inventory.saas.ai.intent;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class FuzzyStringMatcher {

    private static final Set<String> STOCK_VARIATIONS = new HashSet<>(Arrays.asList(
        "stock", "stok", "stck", "stokc", "stoc", "stocke", "stokk"
    ));

    private static final Set<String> TRANSACTION_VARIATIONS = new HashSet<>(Arrays.asList(
        "transaction", "transacton", "transactoin", "transaktion", "transaktion",
        "transactions", "transactons", "transactoins", "transaktions"
    ));

    private static final Set<String> INVENTORY_VARIATIONS = new HashSet<>(Arrays.asList(
        "inventory", "inventry", "inventorry", "inventary", "inventroy"
    ));

    private static final Set<String> LEVEL_VARIATIONS = new HashSet<>(Arrays.asList(
        "level", "lvl", "leval", "leval", "levl", "levels", "lvls"
    ));

    private static final Set<String> RECENT_VARIATIONS = new HashSet<>(Arrays.asList(
        "recent", "recient", "rescent", "reacent", "recentt"
    ));

    private static final Set<String> FORECAST_VARIATIONS = new HashSet<>(Arrays.asList(
        "forecast", "forcast", "forcaste", "forcast", "forcastt", "forcaste"
    ));

    private static final int MAX_EDIT_DISTANCE = 2;

    public boolean matchesFuzzy(String word, String targetCategory) {
        if (word == null || word.trim().isEmpty()) {
            return false;
        }

        String cleanWord = word.toLowerCase().trim();

        switch (targetCategory.toLowerCase()) {
            case "stock":
                return matchesAny(cleanWord, STOCK_VARIATIONS);
            case "transaction":
                return matchesAny(cleanWord, TRANSACTION_VARIATIONS);
            case "inventory":
                return matchesAny(cleanWord, INVENTORY_VARIATIONS);
            case "level":
                return matchesAny(cleanWord, LEVEL_VARIATIONS);
            case "recent":
                return matchesAny(cleanWord, RECENT_VARIATIONS);
            case "forecast":
                return matchesAny(cleanWord, FORECAST_VARIATIONS);
            default:
                return false;
        }
    }

    private boolean matchesAny(String word, Set<String> variations) {
        if (variations.contains(word)) {
            return true;
        }

        for (String variation : variations) {
            if (levenshteinDistance(word, variation) <= MAX_EDIT_DISTANCE) {
                return true;
            }
        }

        return false;
    }

    private int levenshteinDistance(String s1, String s2) {
        if (s1 == null) return s2 == null ? 0 : s2.length();
        if (s2 == null) return s1.length();

        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        Math.min(dp[i - 1][j], dp[i][j - 1]),
                        dp[i - 1][j - 1]
                    );
                }
            }
        }

        return dp[s1.length()][s2.length()];
    }

    public String expandWithFuzzyMatching(String message) {
        if (message == null || message.trim().isEmpty()) {
            return message;
        }

        String[] words = message.toLowerCase().split("\\s+");
        StringBuilder expanded = new StringBuilder(message.toLowerCase());

        for (String word : words) {
            if (matchesFuzzy(word, "stock") && !word.equals("stock")) {
                expanded.append(" stock");
            }
            if (matchesFuzzy(word, "transaction") && !word.equals("transaction")) {
                expanded.append(" transaction");
            }
            if (matchesFuzzy(word, "inventory") && !word.equals("inventory")) {
                expanded.append(" inventory");
            }
            if (matchesFuzzy(word, "level") && !word.equals("level")) {
                expanded.append(" level");
            }
            if (matchesFuzzy(word, "recent") && !word.equals("recent")) {
                expanded.append(" recent");
            }
            if (matchesFuzzy(word, "forecast") && !word.equals("forecast")) {
                expanded.append(" forecast");
            }
        }

        return expanded.toString();
    }

    public boolean containsFuzzyMatch(String message, String category) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }

        String[] words = message.toLowerCase().split("\\s+");
        for (String word : words) {
            if (matchesFuzzy(word, category)) {
                return true;
            }
        }
        return false;
    }

    public String getBestMatch(String word, String targetCategory) {
        if (word == null || word.trim().isEmpty()) {
            return word;
        }

        String cleanWord = word.toLowerCase().trim();
        Set<String> variations = getVariationsForCategory(targetCategory);

        String bestMatch = word;
        int minDistance = Integer.MAX_VALUE;

        for (String variation : variations) {
            int distance = levenshteinDistance(cleanWord, variation);
            if (distance < minDistance && distance <= MAX_EDIT_DISTANCE) {
                minDistance = distance;
                bestMatch = variation;
            }
        }

        return bestMatch;
    }

    private Set<String> getVariationsForCategory(String category) {
        switch (category.toLowerCase()) {
            case "stock": return STOCK_VARIATIONS;
            case "transaction": return TRANSACTION_VARIATIONS;
            case "inventory": return INVENTORY_VARIATIONS;
            case "level": return LEVEL_VARIATIONS;
            case "recent": return RECENT_VARIATIONS;
            case "forecast": return FORECAST_VARIATIONS;
            default: return new HashSet<>();
        }
    }
}
