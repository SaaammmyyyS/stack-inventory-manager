package com.inventory.saas.ai.intent;

import com.inventory.saas.ai.extraction.EntityExtractor;
import com.inventory.saas.ai.model.Intent;
import com.inventory.saas.ai.service.ConversationManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IntentClassifierTest {

    private IntentClassifier intentClassifier;
    private MLIntentClassifier mlClassifier;

    @BeforeEach
    void setUp() {
        // Note: In a real implementation, this would load the trained model
        // For now, we'll test the fallback behavior
        mlClassifier = new MLIntentClassifier();
        ConversationManager conversationManager = mock(ConversationManager.class);
        EntityExtractor entityExtractor = mock(EntityExtractor.class);
        intentClassifier = new IntentClassifier(conversationManager, entityExtractor);
    }

    @Test
    void testConversationalIntents() {
        assertEquals(Intent.GREETING, intentClassifier.classifyBasicIntent("Hello"));
        assertEquals(Intent.GREETING, intentClassifier.classifyBasicIntent("Hi there"));
        assertEquals(Intent.GREETING, intentClassifier.classifyBasicIntent("Good morning"));

        assertEquals(Intent.FAREWELL, intentClassifier.classifyBasicIntent("Goodbye"));
        assertEquals(Intent.FAREWELL, intentClassifier.classifyBasicIntent("See you later"));

        assertEquals(Intent.THANKS, intentClassifier.classifyBasicIntent("Thank you"));
        assertEquals(Intent.THANKS, intentClassifier.classifyBasicIntent("Thanks a lot"));

        assertEquals(Intent.HELP, intentClassifier.classifyBasicIntent("What can you do?"));
        assertEquals(Intent.HELP, intentClassifier.classifyBasicIntent("I need help"));

        assertEquals(Intent.CLARIFICATION, intentClassifier.classifyBasicIntent("I don't understand"));
        assertEquals(Intent.CLARIFICATION, intentClassifier.classifyBasicIntent("Can you clarify?"));

        assertEquals(Intent.SMALL_TALK, intentClassifier.classifyBasicIntent("How are you?"));
        assertEquals(Intent.SMALL_TALK, intentClassifier.classifyBasicIntent("What's the weather?"));
    }

    @Test
    void testInventoryIntents() {
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("Show me stock levels"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("What do I have in inventory"));
        assertEquals(Intent.STOCK_SUMMARY, intentClassifier.classifyBasicIntent("Current inventory status"));

        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("Show me recent transactions"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("Recent stock movements"));
        assertEquals(Intent.RECENT_TRANSACTIONS, intentClassifier.classifyBasicIntent("What's been happening with inventory"));

        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("Low stock items"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("What needs to be restocked"));
        assertEquals(Intent.LOW_STOCK, intentClassifier.classifyBasicIntent("Items running low"));

        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("Forecast"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("When will items run out"));
        assertEquals(Intent.FORECAST_QUERIES, intentClassifier.classifyBasicIntent("Predict stock needs"));

        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("Transactions by John"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("History for product X"));
        assertEquals(Intent.FILTERED_TRANSACTIONS, intentClassifier.classifyBasicIntent("Show movements by user"));
    }

    @Test
    void testEdgeCases() {
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent(null));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent(""));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent("   "));

        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent("Tell me a joke"));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent("Who won the game?"));
        assertEquals(Intent.OTHER, intentClassifier.classifyBasicIntent("What's the capital of France?"));
    }

    @Test
    void testIsConversationalIntent() {
        assertTrue(intentClassifier.isConversationalIntent(Intent.GREETING));
        assertTrue(intentClassifier.isConversationalIntent(Intent.FAREWELL));
        assertTrue(intentClassifier.isConversationalIntent(Intent.THANKS));
        assertTrue(intentClassifier.isConversationalIntent(Intent.HELP));
        assertTrue(intentClassifier.isConversationalIntent(Intent.CLARIFICATION));
        assertTrue(intentClassifier.isConversationalIntent(Intent.SMALL_TALK));

        assertFalse(intentClassifier.isConversationalIntent(Intent.STOCK_SUMMARY));
        assertFalse(intentClassifier.isConversationalIntent(Intent.RECENT_TRANSACTIONS));
        assertFalse(intentClassifier.isConversationalIntent(Intent.LOW_STOCK));
        assertFalse(intentClassifier.isConversationalIntent(Intent.FORECAST_QUERIES));
        assertFalse(intentClassifier.isConversationalIntent(Intent.FILTERED_TRANSACTIONS));
        assertFalse(intentClassifier.isConversationalIntent(Intent.OTHER));
    }

    @Test
    void testDetailedClassification() {
        var details = intentClassifier.getDetailedClassification("Show me stock levels");
        assertNotNull(details);
        assertEquals(Intent.STOCK_SUMMARY, details.finalIntent());
        assertTrue(details.explanation().contains("simplified 3-layer hierarchy"));

        var conversationalDetails = intentClassifier.getDetailedClassification("Hello");
        assertNotNull(conversationalDetails);
        assertEquals(Intent.GREETING, conversationalDetails.finalIntent());
        assertTrue(conversationalDetails.explanation().contains("simplified 3-layer hierarchy"));
    }
}
