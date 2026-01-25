package com.inventory.saas.dto;

import lombok.Data;

@Data
public class MovementRequest {
    private Integer amount;
    private String type;
    private String reason;
    private String performedBy;
}