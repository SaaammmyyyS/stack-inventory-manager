package com.inventory.saas.controller;

import com.inventory.saas.dto.StockMovementRequestDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final InventoryService inventoryService;

    private StockMovementResponseDTO convertToDto(StockTransaction t) {
        return StockMovementResponseDTO.builder()
                .id(t.getId())
                .quantityChange(t.getQuantityChange())
                .type(t.getType())
                .reason(t.getReason())
                .performedBy(t.getPerformedBy())
                .createdAt(t.getCreatedAt())
                .itemName(t.getInventoryItem() != null ? t.getInventoryItem().getName() : "Unknown Item")
                .build();
    }

    @PostMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MEMBER')")
    public StockMovementResponseDTO addTransaction(
            @PathVariable UUID itemId,
            @RequestBody StockMovementRequestDTO request,
            @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        StockTransaction transaction = inventoryService.recordMovement(
                itemId,
                request.getAmount(),
                request.getType(),
                request.getReason(),
                request.getPerformedBy(),
                tenantId
        );
        return convertToDto(transaction);
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MEMBER', 'ROLE_USER')")
    public ResponseEntity<List<StockMovementResponseDTO>> getRecentActivity(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "10") Integer limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        log.info("Getting recent activity for tenant: {} with limit: {}, startDate: {}, endDate: {}",
                tenantId, limit, startDate, endDate);

        try {
            if (limit > 1000) {
                log.warn("Limit {} exceeds maximum, capping at 1000 for tenant: {}", limit, tenantId);
                limit = 1000;
            }

            List<StockMovementResponseDTO> transactions = inventoryService.getRecentTransactionsRaw(tenantId, limit, startDate, endDate);

            log.info("Successfully retrieved {} transactions for tenant: {}", transactions.size(), tenantId);

            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Error retrieving recent activity for tenant: {} with parameters: limit={}, startDate={}, endDate={}",
                    tenantId, limit, startDate, endDate, e);
            throw e;
        }
    }

    @GetMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MEMBER', 'ROLE_USER')")
    public List<StockMovementResponseDTO> getHistory(@PathVariable UUID itemId) {
        return inventoryService.getItemHistory(itemId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/debug/all")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MEMBER')")
    public List<StockMovementResponseDTO> getAllTransactionsForDebug(
            @RequestHeader("X-Tenant-ID") String tenantId
    ) {
        return inventoryService.getAllTransactionsForDebug(tenantId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}