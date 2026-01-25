package com.inventory.saas.controller;

import com.inventory.saas.dto.MovementRequest;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final InventoryService inventoryService;

    @PostMapping("/{itemId}")
    public StockTransaction addTransaction(@PathVariable UUID itemId, @RequestBody MovementRequest request) {
        return inventoryService.recordMovement(
                itemId,
                request.getAmount(),
                request.getType(),
                request.getReason(),
                request.getPerformedBy()
        );
    }

    @GetMapping("/{itemId}")
    public List<StockTransaction> getHistory(@PathVariable UUID itemId) {
        return inventoryService.getItemHistory(itemId);
    }
}