package com.inventory.saas.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OllamaHealthService {

    private static final Logger logger = LoggerFactory.getLogger(OllamaHealthService.class);

    private final RestClient restClient;
    private final ChatClient chatClient;

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${spring.ai.ollama.chat.enabled:false}")
    private boolean ollamaEnabled;

    private final ConcurrentHashMap<String, LocalDateTime> healthCache = new ConcurrentHashMap<>();
    private static final long HEALTH_CHECK_INTERVAL_MINUTES = 5;

    public OllamaHealthService(RestClient.Builder restClientBuilder, ChatClient chatClient) {
        this.restClient = restClientBuilder.build();
        this.chatClient = chatClient;
    }

    public boolean isOllamaHealthy() {
        if (!ollamaEnabled) {
            logger.debug("Ollama is disabled in configuration");
            return false;
        }

        String cacheKey = ollamaBaseUrl;
        LocalDateTime lastCheck = healthCache.get(cacheKey);

        if (lastCheck != null && lastCheck.isAfter(LocalDateTime.now().minusMinutes(HEALTH_CHECK_INTERVAL_MINUTES))) {
            logger.debug("Using cached Ollama health status");
            return true;
        }

        try {
            logger.debug("Performing Ollama health check");

            String version = restClient.get()
                    .uri(ollamaBaseUrl + "/api/version")
                    .retrieve()
                    .body(String.class);

            if (version != null && !version.trim().isEmpty()) {
                logger.info("Ollama health check passed. Version: {}", version);
                healthCache.put(cacheKey, LocalDateTime.now());
                return true;
            }

        } catch (Exception e) {
            logger.warn("Ollama health check failed: {}", e.getMessage());
        }

        try {
            logger.debug("Testing Ollama with simple chat request");

            String response = chatClient.prompt()
                    .user("Respond with just: OK")
                    .call()
                    .content();

            if (response != null && response.contains("OK")) {
                logger.info("Ollama chat test passed");
                healthCache.put(cacheKey, LocalDateTime.now());
                return true;
            }

        } catch (Exception e) {
            logger.warn("Ollama chat test failed: {}", e.getMessage());
        }

        logger.error("Ollama health check failed - service appears unhealthy");
        healthCache.remove(cacheKey);
        return false;
    }

    public void clearHealthCache() {
        healthCache.clear();
        logger.info("Ollama health cache cleared");
    }

    public String getOllamaStatus() {
        if (!ollamaEnabled) {
            return "DISABLED";
        }

        if (isOllamaHealthy()) {
            return "HEALTHY";
        } else {
            return "UNHEALTHY";
        }
    }
}
