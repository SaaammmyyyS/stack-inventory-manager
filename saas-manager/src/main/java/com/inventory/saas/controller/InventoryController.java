package com.inventory.saas.controller;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService service;

    @GetMapping
    public List<InventoryItem> getAll() {
        return service.getAllItems();
    }

    @PostMapping
    public InventoryItem create(@RequestBody InventoryItem item) {
        return service.saveItem(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> update(@PathVariable UUID id, @RequestBody InventoryItem details) {
        return ResponseEntity.ok(service.updateItem(id, details));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Performed-By", defaultValue = "Admin") String adminName
    ) {
        service.deleteItem(id, adminName);
        return ResponseEntity.noContent().build();
    }
}