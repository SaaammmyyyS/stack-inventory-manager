package com.inventory.saas.controller;

import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.dto.StockAIInsightDTO;
import com.inventory.saas.service.AiForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final AiForecastService aiForecastService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER', 'USER')")
    public ResponseEntity<InventorySummaryAnalysisDTO> getGlobalInventoryAnalysis(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestHeader(value = "X-Organization-Plan", defaultValue = "free") String plan) {

        InventorySummaryAnalysisDTO analysis = aiForecastService.getGlobalAnalysis(tenantId, plan);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER', 'USER')")
    public ResponseEntity<List<StockAIInsightDTO>> getAllItemForecasts(
            @RequestHeader("X-Tenant-ID") String tenantId) {
        List<StockAIInsightDTO> forecasts = aiForecastService.calculateAllItemForecasts(tenantId);
        return ResponseEntity.ok(forecasts);
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER', 'USER')")
    public ResponseEntity<AgentChatResponse> chat(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody AgentChatRequest request) {
        String reply = aiForecastService.chat(tenantId, request.message());
        return ResponseEntity.ok(new AgentChatResponse(reply));
    }

    public record AgentChatRequest(String message) {}
    public record AgentChatResponse(String reply) {}
}