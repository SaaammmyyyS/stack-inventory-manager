package com.inventory.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryForecastResponseDTO {
    private String sku;
    private String itemName;
    private Integer currentStock;
    private String recommendation;
    private String reasoning;
    private Integer predictedDaysUntilOut;
}