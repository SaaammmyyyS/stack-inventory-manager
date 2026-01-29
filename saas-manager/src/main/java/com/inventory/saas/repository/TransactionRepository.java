package com.inventory.saas.repository;

import com.inventory.saas.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<StockTransaction, UUID> {

    List<StockTransaction> findByInventoryItemId(UUID inventoryItemId);

    @Query("SELECT t FROM StockTransaction t LEFT JOIN FETCH t.inventoryItem " +
            "WHERE t.tenantId = :tenantId ORDER BY t.createdAt DESC")
    List<StockTransaction> findTop10ByTenantIdOrderByCreatedAtDesc(@Param("tenantId") String tenantId);

    /**
     * Used by InventoryService for the Dashboard.
     * Returns raw maps to completely bypass Hibernate's association filtering logic.
     */
    @Query(value = "SELECT t.id as id, t.quantity_change as quantityChange, t.type as type, " +
            "t.reason as reason, t.performed_by as performedBy, t.created_at as createdAt, " +
            "i.name as itemName " +
            "FROM stock_transactions t " +
            "JOIN inventory i ON t.inventory_item_id = i.id " +
            "WHERE t.tenant_id = :tenantId " +
            "ORDER BY t.created_at DESC LIMIT 10", nativeQuery = true)
    List<Map<String, Object>> findRecentTransactionsRaw(@Param("tenantId") String tenantId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM stock_transactions WHERE inventory_item_id = :itemId", nativeQuery = true)
    void deleteByInventoryItemIdNative(@Param("itemId") UUID itemId);

    @Query(value = "SELECT t.performed_by FROM stock_transactions t " +
            "WHERE t.inventory_item_id = :itemId AND t.type = 'DELETED' " +
            "ORDER BY t.created_at DESC LIMIT 1", nativeQuery = true)
    String findDeleterByItemId(@Param("itemId") UUID itemId);
}