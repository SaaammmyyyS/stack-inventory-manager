package com.inventory.saas.ai.service;

import com.inventory.saas.ai.context.ConversationContextManager;
import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
public class ConversationManager {

    private static final Logger logger = LoggerFactory.getLogger(ConversationManager.class);
    private final ConversationContextManager contextManager;
    private final Random random = new Random();

    public ConversationManager(ConversationContextManager contextManager) {
        this.contextManager = contextManager;
    }

    public String handleConversationalIntent(String tenantId, Intent intent, String message) {
        logger.debug("Handling conversational intent {} for tenant {}", intent, tenantId);

        String response = generateResponse(intent, message);
        
        contextManager.addAssistantResponse(tenantId, response, intent);

        return response;
    }

    private String generateResponse(Intent intent, String message) {
        return switch (intent) {
            case GREETING -> generateGreetingResponse();
            case FAREWELL -> generateFarewellResponse();
            case THANKS -> generateThanksResponse();
            case HELP -> generateHelpResponse();
            case CLARIFICATION -> generateClarificationResponse();
            case SMALL_TALK -> generateSmallTalkResponse(message);
            default -> "I'm here to help with your inventory management. What would you like to know?";
        };
    }

    private String generateGreetingResponse() {
        List<String> greetings = Arrays.asList(
            "Hello! I'm your inventory assistant. How can I help you today?",
            "Hi there! I can help you check stock levels, view transactions, see forecasts, and more. What would you like to do?",
            "Good day! I'm ready to assist with your inventory management needs. What can I help you with?",
            "Welcome! I'm here to help you manage your inventory. Ask me about stock levels, recent movements, or forecasts."
        );
        return greetings.get(random.nextInt(greetings.size()));
    }

    private String generateFarewellResponse() {
        List<String> farewells = Arrays.asList(
            "Goodbye! Feel free to come back anytime you need inventory assistance.",
            "See you later! Don't hesitate to return if you need help with your inventory.",
            "Take care! I'm always here when you need inventory management help.",
            "Farewell! Have a great day and come back soon for any inventory needs."
        );
        return farewells.get(random.nextInt(farewells.size()));
    }

    private String generateThanksResponse() {
        List<String> thanks = Arrays.asList(
            "You're welcome! Is there anything else I can help you with regarding your inventory?",
            "My pleasure! What other inventory questions do you have?",
            "Happy to help! Feel free to ask if you need anything else.",
            "No problem! I'm here to assist with all your inventory management needs."
        );
        return thanks.get(random.nextInt(thanks.size()));
    }

    private String generateHelpResponse() {
        return """
            I can help you with various inventory management tasks:

            📦 **Stock Information**: Check current inventory levels, see what's in stock
            📊 **Recent Activity**: View recent stock movements and transaction history
            ⚠️ **Low Stock Alerts**: Identify items that need restocking
            📈 **Forecasts**: Predict when items will run out and future stock needs
            🔍 **Filtered Views**: Search transactions by person or specific items

            Just ask me naturally, like "show me stock levels" or "what needs to be restocked?"
            """;
    }

    private String generateClarificationResponse() {
        List<String> clarifications = Arrays.asList(
            "I'm not sure I understand. Could you rephrase that? You can ask about stock levels, transactions, forecasts, or low stock items.",
            "I want to help but need clarification. Try asking about inventory status, recent movements, or stock forecasts.",
            "Could you be more specific? I can help with stock levels, transaction history, low stock alerts, or inventory forecasts.",
            "I'm not following. Try asking like 'show me inventory' or 'recent transactions' or 'what needs restocking?'"
        );
        return clarifications.get(random.nextInt(clarifications.size()));
    }

    private String generateSmallTalkResponse(String message) {
        String lowerMessage = message.toLowerCase();

        if (lowerMessage.contains("how are you")) {
            return "I'm functioning perfectly and ready to help with your inventory management! What can I assist you with today?";
        }

        if (lowerMessage.contains("what can you do")) {
            return generateHelpResponse();
        }

        if (lowerMessage.contains("who are you")) {
            return "I'm your AI inventory assistant, designed to help you manage stock levels, track transactions, and provide forecasts. I'm here to make inventory management easier for you!";
        }

        if (lowerMessage.contains("weather") || lowerMessage.contains("time")) {
            return "I'm focused on helping you with inventory management. For weather or time information, you might want to check a weather app or clock. How can I help with your inventory instead?";
        }

        List<String> generalResponses = Arrays.asList(
            "That's interesting! While I'm specialized in inventory management, I'm here to help you with stock levels, transactions, and forecasts. What inventory task can I assist with?",
            "I appreciate the conversation! I'm designed to help with inventory management - things like checking stock levels, viewing recent movements, or identifying low stock items. What would you like to know?",
            "Thanks for chatting! My expertise is in inventory management. I can help you track stock, view transactions, see forecasts, and more. What inventory question do you have?"
        );

        return generalResponses.get(random.nextInt(generalResponses.size()));
    }

    public boolean isConversationalIntent(Intent intent) {
        return switch (intent) {
            case GREETING, FAREWELL, THANKS, HELP, CLARIFICATION, SMALL_TALK -> true;
            default -> false;
        };
    }

    public List<String> getConversationalSuggestions(Intent lastIntent) {
        return switch (lastIntent) {
            case GREETING -> Arrays.asList(
                "Show current stock levels",
                "View recent transactions",
                "Check low stock items",
                "Get inventory forecasts"
            );
            case HELP -> Arrays.asList(
                "What's in stock?",
                "Recent movements",
                "Items to restock",
                "Stock forecasts"
            );
            case THANKS -> Arrays.asList(
                "Show inventory status",
                "Recent activity",
                "Low stock alerts",
                "Future predictions"
            );
            default -> Arrays.asList(
                "Show stock levels",
                "Recent transactions",
                "Low stock items",
                "Inventory forecasts"
            );
        };
    }
}
