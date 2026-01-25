package com.inventory.saas.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class InventoryItemDTO {
    private UUID id;
    private String name;
    private String sku;
    private String category;
    private Integer quantity;
    private Integer minThreshold;
    private BigDecimal price;
}