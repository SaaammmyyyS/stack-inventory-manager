package com.inventory.saas.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.TenantId;
import org.hibernate.annotations.SoftDelete;
import org.hibernate.type.YesNoConverter;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "inventory")
@SoftDelete(columnName = "deleted", converter = YesNoConverter.class)
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String sku;

    private String category;

    @Column(nullable = false)
    private Integer quantity = 0;

    private Integer minThreshold;

    private BigDecimal price;

    @OneToMany(mappedBy = "inventoryItem", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<StockTransaction> transactions;

    @Column(name = "deleted", insertable = false, updatable = false)
    private String deleted;
}