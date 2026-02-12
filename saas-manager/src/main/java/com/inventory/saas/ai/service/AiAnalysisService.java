package com.inventory.saas.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import com.inventory.saas.service.BillingGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(AiAnalysisService.class);

    private final ChatClient chatClient;
    private final TransactionRepository transactionRepository;
    private final InventoryRepository inventoryRepository;
    private final BillingGuard billingGuard;
    private final ObjectMapper objectMapper;

    public AiAnalysisService(ChatClient chatClient,
                             TransactionRepository transactionRepository,
                             InventoryRepository inventoryRepository,
                             BillingGuard billingGuard,
                             ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.transactionRepository = transactionRepository;
        this.inventoryRepository = inventoryRepository;
        this.billingGuard = billingGuard;
        this.objectMapper = objectMapper;
    }

    public List<StockAIInsightDTO> calculateAllItemForecasts(String tenantId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, thirtyDaysAgo);
        List<StockTransaction> recentHistory = transactionRepository.findAiAnalysisData(tenantId, sevenDaysAgo);

        Pageable pageable = PageRequest.of(0, 1000);
        List<InventoryItem> allItems = inventoryRepository.findByTenantIdAndDeletedFalse(tenantId, pageable).getContent();

        Map<String, List<StockTransaction>> itemsMap = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .collect(Collectors.groupingBy(t -> t.getInventoryItem().getName()));

        Map<String, List<StockTransaction>> recentItemsMap = recentHistory.stream()
                .filter(t -> t.getInventoryItem() != null)
                .collect(Collectors.groupingBy(t -> t.getInventoryItem().getName()));

        return allItems.stream().map(item -> {
            String itemName = item.getName();
            List<StockTransaction> txs = itemsMap.get(itemName);
            List<StockTransaction> recentTxs = recentItemsMap.get(itemName);

            double confidenceScore = calculateDataConfidence(txs, recentTxs);

            long totalOut = 0;
            long recentTotalOut = 0;
            if (txs != null) {
                totalOut = txs.stream()
                        .filter(t -> t.getType() != null && t.getType().contains("OUT"))
                        .mapToLong(t -> Math.abs(t.getQuantityChange()))
                        .sum();
            }

            if (recentTxs != null) {
                recentTotalOut = recentTxs.stream()
                        .filter(t -> t.getType() != null && t.getType().contains("OUT"))
                        .mapToLong(t -> Math.abs(t.getQuantityChange()))
                        .sum();
            }

            double historicalBurnRate = totalOut / 30.0;
            double recentBurnRate = recentTotalOut / 7.0;
            double weightedBurnRate = (recentBurnRate * 0.7) + (historicalBurnRate * 0.3);

            double adjustedBurnRate = weightedBurnRate * (0.5 + (confidenceScore * 0.5));

            int currentQty = item.getQuantity() != null ? item.getQuantity() : 0;
            int daysRemaining = (adjustedBurnRate > 0) ? (int) (currentQty / adjustedBurnRate) : 999;

            int suggestedThreshold = (int) Math.ceil(adjustedBurnRate * (14 + (1 - confidenceScore) * 7));
            if (suggestedThreshold < 5) suggestedThreshold = 5;

            String status;
            if (daysRemaining < 7) {
                status = "CRITICAL";
            } else if (daysRemaining < 20) {
                status = confidenceScore < 0.5 ? "WARNING" : "CAUTION";
            } else {
                status = confidenceScore > 0.7 ? "STABLE" : "GOOD";
            }

            String notes;
            if (txs == null || txs.isEmpty()) {
                notes = "No recent activity in last 30 days";
            } else if (confidenceScore < 0.3) {
                notes = "Limited data - forecasts based on sparse transaction history";
            } else if (confidenceScore < 0.7) {
                notes = "Moderate data quality - forecasts improving with more history";
            } else {
                notes = String.format("High confidence forecast (score: %.1f) based on 30-day velocity with recent trend analysis", confidenceScore);
            }

            return new StockAIInsightDTO(
                    itemName,
                    item.getSku() != null ? item.getSku() : "N/A",
                    currentQty,
                    daysRemaining,
                    LocalDate.now().plusDays(daysRemaining),
                    status,
                    suggestedThreshold,
                    notes
            );
        }).collect(Collectors.toList());
    }

    private double calculateDataConfidence(List<StockTransaction> historicalTxs, List<StockTransaction> recentTxs) {
        double confidence = 0.0;

        if (historicalTxs != null && !historicalTxs.isEmpty()) {
            confidence += 0.3;

            if (historicalTxs.size() >= 5) confidence += 0.2;
            if (historicalTxs.size() >= 10) confidence += 0.1;
        }

        if (recentTxs != null && !recentTxs.isEmpty()) {
            confidence += 0.2;

            if (recentTxs.size() >= 3) confidence += 0.1;
            if (recentTxs.size() >= 5) confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    @Cacheable(value = "ai-pattern-analysis", key = "#tenantId + '-' + #itemName")
    public AIPatternAnalysis analyzeItemPatterns(String tenantId, String itemName, List<StockTransaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return new AIPatternAnalysis("NO_DATA", 0.0, "Insufficient data for pattern analysis",
                    List.of(), Map.of(), "STABLE");
        }

        String transactionData = transactions.stream()
                .sorted((t1, t2) -> t1.getCreatedAt().compareTo(t2.getCreatedAt()))
                .map(t -> String.format("Date: %s, Type: %s, Quantity: %d, Reason: %s",
                        t.getCreatedAt().toLocalDate(),
                        t.getType(),
                        Math.abs(t.getQuantityChange()),
                        t.getReason() != null ? t.getReason() : "N/A"))
                .collect(Collectors.joining("\n"));

        String prompt = String.format("""
            Analyze the inventory transaction patterns for item "%s" and provide insights.

            Transaction History:
            %s

            Please analyze and return JSON with:
            1. trend_pattern: "INCREASING", "DECREASING", "STABLE", "SEASONAL", or "VOLATILE"
            2. confidence_score: 0.0 to 1.0 based on data quality and pattern clarity
            3. insights: Brief explanation of identified patterns and factors
            4. seasonal_factors: Array of identified seasonal patterns (e.g., ["weekend_peak", "monthly_cycle", "quarterly_demand"])
            5. demand_forecast: Object with "next_7_days", "next_30_days", "next_90_days" predictions
            6. risk_level: "LOW", "MEDIUM", or "HIGH" based on pattern volatility

            Focus on:
            - Weekly patterns (weekdays vs weekends)
            - Monthly cycles (beginning/end of month effects)
            - Seasonal trends (if enough data)
            - Growth or decline patterns
            - Anomalies or unusual spikes
            """, itemName, transactionData);

        try {
            ChatResponse response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .chatResponse();

            if (response != null && response.getMetadata().getUsage() != null) {
                billingGuard.updateTokenUsage(tenantId, response.getMetadata().getUsage().getTotalTokens());
            }

            String content = response.getResult().getOutput().getContent();
            logger.info("AI pattern analysis for item {} (tenant {}): {}", itemName, tenantId, content);

            JsonNode root = objectMapper.readTree(extractJson(content));

            String trendPattern = root.path("trend_pattern").asText("STABLE");
            double confidenceScore = root.path("confidence_score").asDouble(0.5);
            String insights = root.path("insights").asText("Pattern analysis completed");

            List<String> seasonalFactors = new ArrayList<>();
            JsonNode factorsNode = root.path("seasonal_factors");
            if (factorsNode.isArray()) {
                for (JsonNode factor : factorsNode) {
                    seasonalFactors.add(factor.asText());
                }
            }

            Map<String, Double> demandForecast = new HashMap<>();
            JsonNode forecastNode = root.path("demand_forecast");
            demandForecast.put("next_7_days", forecastNode.path("next_7_days").asDouble(0.0));
            demandForecast.put("next_30_days", forecastNode.path("next_30_days").asDouble(0.0));
            demandForecast.put("next_90_days", forecastNode.path("next_90_days").asDouble(0.0));

            String riskLevel = root.path("risk_level").asText("MEDIUM");

            return new AIPatternAnalysis(trendPattern, confidenceScore, insights,
                    seasonalFactors, demandForecast, riskLevel);

        } catch (Exception e) {
            logger.warn("AI pattern analysis failed for item {} (tenant {}): {}", itemName, tenantId, e.getMessage());
            return new AIPatternAnalysis("ERROR", 0.0, "AI analysis failed: " + e.getMessage(),
                    List.of(), Map.of(), "MEDIUM");
        }
    }

    public static class AIPatternAnalysis {
        private final String trendPattern;
        private final double confidenceScore;
        private final String insights;
        private final List<String> seasonalFactors;
        private final Map<String, Double> demandForecast;
        private final String riskLevel;

        public AIPatternAnalysis(String trendPattern, double confidenceScore, String insights,
                                 List<String> seasonalFactors, Map<String, Double> demandForecast, String riskLevel) {
            this.trendPattern = trendPattern;
            this.confidenceScore = confidenceScore;
            this.insights = insights;
            this.seasonalFactors = seasonalFactors;
            this.demandForecast = demandForecast;
            this.riskLevel = riskLevel;
        }

        public String getTrendPattern() {
            return trendPattern;
        }

        public double getConfidenceScore() {
            return confidenceScore;
        }

        public String getInsights() {
            return insights;
        }

        public List<String> getSeasonalFactors() {
            return seasonalFactors;
        }

        public Map<String, Double> getDemandForecast() {
            return demandForecast;
        }

        public String getRiskLevel() {
            return riskLevel;
        }
    }

    private List<StockTransaction> removeOutliers(List<StockTransaction> transactions) {
        if (transactions == null || transactions.size() < 4) {
            return transactions;
        }

        List<Integer> quantities = transactions.stream()
            .filter(t -> t.getType() != null && t.getType().contains("OUT"))
            .map(t -> Math.abs(t.getQuantityChange()))
            .sorted()
            .collect(Collectors.toList());

        if (quantities.size() < 4) return transactions;

        int q1Index = quantities.size() / 4;
        int q3Index = (quantities.size() * 3) / 4;
        long q1 = quantities.get(q1Index);
        long q3 = quantities.get(q3Index);
        long iqr = q3 - q1;

        long lowerBound = (long) (q1 - (1.5 * iqr));
        long upperBound = (long) (q3 + (1.5 * iqr));

        return transactions.stream()
            .filter(t -> {
                if (t.getType() == null || !t.getType().contains("OUT")) return true;
                long qty = Math.abs((long) t.getQuantityChange());
                return qty >= lowerBound && qty <= upperBound;
            })
            .collect(Collectors.toList());
    }

    private double calculateWeightedBurnRate(List<StockTransaction> transactions, int daysPeriod) {
        if (transactions == null || transactions.isEmpty()) return 0.0;

        LocalDateTime cutoff = LocalDateTime.now().minusDays(daysPeriod);
        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (StockTransaction tx : transactions) {
            if (tx.getCreatedAt().isBefore(cutoff)) continue;
            if (tx.getType() == null || !tx.getType().contains("OUT")) continue;

            long daysOld = java.time.Duration.between(tx.getCreatedAt(), LocalDateTime.now()).toDays();

            double weight = Math.exp(-0.1 * daysOld);
            double quantity = Math.abs((long) tx.getQuantityChange());

            weightedSum += quantity * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight / daysPeriod : 0.0;
    }

    private DataQualityScore assessDataQuality(List<StockTransaction> historicalTxs, List<StockTransaction> recentTxs) {
        double completenessScore = 0.0;
        double consistencyScore = 0.0;
        double recencyScore = 0.0;
        double volumeScore = 0.0;

        if (historicalTxs != null && !historicalTxs.isEmpty()) {
            completenessScore = Math.min(1.0, historicalTxs.size() / 20.0);
        }

        if (historicalTxs != null && historicalTxs.size() >= 2) {
            LocalDateTime first = historicalTxs.stream()
                .map(StockTransaction::getCreatedAt)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now().minusDays(30));
            LocalDateTime last = historicalTxs.stream()
                .map(StockTransaction::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

            long daysSpanned = java.time.Duration.between(first, last).toDays();
            if (daysSpanned > 0) {
                double avgFrequency = (double) historicalTxs.size() / daysSpanned;
                consistencyScore = Math.min(1.0, avgFrequency * 7);
            }
        }

        if (recentTxs != null && !recentTxs.isEmpty()) {
            recencyScore = Math.min(1.0, recentTxs.size() / 5.0);
        }

        if (historicalTxs != null && historicalTxs.size() >= 3) {
            List<Long> volumes = historicalTxs.stream()
                .filter(t -> t.getType() != null && t.getType().contains("OUT"))
                .map(t -> Math.abs((long) t.getQuantityChange()))
                .collect(Collectors.toList());

            if (!volumes.isEmpty()) {
                double mean = volumes.stream().mapToLong(Long::longValue).average().orElse(0.0);
                double variance = volumes.stream()
                    .mapToDouble(v -> Math.pow(v - mean, 2))
                    .average().orElse(0.0);
                double stdDev = Math.sqrt(variance);

                double cv = mean > 0 ? stdDev / mean : 1.0;
                volumeScore = Math.max(0.0, 1.0 - cv);
            }
        }

        double overallScore = (completenessScore * 0.3) +
                             (consistencyScore * 0.3) +
                             (recencyScore * 0.25) +
                             (volumeScore * 0.15);

        return new DataQualityScore(overallScore, completenessScore, consistencyScore, recencyScore, volumeScore);
    }

    public static class DataQualityScore {
        private final double overallScore;
        private final double completenessScore;
        private final double consistencyScore;
        private final double recencyScore;
        private final double volumeScore;

        public DataQualityScore(double overallScore, double completenessScore,
                              double consistencyScore, double recencyScore, double volumeScore) {
            this.overallScore = overallScore;
            this.completenessScore = completenessScore;
            this.consistencyScore = consistencyScore;
            this.recencyScore = recencyScore;
            this.volumeScore = volumeScore;
        }

        public double getOverallScore() { return overallScore; }
        public double getCompletenessScore() { return completenessScore; }
        public double getConsistencyScore() { return consistencyScore; }
        public double getRecencyScore() { return recencyScore; }
        public double getVolumeScore() { return volumeScore; }

        public String getQualityLevel() {
            if (overallScore >= 0.8) return "EXCELLENT";
            if (overallScore >= 0.6) return "GOOD";
            if (overallScore >= 0.4) return "FAIR";
            return "POOR";
        }
    }

    @Cacheable(value = "ai-analysis", key = "#tenantId")
    public InventorySummaryAnalysisDTO getGlobalAnalysis(String tenantId, String plan) {
        billingGuard.validateTokenBudget(tenantId, plan);

        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        List<StockTransaction> history = transactionRepository.findAiAnalysisData(tenantId, ninetyDaysAgo);

        if (history.isEmpty()) {
            return createEmptyResponse("No transaction history found for analysis.");
        }

        String dataFeed = history.stream()
                .filter(t -> t.getInventoryItem() != null)
                .map(t -> String.format("- Item: %s | Action: %s | Qty: %d",
                        t.getInventoryItem().getName(),
                        t.getType(),
                        Math.abs(t.getQuantityChange())))
                .collect(Collectors.joining("\n"));

        try {
            ChatResponse response = chatClient.prompt()
                    .user("Analyze these stock movements and return JSON report. DATA:\n" + dataFeed)
                    .call()
                    .chatResponse();

            if (response != null && response.getMetadata().getUsage() != null) {
                billingGuard.updateTokenUsage(tenantId, response.getMetadata().getUsage().getTotalTokens());
            }

            String content = response.getResult().getOutput().getContent();
            logger.info("Raw AI response for tenant {}: {}", tenantId, content);

            if (content.contains("REPLACE_WITH") || content.contains("[REPLACE_") || content.contains("placeholder")) {
                logger.warn("AI returned placeholder response instead of using tool data for tenant {}", tenantId);
                return createEmptyResponse("AI analysis failed to process provided data. Please try again.");
            }

            String cleanedJson = extractJson(content);
            logger.info("Cleaned AI JSON for tenant {}: {}", tenantId, cleanedJson);

            JsonNode root = objectMapper.readTree(cleanedJson);
            if (!root.has("status") && !root.has("summary")) {
                logger.warn("AI response missing required fields for tenant {}", tenantId);
                return createEmptyResponse("AI response format is invalid. Please try again.");
            }

            InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();

            dto.setStatus(root.path("status").asText("Warning"));
            dto.setSummary(root.path("summary").asText("Analysis complete."));

            List<String> actions = new ArrayList<>();
            if (root.has("urgentActions") && root.get("urgentActions").isArray()) {
                root.get("urgentActions").forEach(node -> actions.add(node.asText()));
            } else {
                actions.add("Continue monitoring stock levels");
            }
            dto.setUrgentActions(actions);

            JsonNode scoreNode = root.path("healthScore");
            if (scoreNode.isNumber()) {
                dto.setHealthScore(scoreNode.asInt());
            } else if (scoreNode.isObject()) {
                dto.setHealthScore(scoreNode.path("value").asInt(75));
            } else {
                dto.setHealthScore(75);
            }

            if (root.has("data") && root.get("data").isArray()) {
                List<Map<String, Object>> data = new ArrayList<>();
                root.get("data").forEach(node -> {
                    try {
                        data.add(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {}));
                    } catch (Exception e) {
                        logger.warn("Failed to convert data node: {}", e.getMessage());
                    }
                });
                dto.setData(data);
            }

            if (root.has("analysis") && root.get("analysis").isArray()) {
                List<Map<String, Object>> analysis = new ArrayList<>();
                root.get("analysis").forEach(node -> {
                    try {
                        analysis.add(objectMapper.convertValue(node, new TypeReference<Map<String, Object>>() {}));
                    } catch (Exception e) {
                        logger.warn("Failed to convert analysis node: {}", e.getMessage());
                    }
                });
                dto.setAnalysis(analysis);
            }

            return dto;

        } catch (Exception e) {
            logger.error("AI Error for tenant {}: {}", tenantId, e.getMessage(), e);
            return createEmptyResponse("AI analysis failed to process. Ensure data is valid.");
        }
    }

    private String extractJson(String content) {
        if (content == null) return "{}";

        String cleaned = content.replaceAll("```json", "").replaceAll("```", "").trim();

        cleaned = cleaned.replaceAll("//.*", "");
        cleaned = cleaned.replaceAll("/\\*.*?\\*/", "");

        int start = cleaned.indexOf("{");
        int end = cleaned.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            return cleaned.substring(start, end + 1);
        }

        logger.warn("Could not extract valid JSON from AI response: {}", content);
        return "{}";
    }

    private InventorySummaryAnalysisDTO createEmptyResponse(String message) {
        InventorySummaryAnalysisDTO dto = new InventorySummaryAnalysisDTO();
        dto.setStatus("Warning");
        dto.setSummary(message);
        dto.setUrgentActions(List.of("Record more stock transactions to enable AI insights"));
        dto.setHealthScore(0);
        return dto;
    }
}
