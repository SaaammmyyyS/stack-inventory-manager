package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class IntentClassifier {

    private static final Logger logger = LoggerFactory.getLogger(IntentClassifier.class);

    private final SemanticIntentClassifier semanticClassifier;
    private final InventorySynonymProvider synonymProvider;
    private final PhrasePatternMatcher patternMatcher;
    private final FuzzyStringMatcher fuzzyMatcher;

    public IntentClassifier(SemanticIntentClassifier semanticClassifier,
                           InventorySynonymProvider synonymProvider,
                           PhrasePatternMatcher patternMatcher,
                           FuzzyStringMatcher fuzzyMatcher) {
        this.semanticClassifier = semanticClassifier;
        this.synonymProvider = synonymProvider;
        this.patternMatcher = patternMatcher;
        this.fuzzyMatcher = fuzzyMatcher;
    }

    public Intent classifyBasicIntent(String userMessage) {
        if (userMessage == null) return Intent.OTHER;

        logger.debug("Classifying intent for message: '{}'", userMessage);

        ClassificationResult bestResult = new ClassificationResult(Intent.OTHER, 0.0, "No match");

        if (semanticClassifier != null) {
            SemanticIntentClassifier.IntentClassificationResult mlResult = semanticClassifier.classifyIntent(userMessage);
            if (mlResult.isHighConfidence()) {
                bestResult = updateBestResult(bestResult, new ClassificationResult(
                    mlResult.intent(), mlResult.confidence(), "ML classification"));
            }
        }

        PhrasePatternMatcher.PatternMatchResult patternResult = patternMatcher.matchPattern(userMessage);
        if (patternResult.isHighConfidence()) {
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                patternResult.intent(), patternResult.confidence(), "Pattern matching"));
        }

        String expandedMessage = synonymProvider.expandWithSynonyms(userMessage);
        Intent synonymResult = classifyWithSynonyms(expandedMessage);
        if (synonymResult != Intent.OTHER) {
            double synonymConfidence = calculateSynonymConfidence(userMessage, expandedMessage, synonymResult);
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                synonymResult, synonymConfidence, "Synonym-enhanced matching"));
        }

        String fuzzyExpandedMessage = fuzzyMatcher.expandWithFuzzyMatching(userMessage);
        Intent fuzzyResult = classifyWithFuzzyMatching(fuzzyExpandedMessage);
        if (fuzzyResult != Intent.OTHER) {
            double fuzzyConfidence = calculateFuzzyConfidence(userMessage, fuzzyResult);
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                fuzzyResult, fuzzyConfidence, "Fuzzy matching"));
        }

        Intent fallbackResult = classifyWithKeywords(userMessage);
        if (fallbackResult != Intent.OTHER) {
            double fallbackConfidence = calculateKeywordConfidence(userMessage, fallbackResult);
            bestResult = updateBestResult(bestResult, new ClassificationResult(
                fallbackResult, fallbackConfidence, "Keyword matching"));
        }

        logger.info("Classified '{}' as {} with confidence {} using {}",
            userMessage, bestResult.intent, bestResult.confidence, bestResult.method);

        return bestResult.intent;
    }

    private ClassificationResult updateBestResult(ClassificationResult current, ClassificationResult candidate) {
        return candidate.confidence > current.confidence ? candidate : current;
    }

    private double calculateSynonymConfidence(String original, String expanded, Intent intent) {
        int originalWords = original.split("\\s+").length;
        int expandedWords = expanded.split("\\s+").length;
        double expansionBonus = Math.min(0.2, (expandedWords - originalWords) * 0.05);
        return 0.6 + expansionBonus;
    }

    private double calculateFuzzyConfidence(String original, Intent intent) {
        int fuzzyMatches = 0;
        String[] words = original.toLowerCase().split("\\s+");

        for (String word : words) {
            if (fuzzyMatcher.matchesFuzzy(word, "stock") ||
                fuzzyMatcher.matchesFuzzy(word, "transaction") ||
                fuzzyMatcher.matchesFuzzy(word, "inventory") ||
                fuzzyMatcher.matchesFuzzy(word, "forecast")) {
                fuzzyMatches++;
            }
        }

        return 0.5 + (fuzzyMatches * 0.1);
    }

    private double calculateKeywordConfidence(String original, Intent intent) {
        return 0.4;
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

    private Intent classifyWithFuzzyMatching(String fuzzyExpandedMessage) {
        String m = fuzzyExpandedMessage.toLowerCase(Locale.ROOT);

        if (fuzzyMatcher.containsFuzzyMatch(m, "transaction") &&
            (m.contains("filter") || m.contains("by") || m.contains("for") || m.contains("of"))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (fuzzyMatcher.containsFuzzyMatch(m, "transaction") ||
            fuzzyMatcher.containsFuzzyMatch(m, "recent") ||
            m.contains("movement") || m.contains("activity")) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (fuzzyMatcher.containsFuzzyMatch(m, "stock") &&
            (m.contains("low") || m.contains("reorder") || m.contains("restock"))) {
            return Intent.LOW_STOCK;
        }

        if (fuzzyMatcher.containsFuzzyMatch(m, "forecast") ||
            (m.contains("run") && m.contains("out")) ||
            (m.contains("predict") && (m.contains("when") || m.contains("stock")))) {
            return Intent.FORECAST_QUERIES;
        }

        if ((fuzzyMatcher.containsFuzzyMatch(m, "stock") ||
             fuzzyMatcher.containsFuzzyMatch(m, "inventory")) &&
            (fuzzyMatcher.containsFuzzyMatch(m, "level") ||
             m.contains("status") || m.contains("current"))) {
            return Intent.STOCK_SUMMARY;
        }

        return Intent.OTHER;
    }

    private Intent classifyWithSynonyms(String expandedMessage) {
        String m = expandedMessage.toLowerCase(Locale.ROOT);

        if (synonymProvider.containsIntentKeywords(m, "FILTERED_TRANSACTIONS")) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (synonymProvider.containsIntentKeywords(m, "RECENT_TRANSACTIONS")) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (synonymProvider.containsIntentKeywords(m, "LOW_STOCK")) {
            return Intent.LOW_STOCK;
        }

        if (synonymProvider.containsIntentKeywords(m, "FORECAST_QUERIES")) {
            return Intent.FORECAST_QUERIES;
        }

        if (synonymProvider.containsIntentKeywords(m, "STOCK_SUMMARY")) {
            return Intent.STOCK_SUMMARY;
        }

        return Intent.OTHER;
    }

    private Intent classifyWithKeywords(String userMessage) {
        String m = userMessage.toLowerCase(Locale.ROOT);

        if ((m.contains("transaction") || m.contains("transactions") || m.contains("history")) && (m.contains(" for ") || m.contains(" of ") || m.contains(" by "))) {
            return Intent.FILTERED_TRANSACTIONS;
        }

        if (m.contains("recent") || m.contains("recent movements") || m.contains("movements") || m.contains("activity")) {
            return Intent.RECENT_TRANSACTIONS;
        }

        if (m.contains("low stock") || m.contains("restock") || m.contains("restocking")) {
            return Intent.LOW_STOCK;
        }

        if (m.contains("forecast") || m.contains("runout") || m.contains("run out")) {
            return Intent.FORECAST_QUERIES;
        }

        if (m.contains("stock level") || m.contains("stock levels") || m.contains("inventory") || m.contains("in stock") || m.contains("what do i have")) {
            return Intent.STOCK_SUMMARY;
        }

        if (m.contains("stock")) {
            return Intent.STOCK_SUMMARY;
        }

        return Intent.OTHER;
    }

    public ClassificationDetails getDetailedClassification(String userMessage) {
        if (userMessage == null) {
            return new ClassificationDetails(Intent.OTHER, "Empty message", null, null, null);
        }

        SemanticIntentClassifier.IntentClassificationResult mlResult = null;
        if (semanticClassifier != null) {
            mlResult = semanticClassifier.classifyIntent(userMessage);
        }
        PhrasePatternMatcher.PatternMatchResult patternResult = patternMatcher.matchPattern(userMessage);
        String expandedMessage = synonymProvider.expandWithSynonyms(userMessage);
        Intent synonymResult = classifyWithSynonyms(expandedMessage);
        Intent keywordResult = classifyWithKeywords(userMessage);

        Intent finalIntent = Intent.OTHER;
        String explanation = "No classification method matched";

        if (mlResult != null && mlResult.isHighConfidence()) {
            finalIntent = mlResult.intent();
            explanation = String.format("ML classification (confidence: %.2f)", mlResult.confidence());
        } else if (patternResult.isHighConfidence()) {
            finalIntent = patternResult.intent();
            explanation = String.format("Pattern matching (confidence: %.2f)", patternResult.confidence());
        } else if (synonymResult != Intent.OTHER) {
            finalIntent = synonymResult;
            explanation = "Synonym-enhanced keyword matching";
        } else if (keywordResult != Intent.OTHER) {
            finalIntent = keywordResult;
            explanation = "Original keyword matching";
        }

        return new ClassificationDetails(finalIntent, explanation, mlResult, patternResult, expandedMessage);
    }

    public record ClassificationDetails(
        Intent finalIntent,
        String explanation,
        SemanticIntentClassifier.IntentClassificationResult mlResult,
        PhrasePatternMatcher.PatternMatchResult patternResult,
        String expandedMessage
    ) {}
}
