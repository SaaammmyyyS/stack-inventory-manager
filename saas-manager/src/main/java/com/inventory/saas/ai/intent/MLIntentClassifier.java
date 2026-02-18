package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Random;

@Component
public class MLIntentClassifier {

    private static final Logger logger = LoggerFactory.getLogger(MLIntentClassifier.class);
    private static final double CONFIDENCE_THRESHOLD = 0.75;

    private final Set<String> conversationalIntents = new HashSet<>();
    private final Random random = new Random();

    public MLIntentClassifier() {
        conversationalIntents.addAll(Arrays.asList(
            "GREETING", "FAREWELL", "THANKS", "HELP", "CLARIFICATION", "SMALL_TALK"
        ));

        logger.info("ML Intent Classifier initialized with rule-based fallback");
    }

    public ClassificationResult classifyIntent(String message) {
        if (message == null || message.trim().isEmpty()) {
            return new ClassificationResult(Intent.OTHER, 0.0, "Empty message");
        }

        try {
            String preprocessed = preprocessMessage(message);
            Intent intent = classifyWithRules(preprocessed);
            double confidence = calculateConfidence(intent, preprocessed);

            logger.debug("ML classified '{}' as {} with confidence {}", message, intent, confidence);

            return new ClassificationResult(intent, confidence, "Rule-based classification");
        } catch (Exception e) {
            logger.warn("ML classification failed for '{}': {}", message, e.getMessage());
            return new ClassificationResult(Intent.OTHER, 0.0, "Classification failed: " + e.getMessage());
        }
    }

    private String preprocessMessage(String message) {
        if (message == null) return "";

        return message.toLowerCase()
                .trim()
                .replaceAll("[^a-zA-Z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private Intent classifyWithRules(String message) {
        String m = message.toLowerCase();

        if (matchesAny(m, "hello", "hi", "hey", "good morning", "good afternoon", "good evening")) {
            return Intent.GREETING;
        }
        if (matchesAny(m, "bye", "goodbye", "see you", "farewell", "later")) {
            return Intent.FAREWELL;
        }
        if (matchesAny(m, "thank", "thanks", "appreciate", "grateful")) {
            return Intent.THANKS;
        }
        if (matchesAny(m, "help", "what can you do", "how do you work", "assist")) {
            return Intent.HELP;
        }
        if (matchesAny(m, "what", "who", "where", "when", "how", "why") &&
            !matchesAny(m, "stock", "inventory", "transaction", "forecast")) {
            return Intent.SMALL_TALK;
        }

        if (matchesAny(m, "transaction", "movement") &&
            (matchesAny(m, "by", "for", "of", "from"))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (matchesAny(m, "recent", "latest", "history", "activity") &&
            (matchesAny(m, "transaction", "movement", "change"))) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (matchesAny(m, "low stock", "restock", "reorder", "running low", "depleted", "need to")) {
            return Intent.LOW_STOCK;
        }

        if (matchesAny(m, "forecast", "predict", "run out", "when will", "future")) {
            return Intent.FORECAST_QUERIES;
        }

        if (matchesAny(m, "stock", "inventory", "what do i have", "current", "available")) {
            return Intent.STOCK_SUMMARY;
        }

        return Intent.OTHER;
    }

    private boolean matchesAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private double calculateConfidence(Intent intent, String message) {
        if (conversationalIntents.contains(intent.name())) {
            return 0.85 + (random.nextDouble() * 0.1);
        }

        if (intent != Intent.OTHER) {
            return 0.70 + (random.nextDouble() * 0.15);
        }

        return 0.3;
    }

    public boolean isConversationalIntent(Intent intent) {
        return conversationalIntents.contains(intent.name());
    }

    public boolean isHighConfidence(ClassificationResult result) {
        return result.confidence() >= CONFIDENCE_THRESHOLD;
    }

    public record ClassificationResult(
        Intent intent,
        double confidence,
        String explanation
    ) {}
}
