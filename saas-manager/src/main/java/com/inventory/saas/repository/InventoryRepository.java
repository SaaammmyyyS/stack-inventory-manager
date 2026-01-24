package com.inventory.saas.repository;

import com.inventory.saas.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findByTenantId(String tenantId);
}