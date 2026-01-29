package com.inventory.saas.controller;

import com.inventory.saas.dto.InventorySummaryAnalysisDTO;
import com.inventory.saas.service.AiForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final AiForecastService aiForecastService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER')")
    public ResponseEntity<InventorySummaryAnalysisDTO> getGlobalInventoryAnalysis(
            @RequestHeader("X-Tenant-ID") String tenantId) {

        InventorySummaryAnalysisDTO analysis = aiForecastService.getGlobalAnalysis(tenantId);
        return ResponseEntity.ok(analysis);
    }
}