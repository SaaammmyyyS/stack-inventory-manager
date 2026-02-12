package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.model.Intent;
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
class AIIntentClassifierSimpleTest {

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
    void testEmptyMessage() {
        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent("");

        assertEquals(Intent.OTHER, result.intent());
        assertEquals(0.0, result.confidence());
        assertEquals("Empty message", result.explanation());
        assertFalse(result.usedAI());

        verifyNoInteractions(chatClient, ruleBasedClassifier);
    }

    @Test
    void testNullMessage() {
        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent(null);

        assertEquals(Intent.OTHER, result.intent());
        assertEquals(0.0, result.confidence());
        assertEquals("Empty message", result.explanation());
        assertFalse(result.usedAI());

        verifyNoInteractions(chatClient, ruleBasedClassifier);
    }

    @Test
    void testAIClassificationDisabled() {
        ReflectionTestUtils.setField(aiIntentClassifier, "aiClassificationEnabled", false);
        String userMessage = "Show stock levels";
        when(ruleBasedClassifier.classifyBasicIntent(userMessage)).thenReturn(Intent.STOCK_SUMMARY);

        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent(userMessage);

        assertEquals(Intent.STOCK_SUMMARY, result.intent());
        assertEquals(0.7, result.confidence());
        assertTrue(result.explanation().contains("Rule-based classification (AI disabled)"));
        assertFalse(result.usedAI());

        verify(ruleBasedClassifier).classifyBasicIntent(userMessage);
        verifyNoInteractions(chatClient);
    }

    @Test
    void testConversationalIntentCheck() {
        when(ruleBasedClassifier.isConversationalIntent(Intent.GREETING)).thenReturn(true);
        when(ruleBasedClassifier.isConversationalIntent(Intent.STOCK_SUMMARY)).thenReturn(false);

        assertTrue(aiIntentClassifier.isConversationalIntent(Intent.GREETING));
        assertFalse(aiIntentClassifier.isConversationalIntent(Intent.STOCK_SUMMARY));

        verify(ruleBasedClassifier).isConversationalIntent(Intent.GREETING);
        verify(ruleBasedClassifier).isConversationalIntent(Intent.STOCK_SUMMARY);
    }

    @Test
    void testHighConfidenceCheck() {
        AIIntentClassifier.ClassificationResult highResult =
            new AIIntentClassifier.ClassificationResult(Intent.STOCK_SUMMARY, 0.9, "test", true);
        AIIntentClassifier.ClassificationResult lowResult =
            new AIIntentClassifier.ClassificationResult(Intent.OTHER, 0.6, "test", false);

        assertTrue(aiIntentClassifier.isHighConfidence(highResult));
        assertFalse(aiIntentClassifier.isHighConfidence(lowResult));
    }

    @Test
    void testIsAIClassificationEnabled() {
        assertTrue(aiIntentClassifier.isAIClassificationEnabled());

        ReflectionTestUtils.setField(aiIntentClassifier, "aiClassificationEnabled", false);
        assertFalse(aiIntentClassifier.isAIClassificationEnabled());
    }

    @Test
    void testAIFailureFallbackToRuleBased() {
        String userMessage = "Show inventory";
        when(chatClient.prompt(any(String.class))).thenThrow(new RuntimeException("AI service unavailable"));
        when(ruleBasedClassifier.classifyBasicIntent(userMessage)).thenReturn(Intent.STOCK_SUMMARY);

        AIIntentClassifier.ClassificationResult result = aiIntentClassifier.classifyIntent(userMessage);

        assertEquals(Intent.STOCK_SUMMARY, result.intent());
        assertTrue(result.confidence() >= 0.6 && result.confidence() <= 0.8);
        assertFalse(result.usedAI());
        assertTrue(result.explanation().contains("Rule-based classification (AI classification error"));

        verify(ruleBasedClassifier).classifyBasicIntent(userMessage);
    }
}
