package com.inventory.saas.ai.intent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.ai.model.Intent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Random;

@Component
public class AIIntentClassifier {

    private static final Logger logger = LoggerFactory.getLogger(AIIntentClassifier.class);

    private static final double HIGH_CONFIDENCE_THRESHOLD = 0.8;
    private static final double MEDIUM_CONFIDENCE_THRESHOLD = 0.5;

    private final ChatClient chatClient;
    private final IntentClassifier ruleBasedClassifier;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    @Value("${ai.intent.classification.enabled:true}")
    private boolean aiClassificationEnabled;

    @Value("${ai.intent.classification.cache-ttl:300}")
    private int cacheTtl;

    public AIIntentClassifier(ChatClient chatClient,
                           IntentClassifier ruleBasedClassifier,
                           ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.ruleBasedClassifier = ruleBasedClassifier;
        this.objectMapper = objectMapper;
        this.aiClassificationEnabled = true;
    }

    @Cacheable(value = "intent-classification", key = "#userMessage.hashCode()", unless = "#result == null")
    public ClassificationResult classifyIntent(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new ClassificationResult(Intent.OTHER, 0.0, "Empty message", false);
        }

        if (!aiClassificationEnabled) {
            logger.debug("AI classification disabled, using rule-based classifier for: '{}'", userMessage);
            if (ruleBasedClassifier != null) {
                Intent ruleIntent = ruleBasedClassifier.classifyBasicIntent(userMessage);
                return new ClassificationResult(ruleIntent, 0.7, "Rule-based classification (AI disabled)", false);
            } else {
                return new ClassificationResult(Intent.OTHER, 0.5, "AI disabled and no rule-based classifier", false);
            }
        }

