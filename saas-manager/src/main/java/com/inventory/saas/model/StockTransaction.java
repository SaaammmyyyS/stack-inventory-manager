package com.inventory.saas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.TenantId;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Table(name = "stock_transactions",
       indexes = {
           @Index(name = "idx_transaction_tenant", columnList = "tenant_id"),
           @Index(name = "idx_transaction_item", columnList = "inventory_item_id"),
           @Index(name = "idx_transaction_tenant_created", columnList = "tenant_id, created_at"),
           @Index(name = "idx_transaction_type", columnList = "type")
       })
public class StockTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id")
    @JsonIgnore
    private InventoryItem inventoryItem;

    private Integer quantityChange;
    private String type;
    private String reason;
    private String performedBy;
    private LocalDateTime createdAt = LocalDateTime.now();
}