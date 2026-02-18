package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.extraction.EntityExtractor;
import com.inventory.saas.ai.model.Intent;
import com.inventory.saas.ai.service.ConversationManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIIntentClassifierIntegrationTest {

    @Mock
    private ChatClient chatClient;

    @Mock
    private IntentClassifier ruleBasedClassifier;

    private AIIntentClassifier aiIntentClassifier;

    @BeforeEach
    void setUp() {
        aiIntentClassifier = new AIIntentClassifier(chatClient, ruleBasedClassifier, null);
    }

    @Test
    void testBasicClassificationFlow() {
        String userMessage = "Hello";
        when(ruleBasedClassifier.classifyBasicIntent(userMessage)).thenReturn(Intent.GREETING);

        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent(userMessage);

        assertEquals(Intent.GREETING, result.intent());
        assertTrue(result.confidence() >= 0.6);
        assertFalse(result.usedAI());
        assertTrue(result.explanation().contains("AI classification error"));

        verify(ruleBasedClassifier).classifyBasicIntent(userMessage);
    }

    @Test
    void testConversationalIntentDelegation() {
        when(ruleBasedClassifier.isConversationalIntent(Intent.GREETING)).thenReturn(true);
        when(ruleBasedClassifier.isConversationalIntent(Intent.STOCK_SUMMARY)).thenReturn(false);

        assertTrue(aiIntentClassifier.isConversationalIntent(Intent.GREETING));
        assertFalse(aiIntentClassifier.isConversationalIntent(Intent.STOCK_SUMMARY));

        verify(ruleBasedClassifier).isConversationalIntent(Intent.GREETING);
        verify(ruleBasedClassifier).isConversationalIntent(Intent.STOCK_SUMMARY);
    }

    @Test
    void testHighConfidenceThreshold() {
        AIIntentClassifier.ClassificationResult highConfidenceResult =
            new AIIntentClassifier.ClassificationResult(Intent.STOCK_SUMMARY, 0.9, "test", true);
        AIIntentClassifier.ClassificationResult lowConfidenceResult =
            new AIIntentClassifier.ClassificationResult(Intent.OTHER, 0.6, "test", false);

        assertTrue(aiIntentClassifier.isHighConfidence(highConfidenceResult));
        assertFalse(aiIntentClassifier.isHighConfidence(lowConfidenceResult));
    }

    @Test
    void testNullHandling() {
        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent(null);

        assertEquals(Intent.OTHER, result.intent());
        assertEquals(0.0, result.confidence());
        assertEquals("Empty message", result.explanation());
        assertFalse(result.usedAI());
    }
}
