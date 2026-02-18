package com.inventory.saas.config;

import com.inventory.saas.ai.intent.AIIntentClassifier;
import com.inventory.saas.ai.intent.IntentClassifier;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import static org.mockito.Mockito.mock;

@TestConfiguration
public class TestAIIntentConfig {

    @Bean
    @Primary
    public ChatClient mockChatClient() {
        return mock(ChatClient.class);
    }

    @Bean
    @Primary
    public IntentClassifier mockIntentClassifier() {
        return mock(IntentClassifier.class);
    }

    @Bean
    @Primary
    public AIIntentClassifier testAIIntentClassifier(ChatClient chatClient, 
                                                IntentClassifier intentClassifier,
                                                ObjectMapper objectMapper) {
        return new AIIntentClassifier(chatClient, intentClassifier, objectMapper);
    }
}
