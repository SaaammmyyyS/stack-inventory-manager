package com.inventory.saas.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventorySummaryAnalysisDTO {

    @JsonProperty("status")
    private String status;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("urgentActions")
    private List<String> urgentActions = new ArrayList<>();

    @JsonProperty("healthScore")
    private int healthScore;
}