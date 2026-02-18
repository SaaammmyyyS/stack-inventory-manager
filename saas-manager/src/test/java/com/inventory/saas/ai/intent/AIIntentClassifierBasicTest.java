package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIIntentClassifierBasicTest {

    @Test
    void testAIIntentClassifierCreation() {
        AIIntentClassifier classifier = new AIIntentClassifier(null, null, null);

        assertNotNull(classifier);

        try {
            classifier.isAIClassificationEnabled();
            classifier.classifyIntent("test");
        } catch (Exception e) {
            fail("AIIntentClassifier should not throw exception: " + e.getMessage());
        }
    }

    @Test
    void testClassificationResultRecord() {
        AIIntentClassifier.ClassificationResult result =
            new AIIntentClassifier.ClassificationResult(Intent.STOCK_SUMMARY, 0.8, "test", true);

        assertEquals(Intent.STOCK_SUMMARY, result.intent());
        assertEquals(0.8, result.confidence());
        assertEquals("test", result.explanation());
        assertTrue(result.usedAI());
    }
}
