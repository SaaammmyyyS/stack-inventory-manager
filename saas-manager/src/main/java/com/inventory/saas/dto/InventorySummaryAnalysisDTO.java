package com.inventory.saas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class InventorySummaryAnalysisDTO {

    @JsonProperty("status")
    private String status;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("urgentActions")
    private List<String> urgentActions;

    @JsonProperty("healthScore")
    private int healthScore;
}