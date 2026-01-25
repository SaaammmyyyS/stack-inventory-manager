package com.inventory.saas.repository;

import com.inventory.saas.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<StockTransaction, UUID> {
    List<StockTransaction> findByInventoryItemId(UUID itemId);

    @Modifying
    @Transactional
    void deleteByInventoryItemId(UUID itemId);
}