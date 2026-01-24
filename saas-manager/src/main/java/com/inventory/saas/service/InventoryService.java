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

    public List<InventoryItem> getAllItems() {
        return repository.findAll();
    }

    public InventoryItem saveItem(InventoryItem item) {
        return repository.save(item);
    }

    public InventoryItem updateItem(UUID id, InventoryItem details) {
        return repository.findById(id)
                .map(item -> {
                    item.setName(details.getName());
                    item.setQuantity(details.getQuantity());
                    return repository.save(item);
                })
                .orElseThrow(() -> new RuntimeException("Item not found"));
    }

    public void deleteItem(UUID id) {
        repository.deleteById(id);
    }
}