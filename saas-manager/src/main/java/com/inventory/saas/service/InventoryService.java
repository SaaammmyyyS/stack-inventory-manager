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

    @Transactional
    public InventoryItem updateItem(UUID id, InventoryItem details) {
        return repository.findById(id).map(item -> {
            item.setName(details.getName());
            item.setSku(details.getSku());
            item.setCategory(details.getCategory());
            item.setMinThreshold(details.getMinThreshold());
            item.setPrice(details.getPrice());
            return repository.save(item);
        }).orElseThrow(() -> new ResourceNotFoundException("Item not found"));
    }

    @Transactional
    public StockTransaction recordMovement(UUID id, Integer amount, String type, String reason, String performedBy) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));

        int adjustment = type.equalsIgnoreCase("STOCK_OUT") ? -Math.abs(amount) : Math.abs(amount);
        item.setQuantity(item.getQuantity() + adjustment);
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
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        StockTransaction deleteLog = new StockTransaction();
        deleteLog.setInventoryItem(item);
        deleteLog.setTenantId(item.getTenantId());
        deleteLog.setQuantityChange(0);
        deleteLog.setType("DELETED");
        deleteLog.setReason("Item moved to recycle bin");
        deleteLog.setPerformedBy(performedBy);

        transactionRepository.save(deleteLog);

        repository.softDeleteById(id);
    }

    public List<InventoryItem> getTrashedItems(String tenantId) {
        return repository.findTrashedItems(tenantId);
    }

    @Transactional
    public void restoreItem(UUID id) {
        repository.restoreById(id);
    }

    @Transactional
    public void hardDeleteItem(UUID id) {
        transactionRepository.deleteByInventoryItemIdNative(id);

        repository.flush();

        repository.hardDeleteNative(id);
    }

    public List<StockTransaction> getItemHistory(UUID id) {
        return transactionRepository.findByInventoryItemId(id);
    }
}