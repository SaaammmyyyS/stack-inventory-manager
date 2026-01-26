package com.inventory.saas.controller;

import com.inventory.saas.dto.StockMovementRequestDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
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
                .build();
    }

    @PostMapping("/{itemId}")
    public StockMovementResponseDTO addTransaction(
            @PathVariable UUID itemId,
            @RequestBody StockMovementRequestDTO request
    ) {
        StockTransaction transaction = inventoryService.recordMovement(
                itemId,
                request.getAmount(),
                request.getType(),
                request.getReason(),
                request.getPerformedBy()
        );
        return convertToDto(transaction);
    }

    @GetMapping("/{itemId}")
    public List<StockMovementResponseDTO> getHistory(@PathVariable UUID itemId) {
        return inventoryService.getItemHistory(itemId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}