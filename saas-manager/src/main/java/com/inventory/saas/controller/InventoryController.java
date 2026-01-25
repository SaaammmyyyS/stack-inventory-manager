package com.inventory.saas.controller;

import com.inventory.saas.dto.InventoryItemDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.service.InventoryService;
import com.inventory.saas.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService service;
    private final TransactionRepository transactionRepository;

    private InventoryItemDTO convertToDto(InventoryItem item) {
        return InventoryItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .minThreshold(item.getMinThreshold())
                .price(item.getPrice())
                .build();
    }

    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return service.getAllItems().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @PostMapping
    public InventoryItemDTO create(@RequestBody InventoryItem item) {
        return convertToDto(service.saveItem(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> update(@PathVariable UUID id, @RequestBody InventoryItem details) {
        return ResponseEntity.ok(convertToDto(service.updateItem(id, details)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Performed-By", defaultValue = "Admin") String adminName
    ) {
        service.deleteItem(id, adminName);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trash")
    public List<InventoryItemDTO> getTrash(@RequestHeader("X-Tenant-ID") String tenantId) {
        return service.getTrashedItems(tenantId).stream()
                .map(item -> {
                    InventoryItemDTO dto = convertToDto(item);
                    String deleter = transactionRepository.findDeleterByItemId(item.getId());
                    dto.setDeletedBy(deleter != null ? deleter : "System");
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @PutMapping("/restore/{id}")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        service.restoreItem(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/permanent/{id}")
    public ResponseEntity<Void> hardDelete(@PathVariable UUID id) {
        service.hardDeleteItem(id);
        return ResponseEntity.noContent().build();
    }
}