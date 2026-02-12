package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.extraction.EntityExtractor;
import com.inventory.saas.ai.model.Intent;
import com.inventory.saas.ai.service.ConversationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

@Component
public class IntentClassifier {

    private static final Logger logger = LoggerFactory.getLogger(IntentClassifier.class);

    private final ConversationManager conversationManager;
    private final EntityExtractor entityExtractor;

    public IntentClassifier(ConversationManager conversationManager,
                           EntityExtractor entityExtractor) {
        this.conversationManager = conversationManager;
        this.entityExtractor = entityExtractor;
    }

    public Intent classifyBasicIntent(String userMessage) {
        if (userMessage == null) return Intent.OTHER;

        logger.debug("Classifying intent for message: '{}'", userMessage);

        ClassificationResult bestResult = new ClassificationResult(Intent.OTHER, 0.0, "No match");

        if (conversationManager.isConversationalIntent(classifyWithSimplifiedPatterns(userMessage))) {
            Intent conversationalIntent = classifyWithSimplifiedPatterns(userMessage);
            double confidence = 0.85;
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                conversationalIntent, confidence, "Conversational pattern matching"));
            logger.info("Classified '{}' as {} with confidence {}", userMessage, conversationalIntent, confidence);
            return bestResult.intent;
        }

        Intent patternResult = classifyWithSimplifiedPatterns(userMessage);
        if (patternResult != Intent.OTHER) {
            double patternConfidence = 0.7;
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                patternResult, patternConfidence, "Simplified pattern matching"));
        }

        Intent keywordResult = classifyWithBasicKeywords(userMessage);
        if (keywordResult != Intent.OTHER) {
            double keywordConfidence = 0.5;
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                keywordResult, keywordConfidence, "Basic keyword matching"));
        }

        logger.info("Classified '{}' as {} with confidence {} using {}",
            userMessage, bestResult.intent, bestResult.confidence, bestResult.method);

        return bestResult.intent;
    }

    private Intent classifyWithSimplifiedPatterns(String userMessage) {
        String m = userMessage.toLowerCase(Locale.ROOT);

        if (matchesAny(m, "hello", "hi ", "hey", "good morning", "good afternoon", "good evening")) {
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
        if (matchesAny(m, "don't understand", "clarify", "rephrase", "confused", "not sure")) {
            return Intent.CLARIFICATION;
        }
        if (matchesAny(m, "how are you", "who are you")) {
            return Intent.SMALL_TALK;
        }
        if (matchesAny(m, "weather", "time")) {
            return Intent.SMALL_TALK;
        }
        if (matchesAny(m, "joke", "game")) {
            return Intent.OTHER;
        }
        if (matchesAny(m, "what", "who", "where", "when", "how", "why") &&
            !matchesAny(m, "stock", "inventory", "transaction", "forecast", "run out", "items", "by", "for", "history", "weather", "time", "capital")) {
            return Intent.SMALL_TALK;
        }

        if (matchesAny(m, "forecast", "predict", "run out", "when will", "future")) {
            return Intent.FORECAST_QUERIES;
        }

        if (matchesAny(m, "transaction", "movement") &&
            (matchesAny(m, "by", "for", "of", "from"))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (matchesAny(m, "history") &&
            (matchesAny(m, "by", "for", "of", "from"))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (matchesAny(m, "recent", "latest", "history", "activity", "what's been happening") &&
            (matchesAny(m, "transaction", "movement", "change", "inventory"))) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (matchesAny(m, "low stock", "restock", "reorder", "running low", "depleted")) {
            return Intent.LOW_STOCK;
        }

        if (matchesAny(m, "stock", "inventory", "what do i have", "current", "available")) {
            return Intent.STOCK_SUMMARY;
        }

        return Intent.OTHER;
    }

    private Intent classifyWithBasicKeywords(String userMessage) {
        String m = userMessage.toLowerCase(Locale.ROOT);

        if (m.contains("transaction") && (m.contains("by") || m.contains("for"))) {
            return Intent.FILTERED_TRANSACTIONS;
        }
        if (m.contains("recent") && (m.contains("transaction") || m.contains("movement"))) {
            return Intent.RECENT_TRANSACTIONS;
        }
        if (m.contains("low") && m.contains("stock")) {
            return Intent.LOW_STOCK;
        }
        if (m.contains("forecast") || m.contains("run out")) {
            return Intent.FORECAST_QUERIES;
        }
        if (m.contains("stock") || m.contains("inventory")) {
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

    private ClassificationResult updateBestResult(ClassificationResult current, ClassificationResult candidate) {
        return candidate.confidence > current.confidence ? candidate : current;
    }

    public boolean isConversationalIntent(Intent intent) {
        return switch (intent) {
            case GREETING, FAREWELL, THANKS, HELP, CLARIFICATION, SMALL_TALK -> true;
            default -> false;
        };
    }

    public ClassificationDetails getDetailedClassification(String userMessage) {
        if (userMessage == null) {
            return new ClassificationDetails(Intent.OTHER, "Empty message");
        }

        Intent finalIntent = classifyBasicIntent(userMessage);
        String explanation = "Classified using simplified 3-layer hierarchy";

        return new ClassificationDetails(finalIntent, explanation);
    }

    private static class ClassificationResult {
        final Intent intent;
        final double confidence;
        final String method;

        ClassificationResult(Intent intent, double confidence, String method) {
            this.intent = intent;
            this.confidence = confidence;
            this.method = method;
        }
    }

    public record ClassificationDetails(
        Intent finalIntent,
        String explanation
    ) {}
}
