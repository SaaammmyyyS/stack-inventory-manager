package com.inventory.saas.ai.context;

import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConversationContextManager {

    private static final Logger logger = LoggerFactory.getLogger(ConversationContextManager.class);

    private final Map<String, ConversationContext> contextMap = new ConcurrentHashMap<>();

    private static final long CONTEXT_EXPIRY_MINUTES = 30;

    public void addUserMessage(String tenantId, String message, Intent detectedIntent, Map<String, String> entities) {
        ConversationContext context = getOrCreateContext(tenantId);

        ConversationMessage userMessage = new ConversationMessage(
            message,
            MessageType.USER,
            detectedIntent,
            entities,
            LocalDateTime.now()
        );

        context.addMessage(userMessage);
        context.incrementMessageCount();

        logger.debug("Added user message to context for tenant {}: {}", tenantId, message);
    }

    public void addAssistantResponse(String tenantId, String response, Intent respondingToIntent) {
        ConversationContext context = getOrCreateContext(tenantId);

        ConversationMessage assistantMessage = new ConversationMessage(
            response,
            MessageType.ASSISTANT,
            respondingToIntent,
            new HashMap<>(),
            LocalDateTime.now()
        );

        context.addMessage(assistantMessage);

        logger.debug("Added assistant response to context for tenant {}", tenantId);
    }

    public ConversationContext getContext(String tenantId) {
        return contextMap.get(tenantId);
    }

    public List<ConversationMessage> getRecentMessages(String tenantId, int count) {
        ConversationContext context = contextMap.get(tenantId);
        if (context == null) {
            return new ArrayList<>();
        }

        List<ConversationMessage> messages = context.getMessages();
        int size = messages.size();

        if (size <= count) {
            return new ArrayList<>(messages);
        }

        return new ArrayList<>(messages.subList(size - count, size));
    }

    public Intent getLastIntent(String tenantId) {
        ConversationContext context = contextMap.get(tenantId);
        if (context == null) {
            return Intent.OTHER;
        }

        return context.getLastIntent();
    }

    public boolean isFollowUpQuestion(String tenantId, String currentMessage) {
        ConversationContext context = contextMap.get(tenantId);
        if (context == null || context.getMessages().isEmpty()) {
            return false;
        }

        String lowerMessage = currentMessage.toLowerCase();

        List<String> followUpIndicators = Arrays.asList(
            "what about", "how about", "and", "also", "what if", "what else",
            "tell me more", "show me", "can you", "could you", "would you",
            "what's the", "how many", "which one", "any", "some"
        );

        for (String indicator : followUpIndicators) {
            if (lowerMessage.contains(indicator)) {
                return true;
            }
        }

        if (currentMessage.trim().split("\\s+").length <= 3 && context.getMessageCount() > 1) {
            return true;
        }

        return false;
    }

    public List<String> getContextualSuggestions(String tenantId) {
        ConversationContext context = contextMap.get(tenantId);
        if (context == null || context.getMessages().isEmpty()) {
            return getDefaultSuggestions();
        }

        List<String> suggestions = new ArrayList<>();
        Intent lastIntent = context.getLastIntent();

        switch (lastIntent) {
            case STOCK_SUMMARY:
                suggestions.addAll(Arrays.asList(
                    "Show me low stock items",
                    "What are the recent transactions?",
                    "Get inventory forecasts"
                ));
                break;

            case RECENT_TRANSACTIONS:
                suggestions.addAll(Arrays.asList(
                    "Filter transactions by person",
                    "Check current stock levels",
                    "Show low stock items"
                ));
                break;

            case LOW_STOCK:
                suggestions.addAll(Arrays.asList(
                    "Show inventory forecasts",
                    "View recent transactions",
                    "Check current stock levels"
                ));
                break;

            case FORECAST_QUERIES:
                suggestions.addAll(Arrays.asList(
                    "Show low stock items",
                    "Check recent transactions",
                    "View current inventory"
                ));
                break;

            case FILTERED_TRANSACTIONS:
                suggestions.addAll(Arrays.asList(
                    "Show all recent transactions",
                    "Check stock levels",
                    "View inventory forecasts"
                ));
                break;

            default:
                suggestions = getDefaultSuggestions();
        }

        return suggestions;
    }

    public void clearContext(String tenantId) {
        contextMap.remove(tenantId);
        logger.debug("Cleared conversation context for tenant {}", tenantId);
    }

    public void cleanupExpiredContexts() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(CONTEXT_EXPIRY_MINUTES);

        Iterator<Map.Entry<String, ConversationContext>> iterator = contextMap.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, ConversationContext> entry = iterator.next();
            ConversationContext context = entry.getValue();

            if (context.getLastActivity().isBefore(cutoff)) {
                iterator.remove();
                logger.debug("Removed expired context for tenant {}", entry.getKey());
            }
        }
    }

    private ConversationContext getOrCreateContext(String tenantId) {
        return contextMap.computeIfAbsent(tenantId, k -> new ConversationContext());
    }

    private List<String> getDefaultSuggestions() {
        return Arrays.asList(
            "Show current stock levels",
            "View recent transactions",
            "Check low stock items",
            "Get inventory forecasts"
        );
    }

    public static class ConversationContext {
        private final List<ConversationMessage> messages = new ArrayList<>();
        private int messageCount = 0;
        private LocalDateTime lastActivity = LocalDateTime.now();

        public void addMessage(ConversationMessage message) {
            messages.add(message);
            lastActivity = LocalDateTime.now();
        }

        public List<ConversationMessage> getMessages() {
            return new ArrayList<>(messages);
        }

        public int getMessageCount() {
            return messageCount;
        }

        public void incrementMessageCount() {
            messageCount++;
        }

        public LocalDateTime getLastActivity() {
            return lastActivity;
        }

        public Intent getLastIntent() {
            if (messages.isEmpty()) {
                return Intent.OTHER;
            }

            for (int i = messages.size() - 1; i >= 0; i--) {
                ConversationMessage message = messages.get(i);
                if (message.type() == MessageType.USER) {
                    return message.intent();
                }
            }

            return Intent.OTHER;
        }
    }

    public record ConversationMessage(
        String content,
        MessageType type,
        Intent intent,
        Map<String, String> entities,
        LocalDateTime timestamp
    ) {}

    public enum MessageType {
        USER,
        ASSISTANT
    }
}
