package com.inventory.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockAIInsightDTO {
    private String itemName;
    private String sku;
    private Integer currentQuantity;
    private Integer daysRemaining;
    private LocalDate predictedDepletionDate;
    private String healthStatus;
    private Integer suggestedThreshold;
    private String thresholdReason;
}