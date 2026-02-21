package com.inventory.saas.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PaginatedResponseDTO<T> {
    private List<T> items;
    private long total;
    private int currentPage;
    private int totalPages;
    private int pageSize;
    private boolean hasNext;
    private boolean hasPrevious;
}