package com.inventory.saas.controller;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.service.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService service;

    // Best Practice: Constructor Injection
    public InventoryController(InventoryService service) {
        this.service = service;
    }

    /**
     * GET /api/inventory
     * Fetches the inventory for the currently authenticated user/tenant.
     */
    @GetMapping
    public List<InventoryItem> getInventory(@AuthenticationPrincipal Jwt jwt) {
        // Extract the unique Clerk User ID from the token
        String tenantId = jwt.getSubject();
        return service.getItemsByTenant(tenantId);
    }

    /**
     * POST /api/inventory
     * Creates a new item, forcing the tenantId to be the authenticated user's ID.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItem createItem(
            @RequestBody InventoryItem item,
            @AuthenticationPrincipal Jwt jwt) {

        item.setTenantId(jwt.getSubject());
        return service.saveItem(item);
    }

    /**
     * PUT /api/inventory/{id}
     * Updates an item only if it belongs to the authenticated user.
     */
    @PutMapping("/{id}")
    public InventoryItem updateItem(
            @PathVariable UUID id,
            @RequestBody InventoryItem details,
            @AuthenticationPrincipal Jwt jwt) {

        // Passing jwt.getSubject() fixes the build error by matching the new Service signature
        return service.updateItem(id, details, jwt.getSubject());
    }

    /**
     * DELETE /api/inventory/{id}
     * Deletes an item only if it belongs to the authenticated user.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        // Passing jwt.getSubject() fixes the build error
        service.deleteItem(id, jwt.getSubject());
    }
}