package com.inventory.saas.ai.service;

import com.inventory.saas.ai.context.ConversationContextManager;
import com.inventory.saas.ai.model.Intent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConversationManagerTest {

    private ConversationManager conversationManager;
    private ConversationContextManager contextManager;

    @BeforeEach
    void setUp() {
        contextManager = new ConversationContextManager();
        conversationManager = new ConversationManager(contextManager);
    }

    @Test
    void testGreetingResponses() {
        String response1 = conversationManager.handleConversationalIntent("tenant1", Intent.GREETING, "Hello");
        assertNotNull(response1);
        assertTrue(response1.toLowerCase().contains("hello") || response1.toLowerCase().contains("hi") ||
                  response1.toLowerCase().contains("good day") || response1.toLowerCase().contains("welcome") ||
                  response1.toLowerCase().contains("inventory"));

        String response2 = conversationManager.handleConversationalIntent("tenant1", Intent.GREETING, "Hi there");
        assertNotNull(response2);
        assertTrue(response2.toLowerCase().contains("hi") || response2.toLowerCase().contains("inventory"));
    }

    @Test
    void testFarewellResponses() {
        String response = conversationManager.handleConversationalIntent("tenant1", Intent.FAREWELL, "Goodbye");
        assertNotNull(response);
        assertTrue(response.toLowerCase().contains("goodbye") || response.toLowerCase().contains("see you") ||
                  response.toLowerCase().contains("take care") || response.toLowerCase().contains("farewell"));
        assertTrue(response.toLowerCase().contains("come back") || response.toLowerCase().contains("return") ||
                  response.toLowerCase().contains("always here"));
    }

    @Test
    void testThanksResponses() {
        String response = conversationManager.handleConversationalIntent("tenant1", Intent.THANKS, "Thank you");
        assertNotNull(response);
        assertTrue(response.toLowerCase().contains("welcome") || response.toLowerCase().contains("my pleasure") ||
                  response.toLowerCase().contains("happy to help") || response.toLowerCase().contains("no problem"));
        assertTrue(response.toLowerCase().contains("anything else") || response.toLowerCase().contains("inventory") ||
                  response.toLowerCase().contains("management needs"));
    }

    @Test
    void testHelpResponses() {
        String response = conversationManager.handleConversationalIntent("tenant1", Intent.HELP, "What can you do?");
        assertNotNull(response);
        assertTrue(response.toLowerCase().contains("stock"));
        assertTrue(response.toLowerCase().contains("transactions"));
        assertTrue(response.toLowerCase().contains("forecasts"));
        assertTrue(response.toLowerCase().contains("low stock"));
    }

    @Test
    void testSmallTalkResponses() {
        String response1 = conversationManager.handleConversationalIntent("tenant1", Intent.SMALL_TALK, "How are you?");
        assertNotNull(response1);
        assertTrue(response1.toLowerCase().contains("functioning") || response1.toLowerCase().contains("ready to help"));
        assertTrue(response1.toLowerCase().contains("inventory"));

        String response2 = conversationManager.handleConversationalIntent("tenant1", Intent.SMALL_TALK, "What's the weather?");
        assertNotNull(response2);
        assertTrue(response2.toLowerCase().contains("inventory management") || response2.toLowerCase().contains("focused on"));
        assertTrue(response2.toLowerCase().contains("stock") || response2.toLowerCase().contains("inventory"));
    }

    @Test
    void testClarificationResponses() {
        String response = conversationManager.handleConversationalIntent("tenant1", Intent.CLARIFICATION, "I don't understand");
        assertNotNull(response);
        assertTrue(response.toLowerCase().contains("clarify") || response.toLowerCase().contains("rephrase") ||
                  response.toLowerCase().contains("not sure") || response.toLowerCase().contains("specific") ||
                  response.toLowerCase().contains("understand") || response.toLowerCase().contains("following") ||
                  response.toLowerCase().contains("stock") || response.toLowerCase().contains("inventory"));
    }

    @Test
    void testIsConversationalIntent() {
        assertTrue(conversationManager.isConversationalIntent(Intent.GREETING));
        assertTrue(conversationManager.isConversationalIntent(Intent.FAREWELL));
        assertTrue(conversationManager.isConversationalIntent(Intent.THANKS));
        assertTrue(conversationManager.isConversationalIntent(Intent.HELP));
        assertTrue(conversationManager.isConversationalIntent(Intent.CLARIFICATION));
        assertTrue(conversationManager.isConversationalIntent(Intent.SMALL_TALK));

        assertFalse(conversationManager.isConversationalIntent(Intent.STOCK_SUMMARY));
        assertFalse(conversationManager.isConversationalIntent(Intent.RECENT_TRANSACTIONS));
        assertFalse(conversationManager.isConversationalIntent(Intent.LOW_STOCK));
        assertFalse(conversationManager.isConversationalIntent(Intent.FORECAST_QUERIES));
        assertFalse(conversationManager.isConversationalIntent(Intent.FILTERED_TRANSACTIONS));
        assertFalse(conversationManager.isConversationalIntent(Intent.OTHER));
    }

    @Test
    void testGetConversationalSuggestions() {
        var suggestions1 = conversationManager.getConversationalSuggestions(Intent.GREETING);
        assertNotNull(suggestions1);
        assertFalse(suggestions1.isEmpty());
        assertTrue(suggestions1.stream().anyMatch(s -> s.toLowerCase().contains("stock")) ||
                  suggestions1.stream().anyMatch(s -> s.toLowerCase().contains("inventory")));

        var suggestions2 = conversationManager.getConversationalSuggestions(Intent.HELP);
        assertNotNull(suggestions2);
        assertFalse(suggestions2.isEmpty());
        assertTrue(suggestions2.stream().anyMatch(s -> s.toLowerCase().contains("inventory")) ||
                  suggestions2.stream().anyMatch(s -> s.toLowerCase().contains("stock")));

        var suggestions3 = conversationManager.getConversationalSuggestions(Intent.OTHER);
        assertNotNull(suggestions3);
        assertFalse(suggestions3.isEmpty());
        assertTrue(suggestions3.stream().anyMatch(s -> s.toLowerCase().contains("stock")) ||
                  suggestions3.stream().anyMatch(s -> s.toLowerCase().contains("inventory")));
    }
}
