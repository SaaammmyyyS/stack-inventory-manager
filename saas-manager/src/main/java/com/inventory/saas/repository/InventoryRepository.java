package com.inventory.saas.repository;

import com.inventory.saas.dto.InventoryTrashDTO;
import com.inventory.saas.model.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<InventoryItem, UUID>, JpaSpecificationExecutor<InventoryItem> {

        boolean existsBySkuAndTenantId(String sku, String tenantId);

        List<InventoryItem> findAllByTenantId(String tenantId);

        long countByTenantId(String tenantId);

        @Query(value = "SELECT count(*) FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N'", nativeQuery = true)
        long countByTenantIdAndDeletedFalse(@Param("tenantId") String tenantId);

        @Query(value = "SELECT * FROM inventory WHERE id = :id", nativeQuery = true)
        Optional<InventoryItem> findByIdIncludingDeleted(@Param("id") UUID id);

        @Query(value = "SELECT * FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N' " +
                "AND (:search IS NULL OR :search = '' OR name ILIKE CONCAT('%', :search, '%') OR sku ILIKE CONCAT('%', :search, '%')) " +
                "AND (:category IS NULL OR :category = '' OR category = :category)",
                countQuery = "SELECT count(*) FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N' " +
                        "AND (:search IS NULL OR :search = '' OR name ILIKE CONCAT('%', :search, '%') OR sku ILIKE CONCAT('%', :search, '%')) " +
                        "AND (:category IS NULL OR :category = '' OR category = :category)",
                nativeQuery = true)
        Page<InventoryItem> findByFilters(
                @Param("tenantId") String tenantId,
                @Param("search") String search,
                @Param("category") String category,
                Pageable pageable);

        @Query(value = "SELECT * FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N'",
                countQuery = "SELECT count(*) FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N'",
                nativeQuery = true)
        Page<InventoryItem> findByTenantIdAndDeletedFalse(@Param("tenantId") String tenantId, Pageable pageable);

        @Query(value = "SELECT * FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N' " +
                "AND (:search IS NULL OR :search = '' OR name ILIKE CONCAT('%', :search, '%') OR sku ILIKE CONCAT('%', :search, '%')) " +
                "AND (:category IS NULL OR :category = '' OR category = :category) " +
                "AND (:stockStatus IS NULL OR :stockStatus = '' OR " +
                "  CASE " +
                "    WHEN :stockStatus = 'in-stock' THEN quantity > 0 " +
                "    WHEN :stockStatus = 'low-stock' THEN quantity <= min_threshold AND quantity > 0 " +
                "    WHEN :stockStatus = 'out-of-stock' THEN quantity = 0 " +
                "    WHEN :stockStatus = 'overstock' THEN quantity > (min_threshold * 2) " +
                "    ELSE true " +
                "  END" +
                ") " +
                "AND (:minPrice IS NULL OR price >= :minPrice) " +
                "AND (:maxPrice IS NULL OR price <= :maxPrice)",
                countQuery = "SELECT count(*) FROM inventory WHERE tenant_id = :tenantId AND deleted = 'N' " +
                        "AND (:search IS NULL OR :search = '' OR name ILIKE CONCAT('%', :search, '%') OR sku ILIKE CONCAT('%', :search, '%')) " +
                        "AND (:category IS NULL OR :category = '' OR category = :category) " +
                        "AND (:stockStatus IS NULL OR :stockStatus = '' OR " +
                        "  CASE " +
                        "    WHEN :stockStatus = 'in-stock' THEN quantity > 0 " +
                        "    WHEN :stockStatus = 'low-stock' THEN quantity <= min_threshold AND quantity > 0 " +
                        "    WHEN :stockStatus = 'out-of-stock' THEN quantity = 0 " +
                        "    WHEN :stockStatus = 'overstock' THEN quantity > (min_threshold * 2) " +
                        "    ELSE true " +
                        "  END" +
                        ") " +
                        "AND (:minPrice IS NULL OR price >= :minPrice) " +
                        "AND (:maxPrice IS NULL OR price <= :maxPrice)",
                nativeQuery = true)
        Page<InventoryItem> findByAdvancedFilters(
                @Param("tenantId") String tenantId,
                @Param("search") String search,
                @Param("category") String category,
                @Param("stockStatus") String stockStatus,
                @Param("minPrice") Double minPrice,
                @Param("maxPrice") Double maxPrice,
                Pageable pageable);

        @Query(value = "SELECT * FROM inventory WHERE id = :id AND tenant_id = :tenantId AND deleted = 'N'", nativeQuery = true)
        Optional<InventoryItem> findByIdAndTenantIdAndDeletedFalse(@Param("id") UUID id, @Param("tenantId") String tenantId);

        @Query(value = "SELECT i.id as id, i.name as name, i.sku as sku, i.category as category, " +
                "(SELECT t.performed_by FROM stock_transactions t " +
                " WHERE t.inventory_item_id = i.id AND t.type = 'DELETED' " +
                " ORDER BY t.created_at DESC LIMIT 1) as deletedBy " +
                "FROM inventory i " +
                "WHERE i.tenant_id = :tenantId AND i.deleted = 'Y'",
                nativeQuery = true)
        List<InventoryTrashDTO> findTrashByTenantId(@Param("tenantId") String tenantId);

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