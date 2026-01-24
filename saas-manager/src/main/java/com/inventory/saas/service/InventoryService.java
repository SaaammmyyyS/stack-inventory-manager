package com.inventory.saas.service;

import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository repository;

    public InventoryService(InventoryRepository repository) {
        this.repository = repository;
    }

    public List<InventoryItem> getItemsByTenant(String tenantId) {
        return repository.findByTenantId(tenantId);
    }

    public InventoryItem saveItem(InventoryItem item) {
        return repository.save(item);
    }

    // Fixed: Added tenantId to method signature
    public InventoryItem updateItem(UUID id, InventoryItem details, String tenantId) {
        return repository.findById(id)
                .filter(item -> item.getTenantId().equals(tenantId)) // Security check
                .map(item -> {
                    item.setName(details.getName());
                    item.setQuantity(details.getQuantity());
                    return repository.save(item);
                })
                .orElseThrow(() -> new RuntimeException("Not found or unauthorized"));
    }

    public void deleteItem(UUID id, String tenantId) {
        InventoryItem item = repository.findById(id)
                .filter(i -> i.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Not found or unauthorized"));
        repository.delete(item);
    }
}