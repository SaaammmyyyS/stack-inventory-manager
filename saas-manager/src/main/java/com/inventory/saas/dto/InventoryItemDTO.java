package com.inventory.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {
    private UUID id;
    private String name;
    private String sku;
    private String category;
    private Integer quantity;
    private Integer minThreshold;
    private BigDecimal price;
    private String deletedBy;
}