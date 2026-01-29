package com.inventory.saas.service;

import com.inventory.saas.dto.InventoryTrashDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.exception.ResourceNotFoundException;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository repository;
    private final TransactionRepository transactionRepository;

    public InventoryService(InventoryRepository repository, TransactionRepository transactionRepository) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
    }

    public Page<InventoryItem> getAllItemsPaginated(String tenantId, String search, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        if ((search != null && !search.isEmpty()) || (category != null && !category.isEmpty())) {
            return repository.findByFilters(tenantId, search, category, pageable);
        }
        return repository.findByTenantIdAndDeletedFalse(tenantId, pageable);
    }

    public InventoryItem saveItem(InventoryItem item) {
        if (item.getSku() != null && !item.getSku().trim().isEmpty()) {
            boolean exists = repository.existsBySkuAndTenantId(item.getSku(), item.getTenantId());
            if (exists) {
                throw new RuntimeException("Product with SKU '" + item.getSku() + "' already exists.");
            }
        }
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
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id: " + id));

        int adjustment = type.equalsIgnoreCase("STOCK_OUT") ? -Math.abs(amount) : Math.abs(amount);

        if (type.equalsIgnoreCase("STOCK_OUT") && (item.getQuantity() + adjustment) < 0) {
            throw new RuntimeException("Insufficient stock. Current balance: " + item.getQuantity());
        }

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

    public List<InventoryTrashDTO> getTrashItems(String tenantId) {
        return repository.findTrashByTenantId(tenantId);
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

    public List<StockMovementResponseDTO> getRecentTransactionsRaw(String tenantId) {
        List<Map<String, Object>> rawData = transactionRepository.findRecentTransactionsRaw(tenantId);

        return rawData.stream().map(row -> StockMovementResponseDTO.builder()
                .id((UUID) row.get("id"))
                .quantityChange((Integer) row.get("quantityChange"))
                .type((String) row.get("type"))
                .reason((String) row.get("reason"))
                .performedBy((String) row.get("performedBy"))
                .createdAt(((java.sql.Timestamp) row.get("createdAt")).toLocalDateTime())
                .itemName((String) row.get("itemName"))
                .build()
        ).collect(Collectors.toList());
    }
}