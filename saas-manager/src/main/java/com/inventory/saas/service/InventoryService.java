package com.inventory.saas.service;

import com.inventory.saas.dto.InventoryTrashDTO;
import com.inventory.saas.dto.StockMovementResponseDTO;
import com.inventory.saas.exception.ConflictException;
import com.inventory.saas.exception.ResourceNotFoundException;
import com.inventory.saas.exception.ValidationException;
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

import java.time.LocalDateTime;
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
        int zeroBasedPage = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(zeroBasedPage, size, Sort.by("name").ascending());
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
                throw new ConflictException(
                    "Product with SKU '" + item.getSku() + "' already exists.",
                    "sku",
                    item.getSku()
                );
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
    @CacheEvict(value = "ai-analysis", key = "#tenantId")
    public StockTransaction recordMovement(UUID id, Integer amount, String type, String reason, String performedBy, String tenantId) {
        logger.info("Recording stock movement: itemId={}, amount={}, type={}, reason={}, performedBy={}, tenantId={}",
            id, amount, type, reason, performedBy, tenantId);

        InventoryItem item = repository.findByIdAndTenantIdAndDeletedFalse(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));

        evictAiCache(tenantId);

        if (type.equalsIgnoreCase("STOCK_OUT") && item.getQuantity() < amount) {
            throw new ValidationException(
                "Insufficient stock for deduction",
                "quantity",
                item.getQuantity(),
                "Cannot deduct " + amount + " units from current stock of " + item.getQuantity()
            );
        }

        int adjustment = type.equalsIgnoreCase("STOCK_OUT") ? -Math.abs(amount) : Math.abs(amount);
        item.setQuantity(item.getQuantity() + adjustment);
        repository.save(item);

        StockTransaction transaction = new StockTransaction();
        transaction.setInventoryItem(item);
        transaction.setTenantId(tenantId);
        transaction.setQuantityChange(adjustment);
        transaction.setType(type.toUpperCase());
        transaction.setReason(reason);
        transaction.setPerformedBy(performedBy != null ? performedBy : "System");

        StockTransaction saved = transactionRepository.save(transaction);
        logger.info("Saved transaction: id={}, type={}, quantityChange={}, itemId={}, tenantId={}",
            saved.getId(), saved.getType(), saved.getQuantityChange(), item.getId(), tenantId);

        return saved;
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
        return getRecentTransactionsRaw(tenantId, 10, null, null);
    }

    public List<StockMovementResponseDTO> getRecentTransactionsRaw(
            String tenantId, Integer limit, LocalDateTime startDate, LocalDateTime endDate) {
        Integer effectiveLimit = (limit != null && limit > 0) ?
            Math.min(limit, 1000) : 10;

        LocalDateTime effectiveStartDate = startDate;
        LocalDateTime effectiveEndDate = endDate;

        if (effectiveStartDate == null && effectiveEndDate == null) {
            effectiveEndDate = LocalDateTime.now();
            effectiveStartDate = effectiveEndDate.minusDays(30);
        } else if (effectiveStartDate == null) {
            effectiveStartDate = effectiveEndDate.minusDays(30);
        } else if (effectiveEndDate == null) {
            effectiveEndDate = LocalDateTime.now();
        }

        if (effectiveStartDate.isAfter(effectiveEndDate)) {
            LocalDateTime temp = effectiveStartDate;
            effectiveStartDate = effectiveEndDate;
            effectiveEndDate = temp;
        }

        logger.info("Getting recent transactions for tenant: {} with limit: {}, date range: {} to {}",
                   tenantId, effectiveLimit, effectiveStartDate, effectiveEndDate);

        List<Map<String, Object>> rawData;

        if (startDate != null || endDate != null) {
            rawData = transactionRepository.findRecentTransactionsWithDateRange(
                tenantId, effectiveLimit, effectiveStartDate, effectiveEndDate);
        } else {
            rawData = transactionRepository.findRecentTransactionsRaw(tenantId, effectiveLimit);
        }

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

    public List<StockTransaction> getAllTransactionsForDebug(String tenantId) {
        logger.info("Retrieving all transactions for debug - tenant: {}", tenantId);
        List<StockTransaction> transactions = transactionRepository.findAllTransactionsByTenant(tenantId);
        logger.info("Found {} total transactions for tenant {}", transactions.size(), tenantId);

        Map<String, Long> typeCounts = transactions.stream()
            .collect(Collectors.groupingBy(
                t -> t.getType() != null ? t.getType() : "NULL",
                Collectors.counting()
            ));
        logger.info("Transaction type distribution for debug: {}", typeCounts);

        return transactions;
    }
}