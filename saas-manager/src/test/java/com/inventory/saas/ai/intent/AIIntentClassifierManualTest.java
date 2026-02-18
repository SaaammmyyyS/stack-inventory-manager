package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AIIntentClassifierManualTest {

    @Test
    void testManualAIIntentClassifier() {
        AIIntentClassifier classifier = new AIIntentClassifier(null, null, null);

        assertTrue(classifier.isAIClassificationEnabled());

        AIIntentClassifier.ClassificationResult result =
            new AIIntentClassifier.ClassificationResult(Intent.STOCK_SUMMARY, 0.8, "test", true);

        assertEquals(Intent.STOCK_SUMMARY, result.intent());
        assertEquals(0.8, result.confidence());
        assertEquals("test", result.explanation());
        assertTrue(result.usedAI());
    }

    @Test
    void testManualAIIntentClassifierDisabled() {
        AIIntentClassifier classifier = new AIIntentClassifier(null, null, null);

        try {
            java.lang.reflect.Field enabledField = AIIntentClassifier.class.getDeclaredField("aiClassificationEnabled");
            enabledField.setAccessible(true);
            enabledField.set(classifier, false);

            assertFalse(classifier.isAIClassificationEnabled());
        } catch (Exception e) {
            fail("Should be able to disable AI classification: " + e.getMessage());
        }
    }

    @Test
    void testManualAIIntentClassifierWithMocks() {
        AIIntentClassifier classifier = new AIIntentClassifier(null, null, null);

        AIIntentClassifier.ClassificationResult nullResult = classifier.classifyIntent(null);
        assertEquals(Intent.OTHER, nullResult.intent());
        assertEquals(0.0, nullResult.confidence());
        assertEquals("Empty message", nullResult.explanation());
        assertFalse(nullResult.usedAI());
    }
}
