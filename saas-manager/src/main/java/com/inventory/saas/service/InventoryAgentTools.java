package com.inventory.saas.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.saas.config.TenantContext;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.exception.ResourceNotFoundException;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class InventoryAgentTools {

    private static final Logger logger = LoggerFactory.getLogger(InventoryAgentTools.class);
    private static final String NO_TENANT_MSG = "Error: No tenant context. Ensure the request includes X-Tenant-ID.";

    private final InventoryService inventoryService;
    private final AiForecastService aiForecastService;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    public InventoryAgentTools(InventoryService inventoryService,
                               @Lazy AiForecastService aiForecastService,
                               InventoryRepository inventoryRepository,
                               ObjectMapper objectMapper) {
        this.inventoryService = inventoryService;
        this.aiForecastService = aiForecastService;
        this.inventoryRepository = inventoryRepository;
        this.objectMapper = objectMapper;
    }

    public String getCurrentStockSummary() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return NO_TENANT_MSG;
        try {
            Page<InventoryItem> page = inventoryService.getAllItemsPaginated(tenantId, null, null, 0, 100);
            List<Map<String, Object>> items = page.getContent().stream()
                    .map(item -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", item.getId() != null ? item.getId().toString() : null);
                        m.put("name", item.getName());
                        m.put("sku", item.getSku());
                        m.put("quantity", item.getQuantity());
                        m.put("minThreshold", item.getMinThreshold());
                        return m;
                    })
                    .collect(Collectors.toList());
            Map<String, Object> result = new HashMap<>();
            result.put("items", items);
            result.put("total", page.getTotalElements());
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize stock summary", e);
            return "Failed to serialize stock summary.";
        }
    }

    public String getRecentTransactions() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return NO_TENANT_MSG;
        try {
            List<StockMovementResponseDTO> list = inventoryService.getRecentTransactionsRaw(tenantId);
            List<Map<String, Object>> data = list.stream().map(dto -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", dto.getId() != null ? dto.getId().toString() : null);
                m.put("itemName", dto.getItemName());
                m.put("type", dto.getType());
                m.put("quantityChange", dto.getQuantityChange());
                m.put("reason", dto.getReason());
                m.put("performedBy", dto.getPerformedBy());
                m.put("createdAt", dto.getCreatedAt() != null ? dto.getCreatedAt().toString() : null);
                return m;
            }).collect(Collectors.toList());
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize recent transactions", e);
            return "Failed to serialize recent transactions.";
        }
    }

    public String getItemTransactionHistory(String itemId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return NO_TENANT_MSG;
        if (itemId == null || itemId.isBlank()) return "Error: itemId is required.";
        UUID id;
        try {
            id = UUID.fromString(itemId);
        } catch (IllegalArgumentException e) {
            return "Error: Invalid item ID format.";
        }
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) return "Error: Item not found.";
        if (!tenantId.equals(item.getTenantId())) {
            return "Error: Item does not belong to the current tenant.";
        }
        try {
            List<StockTransaction> history = inventoryService.getItemHistory(id);
            List<Map<String, Object>> data = history.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("type", t.getType());
                m.put("quantityChange", t.getQuantityChange());
                m.put("reason", t.getReason());
                m.put("performedBy", t.getPerformedBy());
                m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
                return m;
            }).collect(Collectors.toList());
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize item history", e);
            return "Failed to serialize item history.";
        }
    }

    public String getItemForecasts() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return NO_TENANT_MSG;
        try {
            List<StockAIInsightDTO> forecasts = aiForecastService.calculateAllItemForecasts(tenantId);
            List<Map<String, Object>> data = forecasts.stream().map(f -> {
                Map<String, Object> m = new HashMap<>();
                m.put("itemName", f.getItemName());
                m.put("sku", f.getSku());
                m.put("currentQuantity", f.getCurrentQuantity());
                m.put("daysRemaining", f.getDaysRemaining());
                m.put("predictedDepletionDate", f.getPredictedDepletionDate() != null ? f.getPredictedDepletionDate().toString() : null);
                m.put("healthStatus", f.getHealthStatus());
                m.put("suggestedThreshold", f.getSuggestedThreshold());
                m.put("thresholdReason", f.getThresholdReason());
                return m;
            }).collect(Collectors.toList());
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize item forecasts", e);
            return "Failed to serialize item forecasts.";
        }
    }

    public String recordStockMovement(String itemId, int amount, String type, String reason, String performedBy) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) return NO_TENANT_MSG;
        if (itemId == null || itemId.isBlank()) return "Error: itemId is required.";
        UUID id;
        try {
            id = UUID.fromString(itemId);
        } catch (IllegalArgumentException e) {
            return "Error: Invalid item ID format.";
        }
        InventoryItem item = inventoryRepository.findById(id).orElse(null);
        if (item == null) return "Error: Item not found.";
        if (!tenantId.equals(item.getTenantId())) {
            return "Error: Item does not belong to the current tenant.";
        }
        if (amount <= 0) return "Error: Amount must be a positive integer.";
        String t = (type != null && type.trim().isEmpty()) ? "STOCK_IN" : (type == null ? "STOCK_IN" : type.trim().toUpperCase());
        if (!"STOCK_IN".equals(t) && !"STOCK_OUT".equals(t)) {
            return "Error: Type must be STOCK_IN or STOCK_OUT.";
        }
        try {
            StockTransaction tx = inventoryService.recordMovement(
                    id,
                    amount,
                    t,
                    reason != null ? reason : "Agent-recorded movement",
                    performedBy != null ? performedBy : "Inventory Agent"
            );
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("transactionId", tx.getId() != null ? tx.getId().toString() : null);
            result.put("itemName", item.getName());
            result.put("type", tx.getType());
            result.put("quantityChange", tx.getQuantityChange());
            return objectMapper.writeValueAsString(result);
        } catch (ResourceNotFoundException e) {
            return "Error: Item not found.";
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize record result", e);
            return "Movement recorded but failed to serialize result.";
        }
    }
}
