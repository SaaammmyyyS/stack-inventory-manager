package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;

import static org.junit.jupiter.api.Assertions.*;

class MLIntentClassifierTest {

    private MLIntentClassifier mlClassifier;

    @BeforeEach
    void setUp() {
        // Note: In a real implementation, this would load the trained model
        // For now, we'll test the fallback behavior
        mlClassifier = new MLIntentClassifier();
    }

    @Test
    void testConversationalIntentClassification() {
        MLIntentClassifier.ClassificationResult result1 = mlClassifier.classifyIntent("Hello");
        assertEquals(Intent.GREETING, result1.intent());
        assertTrue(result1.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result2 = mlClassifier.classifyIntent("Thank you for your help");
        assertEquals(Intent.THANKS, result2.intent());
        assertTrue(result2.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result3 = mlClassifier.classifyIntent("What can you do?");
        assertEquals(Intent.HELP, result3.intent());
        assertTrue(result3.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result4 = mlClassifier.classifyIntent("Goodbye!");
        assertEquals(Intent.FAREWELL, result4.intent());
        assertTrue(result4.confidence() > 0.7);
    }

    @Test
    void testInventoryIntentClassification() {
        MLIntentClassifier.ClassificationResult result1 = mlClassifier.classifyIntent("Show me current stock levels");
        assertEquals(Intent.STOCK_SUMMARY, result1.intent());
        assertTrue(result1.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result2 = mlClassifier.classifyIntent("What are the recent transactions?");
        assertEquals(Intent.RECENT_TRANSACTIONS, result2.intent());
        assertTrue(result2.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result3 = mlClassifier.classifyIntent("Items running low on stock");
        assertEquals(Intent.LOW_STOCK, result3.intent());
        assertTrue(result3.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result4 = mlClassifier.classifyIntent("When will we run out of stock?");
        assertEquals(Intent.FORECAST_QUERIES, result4.intent());
        assertTrue(result4.confidence() > 0.7);

        MLIntentClassifier.ClassificationResult result5 = mlClassifier.classifyIntent("Show transactions by John");
        assertEquals(Intent.FILTERED_TRANSACTIONS, result5.intent());
        assertTrue(result5.confidence() > 0.7);
    }

    @Test
    void testEmptyAndNullMessages() {
        MLIntentClassifier.ClassificationResult result1 = mlClassifier.classifyIntent(null);
        assertEquals(Intent.OTHER, result1.intent());
        assertEquals(0.0, result1.confidence());

        MLIntentClassifier.ClassificationResult result2 = mlClassifier.classifyIntent("");
        assertEquals(Intent.OTHER, result2.intent());
        assertEquals(0.0, result2.confidence());

        MLIntentClassifier.ClassificationResult result3 = mlClassifier.classifyIntent("   ");
        assertEquals(Intent.OTHER, result3.intent());
        assertEquals(0.0, result3.confidence());
    }

    @Test
    void testHighConfidenceCheck() {
        MLIntentClassifier.ClassificationResult highResult = new MLIntentClassifier.ClassificationResult(
            Intent.STOCK_SUMMARY, 0.8, "Test"
        );
        assertTrue(mlClassifier.isHighConfidence(highResult));

        MLIntentClassifier.ClassificationResult lowResult = new MLIntentClassifier.ClassificationResult(
            Intent.OTHER, 0.6, "Test"
        );
        assertFalse(mlClassifier.isHighConfidence(lowResult));
    }

    @Test
    void testConversationalIntentCheck() {
        assertTrue(mlClassifier.isConversationalIntent(Intent.GREETING));
        assertTrue(mlClassifier.isConversationalIntent(Intent.FAREWELL));
        assertTrue(mlClassifier.isConversationalIntent(Intent.THANKS));
        assertTrue(mlClassifier.isConversationalIntent(Intent.HELP));
        assertTrue(mlClassifier.isConversationalIntent(Intent.CLARIFICATION));
        assertTrue(mlClassifier.isConversationalIntent(Intent.SMALL_TALK));

        assertFalse(mlClassifier.isConversationalIntent(Intent.STOCK_SUMMARY));
        assertFalse(mlClassifier.isConversationalIntent(Intent.RECENT_TRANSACTIONS));
        assertFalse(mlClassifier.isConversationalIntent(Intent.LOW_STOCK));
        assertFalse(mlClassifier.isConversationalIntent(Intent.FORECAST_QUERIES));
        assertFalse(mlClassifier.isConversationalIntent(Intent.FILTERED_TRANSACTIONS));
        assertFalse(mlClassifier.isConversationalIntent(Intent.OTHER));
    }
}
