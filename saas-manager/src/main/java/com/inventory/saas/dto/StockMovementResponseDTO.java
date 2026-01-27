package com.inventory.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementResponseDTO {
    private UUID id;
    private Integer quantityChange;
    private String type;
    private String reason;
    private String performedBy;
    private LocalDateTime createdAt;
    private String itemName;
}