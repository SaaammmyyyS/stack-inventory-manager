package com.inventory.saas.repository;

import com.inventory.saas.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<InventoryItem, UUID> {

    @Modifying
    @Query("UPDATE InventoryItem i SET i.deleted = 'Y' WHERE i.id = :id")
    void softDeleteById(@Param("id") UUID id);
}