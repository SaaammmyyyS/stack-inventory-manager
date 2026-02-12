package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EnhancedIntentClassifierTest {

    private InventorySynonymProvider synonymProvider;
    private PhrasePatternMatcher patternMatcher;
    private FuzzyStringMatcher fuzzyMatcher;
    private IntentClassifier intentClassifier;

    @BeforeEach
    void setUp() {
        synonymProvider = new InventorySynonymProvider();
        patternMatcher = new PhrasePatternMatcher();
        fuzzyMatcher = new FuzzyStringMatcher();

        intentClassifier = new IntentClassifier(null, synonymProvider, patternMatcher, fuzzyMatcher);
    }

    @Test
    void testStockSummaryVariations() {
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("show me stock levels"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("what do I have in inventory"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("current inventory status"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("how many items are available"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("what's in stock"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("inventory overview"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("show me my products"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("current goods count"));
    }

    @Test
    void testRecentTransactionsVariations() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("recent stock movements"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("what's been happening with inventory"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("latest activity"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("recent changes"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("transaction history"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("what's updated recently"));
    }

    @Test
    void testLowStockVariations() {
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("low stock items"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("what needs to be restocked"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("items running low"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("depleted products"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("need to order"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("show me recent low stock"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("stock alert"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("insufficient inventory"));
    }

    @Test
    void testForecastQueriesVariations() {
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("forecast"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("when will items run out"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("predict stock needs"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("future inventory requirements"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("run out date"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("how many days until empty"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("stock projection"));
    }

    @Test
    void testFilteredTransactionsVariations() {
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("transactions by John"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("history for product X"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("show movements by user"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("activity for specific item"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("filter transactions by person"));
    }

    @Test
    void testProblematicCasesFromUserScenario() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent stock"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("low stock"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("stock level"));
    }

    @Test
    void testSynonymExpansion() {
        String expanded = synonymProvider.expandWithSynonyms("show me my goods");
        assertTrue(expanded.contains("inventory"));
        assertTrue(expanded.contains("stock"));
        assertTrue(expanded.contains("items"));

        expanded = synonymProvider.expandWithSynonyms("when will we run out");
        assertTrue(expanded.contains("forecast"));
        assertTrue(expanded.contains("prediction"));
    }

    @Test
    void testPatternMatching() {
        PhrasePatternMatcher.PatternMatchResult result = patternMatcher.matchPattern("what do I have inventory");
        assertEquals(Intent.STOCK_SUMMARY, result.intent());
        assertTrue(result.confidence() >= 0.8);

        result = patternMatcher.matchPattern("show me recent stock movements");
        assertEquals(Intent.RECENT_TRANSACTIONS, result.intent());
        assertTrue(result.confidence() >= 0.8);

        result = patternMatcher.matchPattern("which items need to be reordered");
        assertEquals(Intent.LOW_STOCK, result.intent());
        assertTrue(result.confidence() >= 0.8);
    }

    @Test
    void testMLClassificationFallback() {
        Intent result = intentClassifier.classifyBasicIntent("show me inventory levels");
        assertEquals(Intent.STOCK_SUMMARY, result);
    }

    @Test
    void testDetailedClassification() {
        IntentClassifier.ClassificationDetails details = intentClassifier.getDetailedClassification("show me stock levels");

        assertNotNull(details);
        assertEquals(Intent.STOCK_SUMMARY, details.finalIntent());
        assertNotNull(details.explanation());
        assertNotNull(details.patternResult());
        assertNotNull(details.expandedMessage());
    }

    @Test
    void testEdgeCases() {
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent(""));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent(null));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent("what's the weather"));
    }

    @Test
    void testTypoTolerance() {
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("show me stok levels"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("recent transactons"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("low stok items"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("forcast prediction"));
    }

    @Test
    void testNaturalLanguageVariations() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("I'd like to see what's been happening"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("are there any items I need to order"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("predict when I'll need more"));
    }

    @Test
    void testFuzzyMatchingCapabilities() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me transactons"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("recent transactons"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("show me stok levels"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("stok lvl"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("low stok items"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("forcast prediction"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("forcast when run out"));
    }

    @Test
    void testContextAwareSynonymExpansion() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent stock"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("show me recent low stock"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("current inventory status"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("predict stock depletion"));
    }

    @Test
    void testStandaloneTransactionPatterns() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("movements"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("history"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("activity"));
    }

    @Test
    void testConfidenceBasedDecisionFusion() {
        IntentClassifier.ClassificationDetails details = intentClassifier.getDetailedClassification("show me transactions");

        assertNotNull(details);
        assertEquals(Intent.RECENT_TRANSACTIONS, details.finalIntent());
        assertTrue(details.explanation().contains("Pattern matching") ||
                  details.explanation().contains("Fuzzy matching") ||
                  details.explanation().contains("Synonym-enhanced"));
    }

    @Test
    void testProblematicUserScenarios() {
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("show me recent stock"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("low stock"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("stock level"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("forecasts"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("show me recent low stock"));
    }

    @Test
    void testFuzzyStringMatcherDirectly() {
        assertTrue(fuzzyMatcher.matchesFuzzy("stok", "stock"));
        assertTrue(fuzzyMatcher.matchesFuzzy("transacton", "transaction"));
        assertTrue(fuzzyMatcher.matchesFuzzy("inventry", "inventory"));
        assertTrue(fuzzyMatcher.matchesFuzzy("lvl", "level"));
        assertTrue(fuzzyMatcher.matchesFuzzy("forcast", "forecast"));

        String expanded = fuzzyMatcher.expandWithFuzzyMatching("show me stok transactons");
        assertTrue(expanded.contains("stock"));
        assertTrue(expanded.contains("transaction"));
    }
}
