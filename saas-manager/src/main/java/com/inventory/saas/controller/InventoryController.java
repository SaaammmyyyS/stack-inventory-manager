package com.inventory.saas.controller;

import com.inventory.saas.dto.InventoryItemDTO;
import com.inventory.saas.dto.InventoryTrashDTO;
import com.inventory.saas.dto.PaginatedResponseDTO;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.service.InventoryService;
import com.inventory.saas.service.BillingGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService service;
    private final BillingGuard billingGuard;

    private InventoryItemDTO convertToDto(InventoryItem item) {
        return InventoryItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .category(item.getCategory())
                .quantity(item.getQuantity())
                .minThreshold(item.getMinThreshold())
                .price(item.getPrice())
                .tenantId(item.getTenantId())
                .build();
    }

    private InventoryItem convertToEntity(InventoryItemDTO dto) {
        InventoryItem item = new InventoryItem();
        item.setId(dto.getId());
        item.setName(dto.getName());
        item.setSku(dto.getSku());
        item.setCategory(dto.getCategory());
        item.setQuantity(dto.getQuantity());
        item.setMinThreshold(dto.getMinThreshold());
        item.setPrice(dto.getPrice());
        item.setTenantId(dto.getTenantId());
        return item;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER', 'USER')")
    public ResponseEntity<PaginatedResponseDTO<InventoryItemDTO>> getAll(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        Page<InventoryItem> itemPage = service.getAllItemsPaginated(tenantId, search, category, page - 1, limit);
        List<InventoryItemDTO> dtos = itemPage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(PaginatedResponseDTO.<InventoryItemDTO>builder()
                .items(dtos)
                .total(itemPage.getTotalElements())
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InventoryItemDTO> create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader("X-Tenant-ID") String tenantId,
            @RequestBody InventoryItemDTO dto) {

        /**
         * TODO: [2026-01-31] JWT extraction was not working.
         * For now, we are defaulting to "free".
         * Re-enable jwt.getClaimAsString("org_plan") later.
         */
        String plan = "free";
        billingGuard.validateSkuLimit(tenantId, plan);

        dto.setTenantId(tenantId);
        InventoryItem item = convertToEntity(dto);
        return ResponseEntity.ok(convertToDto(service.saveItem(item)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InventoryItemDTO> update(
            @RequestHeader("X-Tenant-ID") String tenantId,
            @PathVariable UUID id,
            @RequestBody InventoryItemDTO dto) {
        dto.setTenantId(tenantId);
        InventoryItem details = convertToEntity(dto);
        return ResponseEntity.ok(convertToDto(service.updateItem(id, details)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Performed-By", defaultValue = "Admin") String adminName
    ) {
        service.deleteItem(id, adminName);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trash")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEMBER')")
    public ResponseEntity<List<InventoryTrashDTO>> getTrashBin(@RequestHeader("X-Tenant-ID") String tenantId) {
        List<InventoryTrashDTO> trashItems = service.getTrashItems(tenantId);
        return ResponseEntity.ok(trashItems);
    }

    @PutMapping("/restore/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        service.restoreItem(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/permanent/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> hardDelete(@PathVariable UUID id) {
        service.hardDeleteItem(id);
        return ResponseEntity.noContent().build();
    }
}