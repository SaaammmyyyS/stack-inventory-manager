package com.inventory.saas.controller;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.service.InventoryService;
import com.inventory.saas.config.TenantContext;
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

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<InventoryItem> getInventory() {
        return service.getAllItems();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItem createItem(@RequestBody InventoryItem item) {
        return service.saveItem(item);
    }

    @PutMapping("/{id}")
    public InventoryItem updateItem(@PathVariable UUID id, @RequestBody InventoryItem details) {
        return service.updateItem(id, details);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable UUID id) {
        service.deleteItem(id);
    }
}