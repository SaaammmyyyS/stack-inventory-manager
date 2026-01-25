package com.inventory.saas.repository;

import com.inventory.saas.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<StockTransaction, UUID> {

    List<StockTransaction> findByInventoryItemId(UUID itemId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM stock_transactions WHERE inventory_item_id = :itemId", nativeQuery = true)
    void deleteByInventoryItemIdNative(@Param("itemId") UUID itemId);

    @Query(value = "SELECT t.performed_by FROM stock_transactions t " +
            "WHERE t.inventory_item_id = :itemId AND t.type = 'DELETED' " +
            "ORDER BY t.created_at DESC LIMIT 1", nativeQuery = true)
    String findDeleterByItemId(@Param("itemId") UUID itemId);
}