package com.inventory.saas.service;

import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiForecastService {

    private static final Logger logger = LoggerFactory.getLogger(AiForecastService.class);
    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;

    public AiForecastService(ChatClient.Builder chatClientBuilder, TransactionRepository transactionRepository) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are a Senior Supply Chain Consultant. " +
                        "Analyze the transaction ledger and provide a professional executive report. " +
                        "1. status: 'Healthy', 'Warning', or 'Critical'. " +
                        "2. summary: 2-3 sentences of meaningful business insight. " +
                        "3. urgentActions: 3 specific strategic recommendations. " +
                        "4. healthScore: Integer 0-100. " +
                        "Output ONLY valid JSON.")
                .build();
        this.transactionRepository = transactionRepository;
    }

    public InventorySummaryAnalysisDTO getGlobalAnalysis(String tenantId) {
        LocalDateTime sixtyDaysAgo = LocalDateTime.now().minusDays(60);

        logger.info("AI Analysis requested for Tenant: {}", tenantId);

        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, sixtyDaysAgo);

        if (history.isEmpty()) {
            logger.warn("DATABASE CHECK: No transactions found for tenant {} since {}", tenantId, sixtyDaysAgo);
            return createEmptyResponse("Database returned 0 transactions. Please check if tenant_id matches exactly.");
        }

        logger.info("DATABASE CHECK: Found {} transactions. Building AI prompt...", history.size());

        String dataFeed = history.stream()
                .map(t -> String.format("- %s: %s (%d units) | Reason: %s",
                        t.getInventoryItem().getName(),
                        t.getType(),
                        Math.abs(t.getQuantityChange()),
                        t.getReason()))
                .collect(Collectors.joining("\n"));

        try {
            return chatClient.prompt()
                    .user("Analyze this 60-day ledger for business trends:\n" + dataFeed)
                    .options(OllamaOptions.builder()
                            .withFormat("json")
                            .withTemperature(0.7)
                            .build())
                    .call()
                    .entity(InventorySummaryAnalysisDTO.class);
        } catch (Exception e) {
            logger.error("AI processing error: {}", e.getMessage());
            return createEmptyResponse("The AI consultant encountered an error processing the ledger.");
        }
    }

    private InventorySummaryAnalysisDTO createEmptyResponse(String message) {
        InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();
        dto.setStatus("Warning");
        dto.setSummary(message);
        dto.setUrgentActions(List.of("Check System Logs", "Verify Tenant ID in Database"));
        dto.setHealthScore(0);
        return dto;
    }
}