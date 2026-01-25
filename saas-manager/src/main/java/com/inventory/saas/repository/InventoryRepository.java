package com.inventory.saas.repository;

import com.inventory.saas.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<InventoryItem, UUID> {

    @Query(value = "SELECT * FROM inventory WHERE tenant_id = :tenantId AND deleted = 'Y'", nativeQuery = true)
    List<InventoryItem> findTrashedItems(@Param("tenantId") String tenantId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE inventory SET deleted = 'Y' WHERE id = :id", nativeQuery = true)
    void softDeleteById(@Param("id") UUID id);

    @Modifying
    @Transactional
    @Query(value = "UPDATE inventory SET deleted = 'N' WHERE id = :id", nativeQuery = true)
    void restoreById(@Param("id") UUID id);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM inventory WHERE id = :itemId", nativeQuery = true)
    void hardDeleteNative(@Param("itemId") UUID itemId);
}