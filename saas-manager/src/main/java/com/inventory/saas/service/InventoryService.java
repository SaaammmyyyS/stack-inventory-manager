package com.inventory.saas.service;

import com.inventory.saas.dto.InventoryTrashDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.exception.ResourceNotFoundException;
import com.inventory.saas.model.InventoryItem;
import com.inventory.saas.model.StockTransaction;
import com.inventory.saas.repository.InventoryRepository;
import com.inventory.saas.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);
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

    public Optional<InventoryItem> getItemByIdAndTenant(UUID id, String tenantId) {
        return repository.findByIdAndTenantIdAndDeletedFalse(id, tenantId);
    }

    @Transactional
    @CacheEvict(value = "ai-analysis", key = "#item.tenantId")
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
    @CacheEvict(value = "ai-analysis", key = "#details.tenantId")
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

        evictAiCache(item.getTenantId());

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

        evictAiCache(item.getTenantId());

        StockTransaction deleteLog = new StockTransaction();
        deleteLog.setInventoryItem(item);
        deleteLog.setTenantId(item.getTenantId());
        deleteLog.setType("DELETED");
        deleteLog.setReason("Item moved to recycle bin");
        deleteLog.setPerformedBy(performedBy);
        deleteLog.setQuantityChange(0);

        transactionRepository.save(deleteLog);
        repository.softDeleteById(id);
    }

    @Transactional
    public void restoreItem(UUID id) {

        InventoryItem item = repository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        evictAiCache(item.getTenantId());
        repository.restoreById(id);
    }

    @Transactional
    public void hardDeleteItem(UUID id) {
        InventoryItem item = repository.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        evictAiCache(item.getTenantId());

        transactionRepository.deleteByInventoryItemIdNative(id);
        repository.flush();
        repository.hardDeleteNative(id);
    }

    @CacheEvict(value = "ai-analysis", key = "#tenantId")
    public void evictAiCache(String tenantId) {
        logger.info("Evicting AI cache for tenant: {}", tenantId);
    }

    public List<InventoryTrashDTO> getTrashItems(String tenantId) {
        return repository.findTrashByTenantId(tenantId);
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