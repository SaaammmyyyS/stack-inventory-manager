package com.inventory.saas.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

class ChatEntityExtractor {

    Map<String, String> extractBasicEntities(String userMessage) {
        Map<String, String> entities = new HashMap<>();

        String byTail = extractTailAfterKeyword(userMessage, "by");
        if (byTail != null) {
            String cleaned = cleanNoisePhrase(byTail);
            if (!cleaned.isBlank()) {
                entities.put("filterType", "performedBy");
                entities.put("filterValue", cleaned);
                entities.put("personName", cleaned);
            }
        }

        if (!entities.containsKey("filterValue")) {
            String forTail = extractTailAfterKeyword(userMessage, "for");
            String ofTail = extractTailAfterKeyword(userMessage, "of");
            String tail = forTail != null ? forTail : ofTail;
            if (tail != null) {
                String cleaned = cleanNoisePhrase(tail);
                if (!cleaned.isBlank()) {
                    entities.put("filterType", "itemName");
                    entities.put("filterValue", cleaned);
                }
            }
        }

        String[] words = userMessage.split("\\s+");
        for (String word : words) {
            if (word.length() <= 2 || !Character.isUpperCase(word.charAt(0))) continue;
            String cleaned = word.replaceAll("[^A-Za-z]", "");
            if (cleaned.isBlank()) continue;

            String lower = cleaned.toLowerCase(Locale.ROOT);
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

    private String extractTailAfterKeyword(String message, String keyword) {
        if (message == null || keyword == null || keyword.isBlank()) return null;
        Pattern p = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b\\s+([^\\n\\r\\.!?;:]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = p.matcher(message);
        if (!matcher.find()) return null;
        String tail = matcher.group(1);

        if (tail == null) return null;
        return tail.trim();
    }

    private String cleanNoisePhrase(String phrase) {
        if (phrase == null) return "";
        String normalized = phrase
                .replaceAll("[\\(\\)\\[\\]{}]", " ")
                .replaceAll("[^A-Za-z0-9\\s'-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isBlank()) return "";

        Set<String> noise = new LinkedHashSet<>(Arrays.asList(
                "only", "just", "show", "me", "made", "user", "please", "pls", "transactions",
                "transaction", "history", "movement", "movements", "performed", "by", "for", "of"
        ));

        List<String> kept = Arrays.stream(normalized.split("\\s+"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .filter(s -> !noise.contains(s.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());

        return String.join(" ", kept).trim();
    }
}