        try {
            logger.debug("Classifying intent with AI for message: '{}'", userMessage);

            String classificationPrompt = buildClassificationPrompt(userMessage);

            ChatResponse response = chatClient.prompt()
                    .user(classificationPrompt)
                    .call()
                    .chatResponse();

            if (response == null || response.getResult() == null) {
                logger.warn("AI returned null response, falling back to rule-based classification");
                return fallbackToRuleBased(userMessage, "AI returned null response");
            }

            String aiResponse = response.getResult().getOutput().getContent();
            logger.debug("AI classification response: '{}'", aiResponse);

            AIResponse parsed = parseAIResponse(aiResponse);
            if (parsed == null) {
                logger.warn("Failed to parse AI response, falling back to rule-based classification");
                return fallbackToRuleBased(userMessage, "Failed to parse AI response");
            }

            Intent aiIntent = parseIntent(parsed.intent());
            double confidence = parsed.confidence();

            if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
                logger.info("AI classified '{}' as {} with high confidence {}", userMessage, aiIntent, confidence);
                return new ClassificationResult(aiIntent, confidence, "AI classification (high confidence)", true);
            } else if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) {
                if (ruleBasedClassifier != null) {
                    Intent ruleIntent = ruleBasedClassifier.classifyBasicIntent(userMessage);
                    if (aiIntent == ruleIntent) {
                        logger.info("AI classified '{}' as {} with medium confidence {}, verified by rules", userMessage, aiIntent, confidence);
                        return new ClassificationResult(aiIntent, confidence, "AI classification (medium confidence, verified)", true);
                    } else {
                        logger.info("AI classified '{}' as {} but rules suggest {}, using rules", userMessage, aiIntent, ruleIntent);
                        return new ClassificationResult(ruleIntent, 0.75, "Rule-based classification (AI conflict)", false);
                    }
                } else {
                    return new ClassificationResult(Intent.OTHER, 0.5, "AI medium confidence but no rule-based classifier", false);
                }
            } else {
                if (ruleBasedClassifier != null) {
                    Intent ruleIntent = ruleBasedClassifier.classifyBasicIntent(userMessage);
                    double fallbackConfidence = 0.6 + (random.nextDouble() * 0.2);
                    return new ClassificationResult(ruleIntent, fallbackConfidence, "Rule-based classification (AI low confidence)", false);
                } else {
                    return new ClassificationResult(Intent.OTHER, 0.5, "AI low confidence and no rule-based classifier", false);
                }
            }

        } catch (Exception e) {
            logger.error("AI classification failed for message '{}': {}", userMessage, e.getMessage(), e);
            return fallbackToRuleBased(userMessage, "AI classification error: " + e.getMessage());
        }
    }

    private String buildClassificationPrompt(String userMessage) {
        return """
            You are an intent classification expert for an inventory management system. Classify the user's message into one of these intents:

            INTENTS:
            - GREETING: Hello, hi, hey, good morning, etc.
            - FAREWELL: Goodbye, bye, see you later, etc.
            - THANKS: Thank you, thanks, appreciate it, etc.
            - HELP: What can you do, how do you work, assistance needed, etc.
            - CLARIFICATION: I don't understand, can you clarify, etc.
            - SMALL_TALK: How are you, what's your name, weather, time, etc.
            - STOCK_SUMMARY: Show stock levels, what do I have, inventory status, current goods, etc.
            - RECENT_TRANSACTIONS: Recent transactions, latest movements, activity history, etc.
            - LOW_STOCK: Low stock items, need to restock, running low, depleted, etc.
            - FORECAST_QUERIES: Forecast, predict, when will items run out, future needs, etc.
            - FILTERED_TRANSACTIONS: Transactions by person, history for item, filtered views, etc.
            - OTHER: Anything not related to inventory management

            EXAMPLES:
            "Hello" -> GREETING
            "Show me current stock levels" -> STOCK_SUMMARY
            "What needs to be restocked" -> LOW_STOCK
            "When will we run out of widgets" -> FORECAST_QUERIES
            "Recent transactions by John" -> FILTERED_TRANSACTIONS
            "What's the weather" -> OTHER

            Classify this message: "%s"

            Respond with JSON format: {"intent": "INTENT_NAME", "confidence": 0.95}
            """.formatted(userMessage);
    }

    private AIResponse parseAIResponse(String response) {
        try {
            String cleaned = response.trim();

            int jsonStart = cleaned.indexOf("{");
            int jsonEnd = cleaned.lastIndexOf("}");
            if (jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart) {
                return null;
            }

            String jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
            return objectMapper.readValue(jsonStr, AIResponse.class);

        } catch (Exception e) {
            logger.warn("Failed to parse AI response: {}", e.getMessage());
            return null;
        }
    }

    private Intent parseIntent(String intentStr) {
        if (intentStr == null) return Intent.OTHER;

        try {
            return Intent.valueOf(intentStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            logger.warn("Unknown intent string: {}", intentStr);
            return Intent.OTHER;
        }
    }

    private ClassificationResult fallbackToRuleBased(String userMessage, String reason) {
        if (ruleBasedClassifier != null) {
            Intent ruleIntent = ruleBasedClassifier.classifyBasicIntent(userMessage);
            double confidence = 0.6 + (random.nextDouble() * 0.2);
            return new ClassificationResult(ruleIntent, confidence, "Rule-based classification (" + reason + ")", false);
        } else {
            return new ClassificationResult(Intent.OTHER, 0.5, "No rule-based classifier available (" + reason + ")", false);
        }
    }

    public boolean isConversationalIntent(Intent intent) {
        if (ruleBasedClassifier != null) {
            return ruleBasedClassifier.isConversationalIntent(intent);
        }
        return switch (intent) {
            case GREETING, FAREWELL, THANKS, HELP, CLARIFICATION, SMALL_TALK -> true;
            default -> false;
        };
    }

    public boolean isHighConfidence(ClassificationResult result) {
        return result.confidence() >= HIGH_CONFIDENCE_THRESHOLD;
    }

    public boolean isAIClassificationEnabled() {
        return aiClassificationEnabled;
    }

    public record AIResponse(
        String intent,
        double confidence
    ) {}

    public record ClassificationResult(
        Intent intent,
        double confidence,
        String explanation,
        boolean usedAI
    ) {}
}
