package com.inventory.saas.service;

import com.inventory.saas.exception.ResourceNotFoundException;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final InventoryRepository repository;
    private final TransactionRepository transactionRepository;

    public InventoryService(InventoryRepository repository, TransactionRepository transactionRepository) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
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
                    item.setSku(details.getSku());
                    item.setCategory(details.getCategory());
                    item.setMinThreshold(details.getMinThreshold());
                    item.setPrice(details.getPrice());
                    return repository.save(item);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Item with ID " + id + " not found"));
    }

    @Transactional
    public StockTransaction recordMovement(UUID id, Integer amount, String type, String reason, String performedBy) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));

        int adjustment = type.equalsIgnoreCase("STOCK_OUT") ? -Math.abs(amount) : Math.abs(amount);
        int newQuantity = item.getQuantity() + adjustment;

        if (newQuantity < 0) {
            throw new IllegalStateException("Insufficient stock: Cannot remove " + amount + " units. Current balance: " + item.getQuantity());
        }

        item.setQuantity(newQuantity);
        repository.save(item);

        StockTransaction transaction = new StockTransaction();
        transaction.setInventoryItem(item);
        transaction.setTenantId(item.getTenantId());
        transaction.setQuantityChange(adjustment);
        transaction.setType(type.toUpperCase());
        transaction.setReason(reason);
        transaction.setPerformedBy(performedBy != null ? performedBy : "System");

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void deleteItem(UUID id, String performedBy) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot delete: Item not found"));

        StockTransaction deleteLog = new StockTransaction();
        deleteLog.setInventoryItem(item);
        deleteLog.setTenantId(item.getTenantId());
        deleteLog.setQuantityChange(0);
        deleteLog.setType("DELETED");
        deleteLog.setReason("Soft delete performed");
        deleteLog.setPerformedBy(performedBy != null ? performedBy : "Admin");

        transactionRepository.save(deleteLog);

        repository.softDeleteById(id);
    }

    public List<StockTransaction> getItemHistory(UUID id) {
        return transactionRepository.findByInventoryItemId(id);
    }
}