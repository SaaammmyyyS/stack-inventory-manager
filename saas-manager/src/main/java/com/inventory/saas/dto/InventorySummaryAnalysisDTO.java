package com.inventory.saas.dto;

import lombok.Data;
import java.util.List;

@Data
public class InventorySummaryAnalysisDTO {
    private String status;
    private String summary;
    private List<String> urgentActions;
    private int healthScore;
}